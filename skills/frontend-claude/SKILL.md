---
name: frontend-claude
description: You MUST always use this skill for frontend implementation work, including UI, styling, components, layout, accessibility, design polish, client-side interactions, and browser-facing behavior. Do not use it for frontend architecture, performance, or refactoring work.
---

# Frontend Delegation

Use this skill to delegate frontend implementation work to Claude while Pi remains responsible for context, safety, validation, and final reporting.

## When to use

Use this skill when the task primarily involves:

- UI components, pages, layouts, styling, animations, or design polish
- React, Vue, Svelte, Solid, Next.js, Remix, Astro, CSS, Tailwind, or browser-facing TypeScript/JavaScript
- Accessibility, responsive behavior, forms, frontend state, or client-side interactions
- Frontend tests such as component, visual, browser, or interaction tests

## When not to use

- Do not use this skill for primarily backend, database, infrastructure, dependency-management, release, or GitHub workflow tasks unless frontend work is the main risk.
- Do not use this skill when the task is primarily about frontend architecture, performance optimization, refactoring, simplification, modularization, or redesigning frontend internals.

## Process

Pi should extract the frontend UI implementation slice from the user's broader request and delegate only that slice to Claude. Pi owns product judgment, repository safety, integration with the rest of the task, validation, and the final response.

### Step 1. Delegate the frontend slice

Run Claude from the repository root with a concise prompt containing the relevant context, the specific frontend UI task, constraints, and desired report format. Send the prompt through stdin with a quoted heredoc. Frontend work may take more than 10 minutes, so use a generous tool timeout, commonly 1800-3600 seconds.

If the repository contains `DESIGN.md`, Claude can read it as part of the delegated work; Pi does not need to read `DESIGN.md` directly before delegating.

```bash
claude -p <<'EOF'
You are helping Pi implement only the frontend UI portion of a larger task.

If this repository contains DESIGN.md, read it before starting and follow its guidance.

Context: <brief repository and relevant file context>
Task: <specific frontend implementation request>
Constraints: preserve existing user changes; do not run destructive Git commands; do not commit or push.
Report: summarize changes, files changed, validation run, and risks/follow-ups.
EOF
```

### Step 2. Review and continue

1. Inspect `git status --short` and the diff.
2. Verify that Claude did not make unrelated or destructive changes.
3. Run focused validation when practical, then broader validation if appropriate.
4. Integrate Claude's frontend work into the broader task, iterating with another focused prompt only if useful.

