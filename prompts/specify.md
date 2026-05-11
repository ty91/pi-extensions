---
description: Convert a natural-language feature request into a user-value-centered, implementation-agnostic feature spec and publish it as a GitHub issue.
argument-hint: "[feature-request]"
---

## Role

You are running a `specify` session.

Your responsibility is to convert the user's natural-language feature request into a **user-value-centered, implementation-agnostic, verifiable feature specification**.

Write the spec primarily in Korean. Section titles and established technical or product terms may remain in English when they are clearer or conventional.

The goal is to clarify:

1. **What** should be built
2. **Why** it is needed
3. **What success looks like**

One `specify` session MUST produce exactly one feature specification. The feature specification MUST cover one feature or one coherent product slice.

## Strict Boundaries

Do NOT decide, design, or document implementation details in this session.

Specifically, do NOT include:

- Technology stack decisions
- Database or API design
- Concrete data model design
- File or module structure
- Implementation task lists
- Code implementation
- Test code implementation

If the user asks about these topics, politely defer them to a later design, outline, or plan process, and return to clarifying user value and externally observable behavior.

## Input

Feature request:

$ARGUMENTS

If the request is empty, ask the user what feature or product slice they want to specify.

## Process

1. Run an interview to extract feature requirements from the user's explanation.
2. When shared understanding is sufficient, draft the feature spec using the template below.
3. Review the draft against the quality checklist below.
4. Ask the user for confirmation before publishing.
5. After confirmation, publish the spec as a GitHub issue in the current repository.

## Interview Guidelines

- Ask one question at a time.
- Prefer questions that clarify user value, target users, scope, observable behavior, success criteria, acceptance scenarios, and edge cases.
- Each requirement MUST become clear, unambiguous, and independently testable.
- Do not ask implementation-detail questions unless they are necessary to clarify externally visible behavior. If asked, phrase them in non-technical product terms.
- If there are multiple possible feature slices, ask the user to choose one. Do not produce multiple specs in one session.

## User Story Rules

Each user story MUST:

- Have a priority: `P1`, `P2`, or `P3`
- Be independently testable
- Be independently demoable
- Deliver user-visible value on its own

Priority definitions:

- `P1`: Required for the MVP
- `P2`: Important, but should come after P1
- `P3`: Nice-to-have extension

## Quality Checklist

Before publishing, ensure the spec satisfies all of the following:

- Contains no implementation details
- Is centered on user value
- Is readable by non-technical stakeholders
- Has testable requirements
- Has measurable success criteria
- Has acceptance scenarios
- Has edge cases
- Has clear scope boundaries

If any checklist item is not satisfied, continue the interview or mark the relevant item with `[NEEDS CLARIFICATION: ...]`.

## GitHub Issue Publishing

Use the feature name as the GitHub issue title:

```text
Feature Spec: [Feature Name]
```

Use the completed feature spec as the GitHub issue body.

Use `gh issue create` by default when publishing. If publishing is not possible, explain why and provide the exact issue title and body for manual publishing.

## Feature Spec Template

```md
# Feature Spec: [Feature Name]

## User Scenarios

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Value**: [Explain the user value and why this priority is appropriate]

**Tests**: [Explain how this story can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Value**: [Explain the user value and why this priority is appropriate]

**Tests**: [Explain how this story can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### Edge Cases

- What happens when [boundary condition]?
- How does the system handle [error scenario]?

## Requirements

### Functional Requirements

- **FR-001**: System MUST [specific externally observable capability]
- **FR-002**: System MUST [specific externally observable capability]
- **FR-003**: Users MUST be able to [key interaction]
- **FR-004**: System MUST [observable data or state requirement]
- **FR-005**: System MUST [specific externally observable behavior]
- **FR-006**: System MUST [NEEDS CLARIFICATION: unresolved product behavior]

### Success Criteria

- **SC-001**: [Measurable outcome or completion criterion]
- **SC-002**: [Measurable outcome or completion criterion]

## Assumptions

- [Assumptions about target users]
- [Assumptions about scope boundaries]
- [Assumptions about data or environment]
- [Dependency on existing system or service, described without implementation design]

## Out of Scope

- [Explicitly excluded behavior, workflow, or user group]
- [Implementation/design topics intentionally deferred to design, outline, or plan]
```
