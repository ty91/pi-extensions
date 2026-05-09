import type { AgentToolUpdateCallback, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/*
 * Models that should run under the apply_patch-only policy.
 * We don't gate on provider because the same models may be routed through proxies.
 */
const APPLY_PATCH_MODEL_ID_PREFIX = "gpt-5";

// Tool-call preview limits for the TUI (avoid huge renders for big diffs).
const PATCH_PREVIEW_MAX_LINES = 16;
const PATCH_PREVIEW_MAX_CHARS = 4000;

// Decide whether the active model should be forced into apply_patch-only mode.
function usesApplyPatchPolicy(ctx: ExtensionContext): boolean {
	const model = ctx.model;
	if (!model) return false;
	return model.id.toLowerCase().startsWith(APPLY_PATCH_MODEL_ID_PREFIX);
}

// Types used for tool progress and result reporting in the TUI.
type ApplyPatchOpType = "create_file" | "update_file" | "delete_file";

interface ApplyPatchOperation {
	type: ApplyPatchOpType;
	path: string;
	/**
	 * Codex/V4A diff body.
	 * - create_file: full file content (each line starts with '+')
	 * - update_file: @@ sections with +/-/space lines
	 */
	diff?: string;
	/** Optional move target from `*** Move to:`. */
	move_path?: string;
}

type ApplyPatchDetails =
	| { stage: "progress"; message: string }
	| {
			stage: "done";
			fuzz: number;
			results: Array<{ type: ApplyPatchOpType; path: string; status: "completed" | "failed"; output?: string }>;
	  };

// Emit a progress update (used by the tool renderer).
function progress(onUpdate: AgentToolUpdateCallback<ApplyPatchDetails> | undefined, message: string): void {
	onUpdate?.({ content: [{ type: "text", text: message }], details: { stage: "progress", message } });
}

// Errors thrown by the diff parser/application are surfaced to the model as tool failures.
class DiffError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DiffError";
	}
}

// Normalize line endings to LF so diff parsing is consistent across platforms.
function normalizeLineEndings(text: string): string {
	return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// Minimal path validation. Codex apply_patch allows absolute paths and paths outside cwd;
// relative paths are resolved against cwd when applying.
function validatePatchPath(p: string): string {
	const raw = p.trim();
	if (!raw) throw new DiffError("Invalid path: empty");
	if (raw.includes("\u0000")) throw new DiffError("Invalid path: contains NUL");
	return raw;
}

// Resolve a patch path. Absolute paths are used as-is; relative paths resolve against cwd.
function toFsPath(cwd: string, patchPath: string): string {
	return path.isAbsolute(patchPath) ? path.normalize(patchPath) : path.resolve(cwd, patchPath);
}

// Cheap existence check used for create/update/delete preconditions.
async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.stat(p);
		return true;
	} catch {
		return false;
	}
}

// Parsed diff chunk: where to delete lines and insert new ones.
interface Chunk {
	origIndex: number;
	delLines: string[];
	insLines: string[];
}

