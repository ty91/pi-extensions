---
description: Merge a GitHub pull request and clean up branch/worktree state.
argument-hint: "[pr-or-branch]"
---

Merge the target GitHub pull request, then leave local state tidy.

Target PR: $ARGUMENTS

## Workflow

1. Resolve the target PR from the argument above, recent conversation, or the current branch; ask only if still ambiguous.
2. Inspect the PR and stop if it cannot be found or is not mergeable.
3. Merge the PR, preferring the repository's normal non-interactive merge method and deleting the remote branch when possible.
4. Verify the PR is merged.
5. Sync the default branch locally with fast-forward pull and prune remotes.
6. Check whether the local feature worktree and branch are already gone; if either remains and is safe to remove, remove it and prune stale worktree metadata.
7. Verify the local checkout is clean, the merged branch is no longer checked out locally, and stale worktree entries are gone.

## Reporting

- Return the PR URL, merge result, default-branch sync result, and local cleanup result.
- If cleanup is blocked by dirty or unpushed local work, stop and report the exact path or branch to resolve.
