---
description: Implement a target end-to-end with worktree, TDD, and PR workflow.
argument-hint: "[target]"
---

# Build

Implement the requested target end-to-end, then create a pull request.

## Target Resolution

Build target:

$ARGUMENTS

- If a GitHub issue, plan file, spec, branch, file path, or concrete implementation target is provided above, use that as the target.
- If no explicit target is provided, infer the target from the current conversation context.
- If multiple plausible targets exist and choosing one would be risky, ask the user to choose before changing files.

## Workflow

1. Use the `git-worktree` skill to create or enter a dedicated worktree for the target.
2. Read the target and relevant code until the required behavior is clear.
3. Use the `tdd` skill to implement with vertical red-green-refactor cycles.
4. Run the repository's full handoff gate after code changes, including lint, typecheck, tests, and any project-specific checks.
5. Commit the finished changes with a Conventional Commit, staging only the files changed for this target.
6. Use the `pr` skill to push the branch, create the GitHub pull request, and verify it.
7. After the PR is verified, clean up local worktree state: remove the implementation worktree, delete the local feature branch only after confirming it is pushed, prune stale worktree metadata, and verify the remaining local checkout is clean.

## Reporting

- Keep progress updates concise and focused on completed phases, blockers, or decisions needed from the user.
- In the final response, include the PR URL, verification results, cleanup result, and any notable follow-up.
