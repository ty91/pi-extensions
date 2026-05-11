---
description: Specify, scope, or clarify an idea, bug fix, behavior change, or refactoring direction before writing a spec.
argument-hint: "[request]"
---

## Process

1. Run the interview using the instructions below.
2. When the interview has reached sufficient shared understanding, you MUST stop the interview and ask the user whether to write a spec document. Do not end the session without asking this.
3. If the user says yes, you MUST use the `to-spec` skill to create the spec.
4. After using `to-spec`, ask the user whether to move on to design.

## Interview

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time. If a question can be answered by exploring the codebase, explore the codebase instead.

If the discussion is about refactoring, architecture cleanup, consolidation, or codebase improvement, also use the `improve-codebase` skill.
