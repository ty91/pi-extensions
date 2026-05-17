---
name: setup-repo
description: Configure the current repository's issue tracker instructions in AGENTS.md/CLAUDE.md and docs/agents/issue-tracker.md. Run once per repo before using skills that publish, fetch, or triage issues.
disable-model-invocation: true
---

# Setup Repo

Scaffold the per-repo issue tracker configuration that other skills can consume.

This skill only configures where issues live and how an agent should interact with them. It does not configure triage label vocabulary, domain docs, ADR layout, or any other repo metadata.

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; do not assume:

- `git remote -v` and `.git/config`: is this a GitHub or GitLab repo? Which one?
- `AGENTS.md` and `CLAUDE.md` at the repo root: does either exist? Is there already an `## Agent Guidance` section?
- `docs/agents/issue-tracker.md`: has this already been configured?

### 2. Present Findings And Ask

Summarize what is present and what is missing. Then ask the user which issue tracker this repo should use.

Start with this short explainer:

> The issue tracker is where issues live for this repo. Skills that publish, fetch, or triage issues need to know whether to call `gh issue create`, call `glab issue create`, write a markdown file under `.scratch/`, or follow another workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills are designed for GitHub first. If a `git remote` points at GitHub, propose GitHub. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise, or if the user prefers, offer:

- **GitHub**: issues live in the repo's GitHub Issues. Use the `gh` CLI.
- **GitLab**: issues live in the repo's GitLab Issues. Use the `glab` CLI.
- **Linear**: issues live in Linear. Use the Linear MCP server or available CLI.
- **Local markdown**: issues live as files under `.scratch/<feature>/` in this repo. Good for solo projects or repos without a remote.
- **Other**: Jira or another tracker. Ask the user to describe the workflow in one paragraph and record it as freeform prose.

### 3. Confirm Draft

Show the user a draft of:

- The `## Agent Guidance` issue tracker block to add or update in `CLAUDE.md` or `AGENTS.md`.
- The full contents of `docs/agents/issue-tracker.md`.

Let the user edit the draft before writing.

### 4. Write

Pick the file to edit:

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask the user which one to create. Do not pick for them.

Never create `AGENTS.md` when `CLAUDE.md` already exists, or vice versa. Always edit the one that is already there.

If an `## Agent Guidance` block already exists in the chosen file, update or add only its issue tracker subsection rather than appending a duplicate block. Do not overwrite user edits to surrounding sections.

The minimal block shape is:

```markdown
## Agent Guidance

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.
```

Then write `docs/agents/issue-tracker.md`, creating `docs/agents/` if needed, using one of the template files below as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md): GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md): GitLab issue tracker
- [issue-tracker-linear.md](./issue-tracker-linear.md): Linear issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md): local-markdown issue tracker

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description. Include concrete commands, URLs, labels, or project/team names if the user provides them. If the workflow has no CLI, say what the agent should ask the user for before acting.

### 5. Done

Tell the user setup is complete and which file now records the repo's issue tracker workflow. Mention they can edit `docs/agents/issue-tracker.md` directly later, and re-running this skill is only necessary if they want to switch issue trackers or restart from scratch.