// Parse a single V4A section into context + chunks, returning the next index.
function peekNextSection(
	lines: string[],
	startIndex: number,
): { context: string[]; chunks: Chunk[]; nextIndex: number; eof: boolean } {
	const old: string[] = [];
	let delLines: string[] = [];
	let insLines: string[] = [];
	const chunks: Chunk[] = [];

	let mode: "keep" | "add" | "delete" = "keep";
	const origIndex = startIndex;
	let index = startIndex;

	while (index < lines.length) {
		const s0 = lines[index]!;
		if (
			s0.startsWith("@@") ||
			s0.startsWith("*** End of File") ||
			s0.startsWith("*** End Patch") ||
			s0.startsWith("*** Update File:") ||
			s0.startsWith("*** Delete File:") ||
			s0.startsWith("*** Add File:")
		) {
			break;
		}
		if (s0 === "***") break;
		if (s0.startsWith("***")) throw new DiffError(`Invalid Line: ${s0}`);

		index++;
		const lastMode = mode;
		let s = s0;
		if (s === "") s = " ";

		const prefix = s[0];
		if (prefix === "+") mode = "add";
		else if (prefix === "-") mode = "delete";
		else if (prefix === " ") mode = "keep";
		else throw new DiffError(`Invalid Line: ${s0}`);

		s = s.slice(1);

		if (mode === "keep" && lastMode !== mode) {
			if (insLines.length > 0 || delLines.length > 0) {
				chunks.push({ origIndex: old.length - delLines.length, delLines, insLines });
				delLines = [];
				insLines = [];
			}
		}

		if (mode === "delete") {
			delLines.push(s);
			old.push(s);
		} else if (mode === "add") {
			insLines.push(s);
		} else {
			old.push(s);
		}
	}

	if (insLines.length > 0 || delLines.length > 0) {
		chunks.push({ origIndex: old.length - delLines.length, delLines, insLines });
	}

	if (index < lines.length && lines[index] === "*** End of File") {
		index++;
		return { context: old, chunks, nextIndex: index, eof: true };
	}

	if (index === origIndex) {
		throw new DiffError(`Nothing in this section - index=${index} line='${lines[index] ?? ""}'`);
	}

	return { context: old, chunks, nextIndex: index, eof: false };
}

// Find a matching context block in the target file, with fuzzy fallbacks.
function findContextCore(lines: string[], context: string[], start: number): { index: number; fuzz: number } {
	if (context.length === 0) return { index: start, fuzz: 0 };

	for (let i = start; i <= lines.length - context.length; i++) {
		let ok = true;
		for (let j = 0; j < context.length; j++) {
			if (lines[i + j] !== context[j]) {
				ok = false;
				break;
			}
		}
		if (ok) return { index: i, fuzz: 0 };
	}

	const rstrip = (s: string) => s.replace(/\s+$/g, "");
	for (let i = start; i <= lines.length - context.length; i++) {
		let ok = true;
		for (let j = 0; j < context.length; j++) {
			if (rstrip(lines[i + j]!) !== rstrip(context[j]!)) {
				ok = false;
				break;
			}
		}
		if (ok) return { index: i, fuzz: 1 };
	}

	const strip = (s: string) => s.trim();
	for (let i = start; i <= lines.length - context.length; i++) {
		let ok = true;
		for (let j = 0; j < context.length; j++) {
			if (strip(lines[i + j]!) !== strip(context[j]!)) {
				ok = false;
				break;
			}
		}
		if (ok) return { index: i, fuzz: 100 };
	}

	return { index: -1, fuzz: 0 };
}

// If the section is marked EOF, prefer matching near file end; otherwise match forward.
function findContext(lines: string[], context: string[], start: number, eof: boolean): { index: number; fuzz: number } {
	if (eof) {
		const atEof = findContextCore(lines, context, Math.max(0, lines.length - context.length));
		if (atEof.index !== -1) return atEof;
		const fallback = findContextCore(lines, context, start);
		return { index: fallback.index, fuzz: fallback.fuzz + 10000 };
	}
	return findContextCore(lines, context, start);
}

