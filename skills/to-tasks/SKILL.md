---
name: to-tasks
description: Compile a spec issue's body, design comment, and structure outline comment into independently grabbable GitHub task sub-issues. Use after to-outline when the user wants implementation tasks for AFK agents.
---

# To Tasks

Turn an agreed structure outline into tactical implementation task issues.

This skill does not redesign the feature. It compiles the reviewed `spec -> design -> outline` artifacts into small, independently implementable task issues that an AFK agent can pick up.

The structure outline comment is the primary source for dependency ordering, phase boundaries, likely file changes, and validation direction. If the outline is missing, stale, ambiguous, or inconsistent with the spec/design/codebase, stop and ask whether to revise the outline first.

## Output Language

Write GitHub issue titles and bodies in Korean by default. Preserve code identifiers, commands, file paths, labels, URLs, and product names in their original language. If the user explicitly requests another language, follow the user's request.

## Source Documents and Ownership

Read all relevant source artifacts from the spec issue before creating tasks:

- Spec issue body: product intent and scope.
- Design comment on the spec issue: resolved direction and design decisions.
- Outline comment on the spec issue: dependency graph, phase ordering, high-level file changes, and validation strategy.
- Relevant codebase sections: existing implementation details needed to make task boundaries, likely file changes, and verification steps accurate.

The task parent issue is the spec issue, because the spec issue is the container for the spec body, design comment, outline comment, and task sub-issues. If the user explicitly identifies a different parent issue, confirm before using it.

For GitHub issues, use `gh issue view <number-or-url> --comments` and capture the spec issue number and URL.

Find the design comment by looking for the `<!-- pi:design -->` marker or an existing `# Design` comment authored by the agent. Find the outline comment by looking for the `<!-- pi:outline -->` marker or an existing `# Structure Outline` comment authored by the agent.

If the design or outline comment is missing or unclear, stop and ask the user whether to run or revise the earlier step before publishing tasks.

## Process

### 1. Gather context

Operate in read-only mode while gathering context:

- Read the spec issue body, design comment, and outline comment.
- Inspect enough of the relevant codebase to make task boundaries concrete.
- Identify existing patterns, naming conventions, tests, and verification commands that each task should reference.
- Note missing information, conflicts, or stale assumptions.

Do not recreate the dependency graph or invent a new phase structure. Use the outline comment as the source of truth for structure and ordering.

If you discover that the outline cannot be compiled into credible tasks, stop and ask the user whether to revise the outline first. Do not silently publish tasks that contradict the outline.

### 2. Compile outline phases into tasks

For each outline phase, split the phase into S/M-sized task issues.

Each task must:

- Be independently implementable.
- Be independently verifiable.
- Preserve the ordering and intent of the outline phase.
- Avoid introducing new design decisions.
- Include specific, externally observable acceptance criteria.
- Include likely files or areas to touch without prescribing line-by-line implementation.
- Include expected deletes/removals, or explicitly say `None expected`.
- Include automatic and/or manual verification steps.

Prefer AFK-ready tasks. If human input is still required for a task, mark it clearly as HITL and explain the unresolved question.

### 3. Publish task issues

For each task, publish a new GitHub issue using the issue body template below, then attach it as a sub-issue of the task parent issue.

Publish tasks in dependency order so later tasks can reference earlier blocking issues when needed.

After creating each child issue, attach it to the parent issue using GitHub sub-issues. The REST API needs the child issue's REST `id`, not the issue number:

```sh
child_url="$(gh issue create --title "$title" --body-file "$body_file")"
child_number="$(gh issue view "$child_url" --json number --jq '.number')"
child_rest_id="$(gh api "repos/:owner/:repo/issues/$child_number" --jq '.id')"
gh api --method POST "repos/:owner/:repo/issues/$parent_number/sub_issues" -F sub_issue_id="$child_rest_id"
```

If GitHub rejects the sub-issue attachment, stop and report the error. Do NOT silently publish a flat list of issues that are not connected to the parent.

If appropriate, leave a short comment on the spec issue summarizing the task set. Do not close or otherwise modify the spec issue body, design comment, or outline comment.

<issue-template>

## Task N: [작업 제목]

**Related context:**
- Spec issue:

**Description:**
Describe what this task should accomplish and why it exists. Focus on intended behavior and purpose, not step-by-step implementation.

**Acceptance criteria:**
- [ ] Specific, externally observable condition that must be true.
- [ ] Another testable condition.
- [ ] Edge case or failure behavior, if relevant.

**Files likely touched:**
- `path/to/file.ts`:
  - High-level change expected in this file.
  - Another likely change.

**Deletes / removals:**
List expected deletions, cleanup, or removals. Use `None expected` if no removals are expected.

**Out of scope:**
- Work that should not be done in this task.
- Related behavior reserved for another task.

**Verification:**
- [ ] `command to run`
- [ ] Manual action: describe the user action and expected behavior.

</issue-template>

## Task Sizing Guidelines

| Size | Files | Scope | Example |
|------|-------|-------|---------|
| **XS** | 1 | Single function or config change | Add a validation rule |
| **S** | 1-2 | One component or endpoint | Add a new API endpoint |
| **M** | 3-5 | One feature slice | User registration flow |
| **L** | 5-8 | Multi-component feature | Search with filtering and pagination |
| **XL** | 8+ | Too large — break it down further | — |

If a task is L or larger, break it down before publishing. An agent performs best on S and M tasks.

Break a task down further when:

- It would take more than one focused session, roughly 2+ hours of agent work.
- Acceptance criteria cannot be described in a short checklist.
- It touches multiple independent subsystems.
- The title needs “and” to describe the work.

## Red Flags

- Reworking the outline's dependency graph instead of compiling it.
- Publishing tasks before reading the spec, design, outline, and relevant code.
- Tasks that say “implement the feature” without tactical acceptance criteria.
- Tasks with no likely file areas.
- Tasks with no verification steps.
- Tasks that are XL-sized.
- Task ordering that contradicts the outline.
