---
name: to-issues
description: Break a spec into independently-grabbable GitHub sub-issues using tracer-bullet vertical slices. Use when user wants to convert a parent issue or spec into implementation sub-issues, create implementation tickets, or break down work into issues.
---

# To Issues

Break a spec into independently-grabbable GitHub sub-issues using vertical slices.

The source spec should usually be a GitHub parent issue created by `to-spec`. If the parent issue is not clear, ask the user which issue should own the sub-issues before publishing anything.

## Output Language

Write GitHub issue titles and bodies in Korean by default. Preserve code identifiers, commands, file paths, labels, URLs, and product names in their original language. If the user explicitly requests another language, follow the user's request.

## Process

### 1. Gather context

Operate in read-only mode:

- Read the spec and relevant codebase sections
- Identify existing patterns and conventions
- Map dependencies between components
- Note risks and unknowns

For GitHub issues, use `gh issue view <number-or-url> --comments` and capture the parent issue number and URL. The parent issue must remain the source of truth for the overall spec.

### 2. Identify the dependency graph

Map what depends on what such as:

```
Database schema
    │
    ├── API models/types
    │       │
    │       ├── API endpoints
    │       │       │
    │       │       └── Frontend API client
    │       │               │
    │       │               └── UI components
    │       │
    │       └── Validation logic
    │
    └── Seed data / migrations
```

Implementation order follows the dependency graph bottom-up: build foundations first.

### 3. Slice vertically

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer. Instead of building all the database, then all the API, then all the UI — build one complete feature path at a time:

**Bad (horizontal slicing):**
```
Task 1: Build entire database schema
Task 2: Build all API endpoints
Task 3: Build all UI components
Task 4: Connect everything
```

**Good (vertical slicing):**
```
Task 1: User can create an account (schema + API + UI for registration)
Task 2: User can log in (auth schema + API + UI for login)
Task 3: User can create a task (task schema + API + UI for creation)
Task 4: User can view task list (query + API + UI for list view)
```

Vertical slice rules:

- Each vertical slice delivers working, testable functionality.
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

### 4. Publish the issues to the issue tracker

For each slice, publish a new GitHub issue using the issue body template below, then attach it as a sub-issue of the parent issue. These issues are considered ready for AFK agents, so publish them with the correct triage label unless instructed otherwise.

Publish issues in dependency order (blockers first) so you can reference real issue identifiers in the "Blocked by" field.

After creating each child issue, attach it to the parent issue using GitHub sub-issues. The REST API needs the child issue's REST `id`, not the issue number:

```sh
child_url="$(gh issue create --title "$title" --body-file "$body_file")"
child_number="$(gh issue view "$child_url" --json number --jq '.number')"
child_rest_id="$(gh api "repos/:owner/:repo/issues/$child_number" --jq '.id')"
gh api --method POST "repos/:owner/:repo/issues/$parent_number/sub_issues" -F sub_issue_id="$child_rest_id"
```

If GitHub rejects the sub-issue attachment, stop and report the error. Do NOT silently publish a flat list of issues that are not connected to the parent.

<issue-template>
## Parent

A reference to the parent issue on GitHub.

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (if any)

Or "None - can start immediately" if no blockers.

</issue-template>

## Task Sizing Guidelines

| Size | Files | Scope | Example |
|------|-------|-------|---------|
| **XS** | 1 | Single function or config change | Add a validation rule |
| **S** | 1-2 | One component or endpoint | Add a new API endpoint |
| **M** | 3-5 | One feature slice | User registration flow |
| **L** | 5-8 | Multi-component feature | Search with filtering and pagination |
| **XL** | 8+ | **Too large — break it down further** | — |

If a task is L or larger, it should be broken into smaller tasks. An agent performs best on S and M tasks.

**When to break a task down further:**
- It would take more than one focused session (roughly 2+ hours of agent work)
- You cannot describe the acceptance criteria in 3 or fewer bullet points
- It touches two or more independent subsystems (e.g., auth and billing)
- You find yourself writing "and" in the task title (a sign it is two tasks)

## Red Flags

- Starting implementation without a written task list
- Tasks that say "implement the feature" without acceptance criteria
- No verification steps in the plan
- All tasks are XL-sized
- Dependency order isn't considered

Do NOT close or modify the parent issue except to attach sub-issues.

