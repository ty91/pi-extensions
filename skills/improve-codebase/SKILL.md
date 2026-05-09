---
name: improve-codebase
description: Find deepening opportunities in a codebase. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable.
---

# Improve Codebase

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [LANGUAGE.md](LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [LANGUAGE.md](LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

This skill is informed by the actual codebase. Use existing code, tests, README/docs, issue text, and naming patterns to infer domain language and constraints. Do not require architecture docs to exist.

## Process

### 1. Explore

Read the relevant code paths yourself. If project docs, tests, or design notes exist near the area, use them as context, but keep the workflow useful even when the repo has no architecture docs.

Explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates

Present a numbered list of deepening opportunities. For each candidate:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and also in how tests would improve

Use codebase vocabulary for the domain, and [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture. If the code calls something "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

Do NOT propose final interfaces yet. Ask the user: "Which of these would you like to explore?"

### 3. Design loop

Once the user picks a candidate, run a focused design conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, and what tests survive.

Use [DEEPENING.md](DEEPENING.md) to classify dependencies and choose a testing strategy. If the user wants to explore alternative interfaces for the deepened module, use [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).

Do not modify production code from this skill unless the user explicitly asks for implementation. The output is architectural understanding, candidate refactors, and interface direction.

When the design conversation has reached sufficient shared understanding, you MUST stop and ask the user whether to write a spec document. Do not end the session without asking this. If the user says yes, you MUST use the `to-spec` skill to create the spec.