// Apply a V4A update diff to existing file content.
// Returns updated content plus a fuzz score when context matching was inexact.
function applyV4AUpdate(input: string, diff: string): { output: string; fuzz: number } {
	// IMPORTANT: do NOT trim() here. V4A diff lines may start with a leading space (context lines).
	const normalizedDiff = normalizeLineEndings(diff);
	const patchLines = normalizedDiff.split("\n");
	// Drop a single trailing newline to avoid creating an extra empty diff line.
	if (patchLines.length > 0 && patchLines[patchLines.length - 1] === "") patchLines.pop();

	const fileLines = normalizeLineEndings(input).split("\n");

	let fuzz = 0;
	const chunks: Chunk[] = [];
	let patchIndex = 0;
	let fileIndex = 0;

	while (patchIndex < patchLines.length) {
		// Section marker
		const line = patchLines[patchIndex] ?? "";
		let defStr = "";
		if (line.startsWith("@@ ")) {
			defStr = line.slice(3);
			patchIndex++;
		} else if (line === "@@") {
			patchIndex++;
		} else if (patchIndex === 0) {
			// Allow diffs without leading @@ (common in some examples)
		} else {
			throw new DiffError(`Invalid diff (expected @@ section): ${line}`);
		}

		if (defStr.trim()) {
			let found = false;
			if (!fileLines.slice(0, fileIndex).some((s) => s === defStr)) {
				for (let i = fileIndex; i < fileLines.length; i++) {
					if (fileLines[i] === defStr) {
						fileIndex = i + 1;
						found = true;
						break;
					}
				}
				if (!found && !fileLines.slice(0, fileIndex).some((s) => s.trim() === defStr.trim())) {
					for (let i = fileIndex; i < fileLines.length; i++) {
						if (fileLines[i]!.trim() === defStr.trim()) {
							fileIndex = i + 1;
							fuzz += 1;
							found = true;
							break;
						}
					}
				}
			}
		}

		const { context, chunks: sectionChunks, nextIndex, eof } = peekNextSection(patchLines, patchIndex);
		const nextChunkText = context.join("\n");
		const found = findContext(fileLines, context, fileIndex, eof);
		if (found.index === -1) {
			if (eof) throw new DiffError(`Invalid EOF Context ${fileIndex}:\n${nextChunkText}`);
			throw new DiffError(`Invalid Context ${fileIndex}:\n${nextChunkText}`);
		}

		fuzz += found.fuzz;
		for (const ch of sectionChunks) {
			chunks.push({
				origIndex: ch.origIndex + found.index,
				delLines: ch.delLines,
				insLines: ch.insLines,
			});
		}

		fileIndex = found.index + context.length;
		patchIndex = nextIndex;
	}

	// Apply chunks
	const dest: string[] = [];
	let origIndex = 0;
	for (const chunk of chunks) {
		if (origIndex > chunk.origIndex) {
			throw new DiffError(`applyDiff: origIndex ${origIndex} > chunk.origIndex ${chunk.origIndex}`);
		}

		dest.push(...fileLines.slice(origIndex, chunk.origIndex));
		origIndex = chunk.origIndex;

		const expected = chunk.delLines;
		const actual = fileLines.slice(origIndex, origIndex + expected.length);
		const same = expected.length === actual.length && expected.every((l, i) => l === actual[i]);
		if (!same) {
			throw new DiffError(
				`Patch conflict at line ${origIndex + 1}. Expected:\n${expected.join("\n")}\n\nActual:\n${actual.join("\n")}`,
			);
		}

		dest.push(...chunk.insLines);
		origIndex += expected.length;
	}
	// Tail
	dest.push(...fileLines.slice(origIndex));
	return { output: dest.join("\n"), fuzz };
}

// Apply a V4A create diff (every line starts with '+') and return file content.
function applyV4ACreate(diff: string): string {
	const lines = normalizeLineEndings(diff).split("\n");
	// Drop trailing empty line to avoid an extra empty content line.
	if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

	const out: string[] = [];
	for (const line of lines) {
		if (!line.startsWith("+")) {
			throw new DiffError(`Invalid create_file diff line (must start with '+'): ${line}`);
		}
		out.push(line.slice(1));
	}
	return out.join("\n") + (out.length > 0 ? "\n" : "");
}

const BEGIN_PATCH_MARKER = "*** Begin Patch";
const END_PATCH_MARKER = "*** End Patch";
const ADD_FILE_MARKER = "*** Add File: ";
const DELETE_FILE_MARKER = "*** Delete File: ";
const UPDATE_FILE_MARKER = "*** Update File: ";
const MOVE_TO_MARKER = "*** Move to: ";

function isFileHeader(line: string): boolean {
	return line.startsWith(ADD_FILE_MARKER) || line.startsWith(DELETE_FILE_MARKER) || line.startsWith(UPDATE_FILE_MARKER);
}

