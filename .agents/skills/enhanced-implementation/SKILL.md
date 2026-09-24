---
name: enhanced-implementation
description: Implement reviewed Workflow v2 scenes in accepted milestones while preserving learning and evidence boundaries for Gate G6.
---

# Enhanced Implementation

## Purpose

Implement the learning architecture as a connected, inspectable mental model. The goal is learner reconstruction, not interaction coverage.

## Required Inputs

- `design/learning-contract.md`
- `research/01_paper_model.md`
- `research/02_evidence_registry.yaml`
- `design/learning-architecture.md`
- Relevant files in `design/scenes/`
- `web/canonical/` only for compatibility constraints and reusable infrastructure
- The existing Enhanced project, when iterating

## Preconditions

- G1 and G2 are reviewed or explicitly recorded as historical migration inputs.
- G4 and relevant G5 scenes are reviewed.
- Confirm the paper workspace and permitted files before editing.

## Milestones

Use milestones defined by the Learning Architecture. A common sequence is:

```text
M0 Foundation
M1 First Vertical Slice
M2 Core Mechanism
M3 Boundaries
M4 Evidence + End-to-End
M5 Integration
```

Deliver a working first vertical slice early. Pause expansion for human learning acceptance. If the slice does not teach the intended mental model, stop and revise the architecture before continuing.

## Procedure

1. Inspect project scripts and existing conventions.
2. Use Canonical only for compatibility, build contracts, shared primitives, and tokens. It does not define Enhanced pedagogy.
3. Implement reviewed milestones incrementally, reusing persistent objects across scenes.
4. Keep actual paper data distinct from teaching toys and label simplifications.
5. Use real calculations for simulations; do not add controls whose changes do not expose a concept.
6. Resolve terms, symbols, datasets, and evidence from their registries instead of duplicating definitions throughout the interface.
7. If a scene specification cannot achieve its learning goal, return the issue to design instead of inventing narrative in code.
8. Include keyboard access, visible focus, reduced-motion behavior, reset behavior, non-drag controls, and mobile layout as applicable.
9. After each milestone, run the project's declared build/audit and report its actual outcome. Do not silently install or update dependencies.
10. Keep generated output, secrets, and unintended files out of Git.

## Validation

- Implemented scenes preserve the stated entry, exit, state, and global dependencies.
- The First Vertical Slice receives human learning acceptance before later expansion.
- Build, project audit, accessibility, reduced-motion, and mobile outcomes are accurately recorded.
- Canonical remains unchanged.

## Forbidden Actions

- Do not use Canonical's UI or chapter layout as the teaching plan unless Learning Architecture explicitly selects it.
- Do not add interactions to satisfy a count or pattern.
- Do not present a teaching toy as paper data.
- Do not continue past a rejected first-slice acceptance.
- Do not mark G6 complete automatically or publish to PaperSkill.

## Completion Criteria

The reviewed milestone is implemented, its checks and learning acceptance are recorded, and the next milestone remains a human decision.
