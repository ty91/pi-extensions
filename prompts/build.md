---
description: Delegate end-to-end implementation to worker with worktree, TDD, and PR workflow.
argument-hint: "[target]"
---

Implement the requested target end-to-end, then create a pull request.

## Target Resolution

Spec Issue:

$ARGUMENTS

Resolve a GitHub spec issue from the input above or the current conversation context. If it is unclear, ask the user which spec issue to build.

Determine the spec issue's sub-issues and select the first open sub-issue as the implementation target. If the sub-issues cannot be determined, or if there are no open sub-issues, stop and report the blocker.

## Workflow

1. Use the `git-worktree` skill to create or enter a dedicated worktree for the target.
2. Read the target and relevant code until the required behavior is clear.
3. Use the `tdd` skill to implement with vertical red-green-refactor cycles.
4. Run the repository's full handoff gate after code changes, including lint, typecheck, tests, and any project-specific checks.
5. Commit the finished changes with a Conventional Commit, staging only the files changed for this target.
6. Use the `pr` skill to push the branch, create the GitHub pull request, and verify it.
7. After the PR is verified, clean up local worktree state: remove the implementation worktree, delete the local feature branch only after confirming it is pushed, prune stale worktree metadata, and verify the remaining local checkout is clean.

## Reporting

- Keep progress updates concise and focused on worker status, blockers, or decisions needed from the user.
- In the final response to the user, summarize the worker report with the PR URL, validation results, cleanup result, and any notable risks or follow-up.