// Parse a Codex apply_patch envelope into the internal operation list.
function parseCodexPatch(patch: string): ApplyPatchOperation[] {
	const normalized = normalizeLineEndings(patch).trim();
	if (!normalized) throw new DiffError("Invalid patch: empty");

	const lines = normalized.split("\n");
	const first = lines[0]?.trim();
	const last = lines[lines.length - 1]?.trim();
	if (first !== BEGIN_PATCH_MARKER) {
		throw new DiffError(`Invalid patch: first line must be '${BEGIN_PATCH_MARKER}'`);
	}
	if (last !== END_PATCH_MARKER) {
		throw new DiffError(`Invalid patch: last line must be '${END_PATCH_MARKER}'`);
	}

	const operations: ApplyPatchOperation[] = [];
	const endIndex = lines.length - 1;
	let index = 1;

	while (index < endIndex) {
		const header = lines[index]!.trim();
		if (!header) {
			index++;
			continue;
		}

		if (header.startsWith(ADD_FILE_MARKER)) {
			const filePath = validatePatchPath(header.slice(ADD_FILE_MARKER.length));
			index++;

			const diffLines: string[] = [];
			while (index < endIndex) {
				const line = lines[index]!;
				if (isFileHeader(line.trim())) break;
				if (!line.startsWith("+")) {
					throw new DiffError(`Invalid Add File line for ${filePath}: ${line}`);
				}
				diffLines.push(line);
				index++;
			}

			if (diffLines.length === 0) throw new DiffError(`Add File hunk for path '${filePath}' is empty`);
			operations.push({ type: "create_file", path: filePath, diff: diffLines.join("\n") });
			continue;
		}

		if (header.startsWith(DELETE_FILE_MARKER)) {
			operations.push({ type: "delete_file", path: validatePatchPath(header.slice(DELETE_FILE_MARKER.length)) });
			index++;
			continue;
		}

		if (header.startsWith(UPDATE_FILE_MARKER)) {
			const filePath = validatePatchPath(header.slice(UPDATE_FILE_MARKER.length));
			index++;

			let movePath: string | undefined;
			if (index < endIndex) {
				const maybeMove = lines[index]!.trim();
				if (maybeMove.startsWith(MOVE_TO_MARKER)) {
					movePath = validatePatchPath(maybeMove.slice(MOVE_TO_MARKER.length));
					index++;
				}
			}

			const diffLines: string[] = [];
			while (index < endIndex) {
				const line = lines[index]!;
				if (isFileHeader(line.trim())) break;
				diffLines.push(line);
				index++;
			}

			if (diffLines.length === 0) throw new DiffError(`Update File hunk for path '${filePath}' is empty`);
			operations.push({ type: "update_file", path: filePath, diff: diffLines.join("\n"), move_path: movePath });
			continue;
		}

		throw new DiffError(
			`Invalid patch hunk header: ${header}. Valid headers: '${ADD_FILE_MARKER}{path}', '${DELETE_FILE_MARKER}{path}', '${UPDATE_FILE_MARKER}{path}'`,
		);
	}

	return operations;
}

// Atomic write using a temp file in the same directory. Best-effort mode preservation.
async function writeFileAtomic(abs: string, content: string, mode?: number): Promise<void> {
	const dir = path.dirname(abs);
	const base = path.basename(abs);
	const tmp = path.join(dir, `.${base}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`);

	await fs.writeFile(tmp, content, "utf8");
	if (typeof mode === "number") {
		try {
			await fs.chmod(tmp, mode);
		} catch {
			// ignore (best effort)
		}
	}

	try {
		await fs.rename(tmp, abs);
	} catch (err) {
		// Windows can fail rename() if the target exists.
		try {
			await fs.unlink(abs);
			await fs.rename(tmp, abs);
		} catch {
			try {
				await fs.unlink(tmp);
			} catch {
				// ignore
			}
			throw err;
		}
	}
}

