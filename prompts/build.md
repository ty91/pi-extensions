---
description: Delegate end-to-end implementation to worker with worktree, TDD, and PR workflow.
argument-hint: "[target]"
---

Delegate the requested target end-to-end to the `worker` subagent, then report the result.

## Target Resolution

Build target:

$ARGUMENTS

- If a GitHub issue, plan file, spec, branch, file path, or concrete implementation target is provided above, use that as the target.
- If no explicit target is provided, infer the target from the current conversation context.
- If multiple plausible targets exist and choosing one would be risky, ask the user to choose before launching the worker.

## Main Agent Role

You are the orchestrator.

- Do not implement directly unless the user explicitly asks you to bypass subagents.
- Resolve the target and launch the `worker` subagent.
- Pass the `git-worktree`, `tdd`, and `pr` skills to the worker.
- Do not make code edits, run the implementation workflow, commit, push, or create the PR yourself.
- If the worker asks for a decision through supervisor coordination, answer directly when the existing context is sufficient; otherwise ask the user.
- After the worker finishes, summarize its report for the user.

## Worker Delegation

Launch `worker` with a task equivalent to the following, preserving the resolved target:

```text
Implement the requested target end-to-end, then create a pull request.

Target:

$ARGUMENTS

Use the `git-worktree`, `tdd`, and `pr` skills for this workflow.

## Workflow

1. Use the `git-worktree` skill to create or enter a dedicated worktree for the target.
2. Read the target and relevant code until the required behavior is clear.
3. Use the `tdd` skill to implement with vertical red-green-refactor cycles.
4. Run the repository's full handoff gate after code changes, including lint, typecheck, tests, and any project-specific checks.
5. Commit the finished changes with a Conventional Commit, staging only the files changed for this target.
6. Use the `pr` skill to push the branch, create the GitHub pull request, and verify it.
7. After the PR is verified, clean up local worktree state: remove the implementation worktree, delete the local feature branch only after confirming it is pushed, prune stale worktree metadata, and verify the remaining local checkout is clean.

## Required Worker Report

Your final response must include:

- Target: the implemented issue/spec/plan/file/branch and a short behavior summary.
- Summary of changes: concise summary of important code, test, and doc changes.
- Changed files: files changed for this target.
- Validation: commands run and pass/fail result for each; if anything failed or was skipped, explain why.
- Commit: commit SHA and commit subject.
- Pull request: PR URL, PR number, and verification result after creation.
- Cleanup: worktree/branch cleanup result and final local checkout cleanliness.
- Known risks / follow-up: risks, unresolved questions, or recommended next steps.

Do not finish with a generic success summary. If any required field is unavailable, write `N/A` and explain why.
```

Use this subagent shape:

```typescript
subagent({
  agent: "worker",
  task: "<expanded worker task above>",
  skill: ["git-worktree", "tdd", "pr"]
})
```

## Reporting

- Keep progress updates concise and focused on worker status, blockers, or decisions needed from the user.
- In the final response to the user, summarize the worker report with the PR URL, validation results, cleanup result, and any notable risks or follow-up.
