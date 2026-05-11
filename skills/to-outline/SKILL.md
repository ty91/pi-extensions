---
name: to-outline
description: Create and iteratively refine a structure outline issue from related spec and design issues, including dependency graph, vertical-slice phases, high-level file changes, and validation strategy. Use after design and before task breakdown.
---

# To Outline

This skill turns related spec and design issues into a structure outline. The output is a single GitHub issue that explains the dependency graph and the vertical-slice phases that should guide later planning.

This is not the task breakdown step. Do NOT create individual implementation issues from this skill; that belongs to `to-tasks`.

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

### 1. Read the spec, design, and relevant codebase

Read the related spec and design issues first.

For GitHub issues, use `gh issue view <number-or-url> --comments` and capture each issue number and URL. The spec issue remains the source of truth for product intent; the design issue remains the source of truth for resolved direction.

If either the spec issue or design issue is unclear, ask the user which issue to use before publishing anything.

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

### 4. Write and iterate the structure outline issue

Write the outline using the issue template below.

This artifact should be iterated with the user. After drafting or updating it, ask what should be adjusted. Continue refining the structure outline until the user is satisfied.

Publish it as a single GitHub issue. If an outline issue already exists for this spec/design pair, update that issue instead of creating a duplicate.

If appropriate, leave short backlink comments on the related spec and design issues linking to the outline issue. Do not close or otherwise modify the spec or design issues.

<issue-template>

## Related Spec / Design

References to the related spec and design issues or documents.

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

</issue-template>