// Apply operations sequentially. Stop at the first failure; no rollback.
async function applyOperations(
	operations: ApplyPatchOperation[],
	cwd: string,
	signal?: AbortSignal,
	onProgress?: (message: string) => void,
): Promise<{ fuzz: number; results: Array<{ type: ApplyPatchOpType; path: string; status: "completed" | "failed"; output?: string }> }> {
	const results: Array<{ type: ApplyPatchOpType; path: string; status: "completed" | "failed"; output?: string }> = [];
	let fuzzTotal = 0;
	if (operations.length === 0) {
		return {
			fuzz: 0,
			results: [{ type: "update_file", path: "(patch)", status: "failed", output: "No files were modified." }],
		};
	}

	onProgress?.(`Applying ${operations.length} operation(s)...`);

	for (let i = 0; i < operations.length; i++) {
		if (signal?.aborted) throw new Error("Aborted");

		const op = operations[i]!;
		const type = op.type;

		let rel: string;
		let abs: string;
		try {
			rel = validatePatchPath(op.path);
			abs = toFsPath(cwd, rel);
		} catch (err) {
			results.push({
				type,
				path: typeof op.path === "string" ? op.path : "(invalid)",
				status: "failed",
				output: err instanceof Error ? err.message : String(err),
			});
			return { fuzz: fuzzTotal, results };
		}

		onProgress?.(`${i + 1}/${operations.length} ${type} ${rel}`);

		try {
			if (type === "create_file") {
				if (typeof op.diff !== "string") throw new DiffError(`create_file missing diff for ${rel}`);

				const content = applyV4ACreate(op.diff);
				await fs.mkdir(path.dirname(abs), { recursive: true });
				await writeFileAtomic(abs, content);
				results.push({ type, path: rel, status: "completed" });
				continue;
			}

			if (type === "update_file") {
				if (typeof op.diff !== "string") throw new DiffError(`update_file missing diff for ${rel}`);
				if (!(await fileExists(abs))) throw new DiffError(`File not found at path '${rel}'`);

				const st = await fs.stat(abs);
				const current = await fs.readFile(abs, "utf8");
				const { output, fuzz } = applyV4AUpdate(current, op.diff);
				fuzzTotal += fuzz;

				if (op.move_path) {
					const relTo = validatePatchPath(op.move_path);
					const absTo = toFsPath(cwd, relTo);

					await fs.mkdir(path.dirname(absTo), { recursive: true });
					await writeFileAtomic(absTo, output, st.mode);
					await fs.unlink(abs);
					results.push({ type, path: relTo, status: "completed", output: `Moved from ${rel}` });
				} else {
					await fs.mkdir(path.dirname(abs), { recursive: true });
					await writeFileAtomic(abs, output, st.mode);
					results.push({ type, path: rel, status: "completed" });
				}
				continue;
			}

			// delete_file
			if (!(await fileExists(abs))) throw new DiffError(`File not found at path '${rel}'`);
			await fs.unlink(abs);
			results.push({ type, path: rel, status: "completed" });
		} catch (err) {
			results.push({
				type,
				path: rel,
				status: "failed",
				output: err instanceof Error ? err.message : String(err),
			});
			return { fuzz: fuzzTotal, results };
		}
	}

	return { fuzz: fuzzTotal, results };
}

// UI helpers for rendering tool arguments/results without flooding the TUI.
// Fast line count that scans at most maxScanChars.
function countNewlines(text: string, maxScanChars = 200_000): number {
	const s = text.length > maxScanChars ? text.slice(0, maxScanChars) : text;
	let n = 0;
	for (let i = 0; i < s.length; i++) {
		if (s.charCodeAt(i) === 10) n++;
	}
	return n;
}

// Create a small, readable diff preview for the TUI (head/tail truncation).
function makeDiffPreview(diff: string, maxLines = PATCH_PREVIEW_MAX_LINES, maxChars = PATCH_PREVIEW_MAX_CHARS): string {
	const text = normalizeLineEndings(diff);
	if (text.length <= maxChars && countNewlines(text, maxChars) + 1 <= maxLines) return text;

	const headCount = Math.max(6, Math.floor(maxLines / 2));
	const tailCount = Math.max(6, maxLines - headCount);
	const bigCutoff = maxChars * 8;
	const startSlice = text.length > bigCutoff ? text.slice(0, maxChars * 3) : text;
	const endSlice = text.length > bigCutoff ? text.slice(-maxChars * 3) : text;

	const headLines = startSlice.split("\n").slice(0, headCount);
	const tailLines = endSlice.split("\n");
	const tail = tailLines.slice(Math.max(0, tailLines.length - tailCount));

	let preview = [...headLines, "…", ...tail].join("\n");
	if (preview.length > maxChars) {
		preview = preview.slice(0, maxChars).trimEnd() + "\n…";
	}
	return preview;
}

