---
name: to-outline
description: Create and iteratively refine a structure outline comment on a spec issue, using the spec body and design comment. Use after design and before task breakdown.
---

# To Outline

This skill turns a spec issue and its design comment into a structure outline. The output is a GitHub issue comment on the spec issue that explains the dependency graph and the vertical-slice phases that should guide later planning.

This is not the task breakdown step. Do NOT create individual implementation issues from this skill; that belongs to `to-tasks`.

Do NOT create a separate outline issue. The spec issue is the container for the spec body, design comment, outline comment, and later task sub-issues.

## Output Language

Write GitHub issue titles and bodies in Korean by default. Preserve code identifiers, commands, file paths, labels, URLs, and product names in their original language. If the user explicitly requests another language, follow the user's request.

## Reference Perspectives

Before creating the outline, read these reference documents completely and explicitly reason from their perspectives:

- [`deep-modules.md`](../tdd/deep-modules.md): prefer deep modules with small interfaces and hidden complexity.
- [`interface-design.md`](../tdd/interface-design.md): design interfaces that accept dependencies, return results, and keep surface area small.
- [`mocking.md`](../tdd/mocking.md): mock only at system boundaries and design boundary interfaces to be easy to mock.
- [`refactoring.md`](../tdd/refactoring.md): identify duplication, shallow modules, feature envy, primitive obsession, and existing code that should be improved.
- [`tests.md`](../tdd/tests.md): validate observable behavior through public interfaces, avoiding implementation-detail tests.

## Process

### 1. Read the spec issue, design comment, and relevant codebase

Read the related spec issue first, including its body and comments.

For GitHub issues, use `gh issue view <number-or-url> --comments` and capture the spec issue number and URL. The spec issue body remains the source of truth for product intent.

Find the design comment on the spec issue by looking for the `<!-- pi:design -->` marker or an existing `# Design` comment authored by the agent. The design comment is the source of truth for resolved direction.

If the spec issue is unclear, ask the user which spec issue to use before publishing anything. If the design comment is missing or unclear, stop and ask the user whether to run the design step first.

Then inspect the relevant codebase. Focus on:

- Existing dependency structure
- Existing modules, public interfaces, and system boundaries
- Existing tests and validation patterns
- Similar vertical slices already implemented
- Refactoring opportunities exposed by the requested work

### 2. Create the dependency graph

Map what depends on what. The graph should be implementation-relevant but still high-level enough to remain stable.

Include dependencies such as schemas, domain modules, service boundaries, API contracts, UI flows, CLI flows, persistence, external systems, tests, docs, and migration/backfill concerns when relevant.

Use the dependency graph to explain ordering. Foundations should appear before dependent phases.

### 3. Create vertical-slice phases

Create phases as vertical slices. Each phase should deliver a coherent, verifiable increment across all relevant layers.

Avoid horizontal slicing where one phase is only schema, another is only API, and another is only UI. Prefer phases that are demoable or verifiable on their own.

For each phase, include:

- A concise description of the vertical slice
- High-level desired file changes, not code-level instructions
- Validation strategy, including automatic and manual verification

Manual validation must include ordered user actions and the desired behavior for each important action.

### 4. Write and iterate the structure outline comment

Write the outline using the comment template below.

This artifact should be iterated with the user. After drafting or updating it, ask what should be adjusted. Continue refining the structure outline until the user is satisfied.

Publish it as a comment on the spec issue. If a previous outline comment already exists on the spec issue, update that comment instead of creating a duplicate. Find existing outline comments by looking for the `<!-- pi:outline -->` marker or an existing `# Structure Outline` comment authored by the agent.

Do not close or modify the spec issue body from this skill. If the structure outline reveals that the spec or design should change, stop and ask the user whether to update the earlier artifact before publishing the outline comment.

<comment-template>

<!-- pi:outline -->

# Structure Outline

## Dependency Graph

A high-level dependency graph showing what depends on what and how the phases should be ordered.

## Phase 1: <phase topic>

Concise description of this vertical slice.

### File Changes

Bullet list of desired file changes. These should be high-level descriptions, not code-level instructions.

### Validation

How to validate this phase. Include automatic validation and manual validation. For manual validation, list the ordered user actions and the desired behavior for those actions.

## Phase 2: <phase topic>

[repeat the same structure for each additional vertical-slice phase if necessary]

</comment-template>
