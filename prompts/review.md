---
description: Conduct a multi-axis code review with the code-reviewer subagent.
argument-hint: "[review-target]"
---

Invoke the `code-reviewer` subagent to review the target. After the subagent returns, inspect its findings against the available diff and context, remove unsupported or duplicate claims, then report the final review to the user.

## Review Scope

The detailed five-axis rubric lives in the `code-reviewer` subagent. You own orchestration: resolve the review target, gather the relevant context, invoke the reviewer, verify the review output, and report the final result.

## Process

### Step 1: Resolve the Review Target

Interpret the user's target as a PR, branch, commit range, staged changes, working tree changes, or "my changes" from the current session. Ask a clarifying question only if the target is still ambiguous.

Do not edit code. This command is review-only; the user will explicitly ask for fixes if they want changes applied.

### Step 2: Build a Thin Review Packet

Pass references, not long summaries. The `code-reviewer` subagent should independently inspect the relevant files and history.

Include:

- Review scope, such as `git diff main...HEAD`, `git diff --staged`, a PR number or URL, or the relevant commit range
- Relevant reference paths or URLs, such as spec, plan, task, issue, PR description, and test files
- Project convention files when readily identifiable, such as `AGENTS.md`, `CONTRIBUTING.md`, `context.md`, or `plan.md`
- Verification already run, such as test, lint, or build commands and pass/fail results
- Any user-specified review focus or constraints

Summarize only ephemeral conversation context that the subagent cannot access directly.

### Step 3: Invoke the Reviewer

Invoke the `code-reviewer` subagent with the review packet. Ask it to read the references directly, use its built-in review rubric, and return severity-labeled findings with file:line references, fix recommendations, and any verification gaps.

Do not restate the full review rubric in this prompt; the subagent owns the review criteria.

### Step 4: Inspect the Review Result

After the subagent returns, sanity-check the findings against the available diff and references.

Remove or clearly mark findings that are unsupported, duplicate, speculative, or based on incorrect line references. Preserve valid severity labels and fix recommendations.

### Step 5: Report the Final Review

Report review results only. Do not make code changes.

Lead with findings ordered by severity. Each concrete issue should include file:line, problem, and recommended fix. If there are no findings, say that clearly. Include remaining test gaps, verification gaps, and residual risks. Do not paste the subagent transcript verbatim unless the user asks for it.

## Handling Disagreements

When resolving review disputes, apply this hierarchy:

1. **Technical facts and data** override opinions and preferences
2. **Style guides** are the absolute authority on style matters
3. **Software design** must be evaluated on engineering principles, not personal preference
4. **Codebase consistency** is acceptable if it doesn't degrade overall health

**Don't accept "I'll clean it up later."** Experience shows deferred cleanup rarely happens. Require cleanup before submission unless it's a genuine emergency. If surrounding issues can't be addressed in this change, require filing a bug with self-assignment.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It works, that's good enough" | Working code that's unreadable, insecure, or architecturally wrong creates debt that compounds. |
| "I wrote it, so I know it's correct" | Authors are blind to their own assumptions. Every change benefits from another set of eyes. |
| "We'll clean it up later" | Later never comes. The review is the quality gate -- use it. Require cleanup before merge, not after. |
| "AI-generated code is probably fine" | AI code needs more scrutiny, not less. It's confident and plausible, even when wrong. |
| "The tests pass, so it's good" | Tests are necessary but not sufficient. They don't catch architecture problems, security issues, or readability concerns. |

## Reporting

- Lead with findings, ordered by severity.
- Include file and line references for each concrete issue.
- If there are no findings, say so clearly.
- Include any test gaps, verification gaps, or residual risks that remain after the review.
- Keep the report concise; do not paste the subagent transcript verbatim unless the user asks for it.