// Remove Codex apply_patch envelope/control lines from the TUI preview.
// Keep the actual diff body untouched (including leading spaces on context lines).
function isPatchControlLine(line: string): boolean {
	const trimmed = line.trim();
	return (
		trimmed === BEGIN_PATCH_MARKER ||
		trimmed === END_PATCH_MARKER ||
		trimmed === "*** End of File" ||
		trimmed === "***" ||
		trimmed.startsWith(ADD_FILE_MARKER) ||
		trimmed.startsWith(DELETE_FILE_MARKER) ||
		trimmed.startsWith(UPDATE_FILE_MARKER) ||
		trimmed.startsWith(MOVE_TO_MARKER)
	);
}

function makePatchPreviewBody(patch: string): string {
	const lines = normalizeLineEndings(patch).split("\n").filter((line) => !isPatchControlLine(line));
	while (lines.length > 0 && lines[0]!.trim() === "") lines.shift();
	while (lines.length > 0 && lines[lines.length - 1]!.trim() === "") lines.pop();
	return lines.join("\n");
}

// Summarize raw patch args (op count, approx bytes, file paths, preview text).
function summarizePatchArgs(args: unknown): { opCount: number; approxBytes: number; paths: string[]; preview?: string; parseError?: string } {
	const patch = (args as { patch?: unknown })?.patch;
	if (typeof patch !== "string") return { opCount: 0, approxBytes: 0, paths: [] };
	const previewBody = makePatchPreviewBody(patch);

	try {
		const ops = parseCodexPatch(patch);
		const paths = ops.flatMap((op) => (op.move_path ? [op.path, op.move_path] : [op.path]));
		return {
			opCount: ops.length,
			approxBytes: Buffer.byteLength(patch, "utf8"),
			paths: [...new Set(paths)].slice(0, 20),
			preview: previewBody ? makeDiffPreview(previewBody) : undefined,
		};
	} catch (err) {
		return {
			opCount: 0,
			approxBytes: Buffer.byteLength(patch, "utf8"),
			paths: [],
			preview: previewBody ? makeDiffPreview(previewBody) : undefined,
			parseError: err instanceof Error ? err.message : String(err),
		};
	}
}

