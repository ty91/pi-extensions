---
name: git-worktree
description: "Use this skill only for Git worktree-specific tasks: creating, listing, pruning, removing, repairing, moving, or inspecting git worktrees. Do not use it for ordinary Git work unless git worktree is involved."
---

# Git Worktree

Use this skill only when the task involves `git worktree`.

## Rules

- Do not use this skill for ordinary commits, pushes, pulls, branches, merges, rebases, checkouts, or PR work unless `git worktree` is involved.
- Create every worktree under `~/.reco/worktrees/<local-repo-path>/<branch-name>`.
- Convert every `/` in both `<local-repo-path>` and `<branch-name>` to `-`.
- Example: repo `/Users/taeyoung/Developer/workspace/example` + branch `feature/add-login` → `~/.reco/worktrees/-Users-taeyoung-Developer-workspace-example/feature-add-login`.
- Before changes, check `git worktree list`; after changes, verify with `git worktree list` and relevant `git status`.

## Create Pattern

- Existing branch: `git worktree add "$HOME/.reco/worktrees/<local-repo-path>/<branch-name>" "<branch-name>"`
- New branch: `git worktree add -b "<branch-name>" "$HOME/.reco/worktrees/<local-repo-path>/<branch-name>"`
