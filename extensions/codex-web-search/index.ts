/*
 * pi-codex-web-search
 *
 * Pi extension that enables OpenAI/Codex native hosted web search by injecting
 * the Responses API `web_search` hosted tool into provider payloads.
 *
 * This intentionally does not implement a local function tool. The model sees
 * the same hosted tool shape that Codex sends to OpenAI.
 */

declare const process: {
	env: Record<string, string | undefined>;
};

type WebSearchMode = "live" | "cached" | "disabled";
type WebSearchContextSize = "low" | "medium" | "high";

interface ExtensionAPI {
	registerFlag(
		name: string,
		options: {
			description?: string;
			type: "boolean" | "string";
			default?: boolean | string;
		},
	): void;
	getFlag(name: string): boolean | string | undefined;
	on(event: "before_provider_request", handler: (event: ProviderRequestEvent, ctx: ExtensionContext) => unknown): void;
}

interface ExtensionContext {
	model?: {
		id?: string;
		provider?: string;
		api?: string;
	};
}

interface ProviderRequestEvent {
	payload: unknown;
}

type JsonObject = Record<string, unknown>;

interface WebSearchTool extends JsonObject {
	type: "web_search";
	external_web_access: boolean;
	search_context_size?: WebSearchContextSize;
	filters?: {
		allowed_domains?: string[];
	};
	user_location?: {
		type: "approximate";
		country?: string;
		region?: string;
		city?: string;
		timezone?: string;
	};
}

const FLAG_NAME = "codex-web-search";
const DEFAULT_MODE: WebSearchMode = "live";

function isObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMode(value: unknown): WebSearchMode {
	if (typeof value !== "string") return DEFAULT_MODE;
	const lower = value.trim().toLowerCase();
	if (lower === "live" || lower === "cached" || lower === "disabled") return lower;
	return DEFAULT_MODE;
}

function normalizeContextSize(value: unknown): WebSearchContextSize | undefined {
	if (typeof value !== "string") return undefined;
	const lower = value.trim().toLowerCase();
	if (lower === "low" || lower === "medium" || lower === "high") return lower;
	return undefined;
}

function parseCsv(value: string | undefined): string[] | undefined {
	if (!value) return undefined;
	const items = value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
	return items.length > 0 ? items : undefined;
}

function getConfiguredMode(pi: ExtensionAPI): WebSearchMode {
	return normalizeMode(pi.getFlag(FLAG_NAME));
}

function isGptOrCodexModel(ctx: ExtensionContext): boolean {
	const id = ctx.model?.id?.toLowerCase() ?? "";
	if (!id) return false;

	// Do not gate on provider: the same OpenAI models may be routed through
	// gateways/proxies with provider names such as cloudflare-ai-gateway.
	return id.startsWith("gpt") || id.includes("/gpt") || id.includes("codex");
}

function isResponsesPayload(payload: JsonObject): boolean {
	// OpenAI Responses payloads use `input`; Chat Completions payloads use `messages`.
	return "input" in payload && !("messages" in payload);
}

function isResponsesCompatible(ctx: ExtensionContext, payload: JsonObject): boolean {
	const api = ctx.model?.api;
	if (typeof api === "string" && api.includes("responses")) return true;
	return isResponsesPayload(payload);
}

function isWebSearchTool(tool: unknown): boolean {
	return isObject(tool) && tool.type === "web_search";
}

function createWebSearchTool(mode: Exclude<WebSearchMode, "disabled">): WebSearchTool {
	const tool: WebSearchTool = {
		type: "web_search",
		external_web_access: mode === "live",
	};

	const contextSize = normalizeContextSize(process.env.PI_CODEX_WEB_SEARCH_CONTEXT_SIZE);
	if (contextSize) {
		tool.search_context_size = contextSize;
	}

	const allowedDomains = parseCsv(process.env.PI_CODEX_WEB_SEARCH_ALLOWED_DOMAINS);
	if (allowedDomains) {
		tool.filters = { allowed_domains: allowedDomains };
	}

	const country = process.env.PI_CODEX_WEB_SEARCH_COUNTRY?.trim();
	const region = process.env.PI_CODEX_WEB_SEARCH_REGION?.trim();
	const city = process.env.PI_CODEX_WEB_SEARCH_CITY?.trim();
	const timezone = process.env.PI_CODEX_WEB_SEARCH_TIMEZONE?.trim();
	if (country || region || city || timezone) {
		tool.user_location = {
			type: "approximate",
			...(country ? { country } : {}),
			...(region ? { region } : {}),
			...(city ? { city } : {}),
			...(timezone ? { timezone } : {}),
		};
	}

	return tool;
}

function withWebSearchTool(payload: JsonObject, mode: WebSearchMode): JsonObject | undefined {
	const existingTools = payload.tools;
	if (existingTools !== undefined && !Array.isArray(existingTools)) {
		// Unknown payload shape. Leave it untouched rather than risking a bad request.
		return undefined;
	}

	const currentTools: unknown[] = Array.isArray(existingTools) ? existingTools : [];
	const toolsWithoutWebSearch = currentTools.filter((tool) => !isWebSearchTool(tool));
	const hadWebSearch = toolsWithoutWebSearch.length !== currentTools.length;

	if (mode === "disabled") {
		if (!hadWebSearch) return undefined;
		const nextPayload = { ...payload };
		if (toolsWithoutWebSearch.length > 0) {
			nextPayload.tools = toolsWithoutWebSearch;
		} else {
			delete nextPayload.tools;
		}
		return nextPayload;
	}

	return {
		...payload,
		tools: [...toolsWithoutWebSearch, createWebSearchTool(mode)],
	};
}

export default function codexWebSearchExtension(pi: ExtensionAPI) {
	pi.registerFlag(FLAG_NAME, {
		description: "OpenAI/Codex native web_search mode: live, cached, or disabled (default: live)",
		type: "string",
		default: process.env.PI_CODEX_WEB_SEARCH_MODE ?? DEFAULT_MODE,
	});

	pi.on("before_provider_request", (event, ctx) => {
		if (!isGptOrCodexModel(ctx)) return undefined;
		if (!isObject(event.payload)) return undefined;
		if (!isResponsesCompatible(ctx, event.payload)) return undefined;

		return withWebSearchTool(event.payload, getConfiguredMode(pi));
	});
}
