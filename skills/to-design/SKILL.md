---
name: to-design
description: Run a focused design discussion for a spec issue, then publish or update the resolved direction as a comment on that spec issue. Use after specify and before structure outlining or task breakdown.
---

# To Design

This skill turns a spec into a design discussion artifact. The output is not a detailed implementation plan. It is a GitHub issue comment that captures where the work is going, what the intended result should look like, which existing patterns should guide it, and which design questions have been resolved.

The source spec should usually be a GitHub parent issue created by the `specify` prompt. If the spec is not clear, ask the user which spec issue or spec document to use before continuing.

Do NOT create a separate design issue. Do NOT create implementation sub-issues from this skill; that belongs to planning/task breakdown.

## Output Language

Write GitHub issue titles and bodies in Korean by default. Preserve code identifiers, commands, file paths, labels, URLs, and product names in their original language. If the user explicitly requests another language, follow the user's request.

## Process

### 1. Read the spec

Read the provided spec document first.

For GitHub issues, use `gh issue view <number-or-url> --comments` and capture the spec issue number and URL. The spec issue must remain the source of truth for the product intent.

If no spec document or issue is provided and no spec is obvious from the current conversation, ask the user which spec to use.

### 2. Research the codebase

If you have not already researched the relevant codebase during this session, inspect it before asking design questions.

Focus on:

- Current behavior and current architecture relevant to the spec
- Existing patterns to follow
- Similar features, flows, modules, or conventions
- Constraints that should shape the design discussion
- Ambiguities that cannot be resolved by reading the code

If a question can be answered by exploring the codebase, explore the codebase instead of asking the user.

### 3. Ask design questions one at a time

Ask the user design questions one at a time until the important design decisions are concrete enough to write the design comment.

For each question:

- Ask exactly one question.
- Explain briefly why the question matters.
- Provide your recommended answer.
- Prefer questions about product direction, desired end state, UX/API behavior, boundaries, constraints, tradeoffs, and patterns to follow.
- Avoid prematurely asking for implementation task breakdown or detailed execution steps.

Continue until the following can be stated clearly:

- The current state that motivates the design
- The desired end state
- The patterns to follow
- The resolved design questions and decisions

### 4. Publish or update the design comment

Write the design discussion artifact using the comment template below, then publish it as a comment on the spec issue.

If a previous design comment already exists on the spec issue, update that comment instead of creating a duplicate. Find existing design comments by looking for the `<!-- pi:design -->` marker or an existing `# Design` comment authored by the agent.

Do not close or modify the spec issue body from this skill. If the design discussion reveals that the spec itself should change, stop and ask the user whether to update the spec before publishing the design comment.

<comment-template>

<!-- pi:design -->

# Design

## Current State

The current behavior, architecture, user experience, or workflow that matters for this design discussion.

## Desired End State

The target behavior, user experience, architectural shape, or workflow that the team wants to reach.

## Patterns to Follow

Existing product, codebase, architecture, testing, UX, API, or documentation patterns that should guide the implementation.

## Resolved Design Questions

A list of design questions that were resolved during the discussion, with the final decision for each question.

</comment-template>