// Extension wiring: tool policy, tool registration, and system prompt hook.
export default function (pi: ExtensionAPI) {
	let baselineTools: string[] | null = null;

	// Enforce apply_patch-only policy for selected models; hide edit/write to avoid mixed diffs.
	function applyToolPolicy(ctx: ExtensionContext): void {
		if (!baselineTools) baselineTools = pi.getActiveTools();

		if (usesApplyPatchPolicy(ctx)) {
			const next = new Set(baselineTools);
			next.delete("edit");
			next.delete("write");
			next.add("apply_patch");
			pi.setActiveTools([...next]);
			return;
		}

		pi.setActiveTools(baselineTools.filter((t) => t !== "apply_patch"));
	}

	pi.registerTool({
		name: "apply_patch",
		label: "apply_patch",
		description:
			"Apply a Codex-style patch envelope (*** Begin Patch / *** End Patch) to edit files.",
		parameters: Type.Object({
			patch: Type.String(),
		}),

		renderCall(args, theme, context) {
			const { opCount, approxBytes, paths, preview, parseError } = summarizePatchArgs(args);
			let out = theme.fg("toolTitle", theme.bold("apply_patch"));
			out += theme.fg("muted", ` (${opCount} op(s), ~${approxBytes} patch bytes)`);

			if (paths.length > 0) {
				const shown = paths.slice(0, 8);
				const more = paths.length > shown.length ? ` (+${paths.length - shown.length} more)` : "";
				out += "\n" + theme.fg("muted", `Paths: ${shown.join(", ")}${more}`);
			}

			if (preview) {
				out += "\n\n" + theme.fg("toolOutput", preview);
			} else if (approxBytes > 0 && context.argsComplete) {
				out += "\n" + theme.fg("muted", "(no previewable diff body)");
			} else {
				out += "\n" + theme.fg("muted", "(waiting for patch)");
			}

			if (parseError && context.argsComplete) {
				out += "\n" + theme.fg("warning", `Parse preview failed: ${parseError}`);
			}

			return new Text(out, 0, 0);
		},

		renderResult(result, { expanded, isPartial }, theme) {
			const details = result.details as ApplyPatchDetails | undefined;
			if (isPartial) {
				const msg = details?.stage === "progress" ? details.message : "Working...";
				return new Text(theme.fg("warning", msg), 0, 0);
			}

			if (details?.stage === "done") {
				const failed = details.results.filter((r) => r.status === "failed").length;
				let header =
					failed > 0
						? theme.fg("error", "✗ Failed")
						: theme.fg("success", "✓ Done");

				if (!expanded) return new Text(header, 0, 0);

				const lines = details.results
					.map((r) => {
						const prefix = r.status === "completed" ? theme.fg("success", "✓") : theme.fg("error", "✗");
						const base = `${prefix} ${r.type} ${r.path}`;
						return r.output ? base + theme.fg("muted", ` — ${r.output}`) : base;
					})
					.join("\n");
				return new Text(header + "\n" + lines, 0, 0);
			}

			// Fallback
			let output = "";
			for (const c of result.content ?? []) {
				if (c && typeof c === "object" && (c as { type?: unknown }).type === "text") {
					const t = (c as { text?: unknown }).text;
					if (typeof t === "string" && t) output += (output ? "\n" : "") + t;
				}
			}
			return new Text(output ? theme.fg("toolOutput", output) : theme.fg("muted", "(no output)"), 0, 0);
		},

		async execute(_toolCallId, params, signal, onUpdate, ctx) {
			const update = onUpdate as AgentToolUpdateCallback<ApplyPatchDetails> | undefined;

			progress(update, "Parsing Codex patch...");

			try {
				const ops = parseCodexPatch(params.patch as string);
				const { fuzz, results } = await applyOperations(ops, ctx.cwd, signal, (msg) => progress(update, msg));

				const failed = results.some((r) => r.status === "failed");
				const summaryLines = results
					.map((r) => `${r.status === "completed" ? "✓" : "✗"} ${r.type} ${r.path}${r.output ? ` — ${r.output}` : ""}`)
					.join("\n");
				const text = `${failed ? "Failed. Stopped at first failure" : "Done"}.\n${summaryLines}`;
				if (failed) throw new Error(text);

				return {
					content: [{ type: "text", text }],
					details: { stage: "done", fuzz, results },
				};
			} catch (err) {
				if (err instanceof Error) throw err;
				throw new Error(String(err));
			}
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		baselineTools = pi.getActiveTools();
		applyToolPolicy(ctx);
	});

	pi.on("model_select", async (_event, ctx) => {
		applyToolPolicy(ctx);
	});

	pi.on("before_agent_start", async (event, ctx) => {
		applyToolPolicy(ctx);
		if (!usesApplyPatchPolicy(ctx)) return;

		return {
			systemPrompt:
				event.systemPrompt +
				"\n\n# apply_patch (Codex)\n" +
				"- Use the apply_patch tool for file edits.\n" +
				"- Pass one raw Codex patch envelope in the patch string.\n" +
				"- The patch must start with *** Begin Patch and end with *** End Patch.\n" +
				"- Use *** Add File:, *** Update File:, *** Delete File:, and optional *** Move to:.\n" +
				"- Do not split the patch into JSON operations.\n",
		};
	});
}
