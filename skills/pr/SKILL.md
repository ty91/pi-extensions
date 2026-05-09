---
name: pr
description: Create a GitHub pull request for the current branch.
allowed-tools: Bash(git:*), Bash(gh:*), AskUserQuestion
---

## Context

- Current branch: !`git branch --show-current`
- Default branch: !`gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || echo "main"`
- Commits on this branch: !`git log --oneline main..HEAD 2>/dev/null || echo "Could not determine commits"`
- Diff summary: !`git diff --stat main...HEAD 2>/dev/null || echo "Could not determine diff"`
- Remote tracking: !`git rev-parse --abbrev-ref @{upstream} 2>/dev/null || echo "No upstream set"`

## Your task

Create a GitHub pull request for the current branch.

### 1. Validate

- If the current branch is `main` or `master`, ask the user how to proceed: create a new branch or abort. Do NOT create a PR from main to main.
- If there are no commits ahead of the base branch, inform the user and stop.

### 2. Push

- If the branch has no upstream (`No upstream set`), push it with `git push -u origin HEAD`.
- If the branch is behind the remote, push first.

### 3. Create PR

- Create a pull request using `gh pr create` with `--assignee @me`.
- Unless the user explicitly requests another language, write the pull request body in Korean.
- Use the following PR template. Fill in the relevant sections based on the commits and diff:

```markdown
## Summary
<!-- 이 PR이 무엇을 왜 하는지 설명. 관련 이슈가 있으면 링크 포함 (예: Fixes #123) -->


## Test Plan
<!-- 변경 사항을 어떻게 검증할 수 있는지 -->

```

### 4. Verify

- Run `gh pr view --json url,baseRefName,body` and check:
  - PR URL is valid.
  - Base branch is the default branch.
  - Summary and Test Plan sections are filled in (not just template placeholders).
- If any check fails, fix the issue or inform the user.

### 5. Done

- Return the PR URL to the user.
