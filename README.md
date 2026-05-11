# pi-extensions

Personal Pi extensions for Codex-style workflows.

## Install

```bash
pi install git:github.com/ty91/pi-extensions
```

Or using the full URL:

```bash
pi install https://github.com/ty91/pi-extensions
```

## Extensions

### Codex Apply Patch

Adds an `apply_patch` tool that accepts a raw Codex patch envelope (`*** Begin Patch` / `*** End Patch`) and applies it to files. For GPT-5-family models, it enables `apply_patch` and disables Pi's built-in `edit`/`write` tools so file edits go through structured patches.

See [`extensions/codex-apply-patch`](extensions/codex-apply-patch/).

### Codex Web Search

Injects OpenAI Responses API hosted `web_search` into GPT/Codex provider payloads. It supports `live`, `cached`, and `disabled` modes via the `--codex-web-search` flag.

See [`extensions/codex-web-search`](extensions/codex-web-search/).

## Prompt commands and skills

### `/specify`

Adds a `/specify [request]` prompt command for clarifying feature, bug-fix, behavior-change, or refactoring requirements before writing a spec.

### `/plan`

Adds a `/plan [spec-or-issue]` prompt command for breaking a spec into small, verifiable implementation issues.

### `/build`

Adds a `/build [target]` prompt command for implementing a target end-to-end with a dedicated worktree, TDD workflow, and pull request.

### `/merge-pr`

Adds a `/merge-pr [pr-or-branch]` prompt command for merging a GitHub pull request and cleaning up branch/worktree state.

### Skills

- `interview` — drives clarification for ideas, plans, and ambiguous requests.
- `improve-codebase` — finds deepening opportunities for refactoring and architecture cleanup.
- `to-spec` — turns the clarified conversation into a GitHub parent issue spec.
- `to-issues` — breaks a parent spec into independently grabbable GitHub sub-issues.
- `git-worktree` — safely creates and manages Git worktrees.
- `tdd` — guides test-driven implementation with vertical red-green-refactor cycles.
- `pr` — creates and verifies a GitHub pull request for the current branch.

## Load only one extension

To install the package but load only one extension, use Pi package filtering in `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    {
      "source": "git:github.com/ty91/pi-extensions",
      "extensions": ["extensions/codex-apply-patch/index.ts"],
      "skills": [],
      "prompts": []
    }
  ]
}
```

Omit `skills` or `prompts` from the filter if you want to load those resources too.

## License

MIT
