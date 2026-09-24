---
name: final-audit
description: Review learning reconstruction, evidence boundaries, implementation semantics, engineering, accessibility, mobile, and release scope for Gate G7.
---

# Final Audit

## Purpose

Decide whether the tutorial teaches a reconstructable mental model and respects evidence and engineering constraints. Build success cannot override a learning failure.

## Required Inputs

- Learning Contract, Paper Model, Evidence Registry, Learning Architecture, and scene specifications
- Canonical and Enhanced outputs
- `templates/final-check.md` and `templates/release-check.md`
- Existing build and project audit commands

## Procedure

1. **Learning acceptance:** review every core scene's acceptance questions. Check architecture, ownership, flow, state/lifecycle, mathematics, implementation mapping, and end-to-end reconstruction. A core learning failure makes Overall FAIL.
2. **Evidence acceptance:** trace claims and numbers to evidence IDs and sources. Check paper fact/result, author interpretation, our interpretation, mapping, background, teaching toy, and future-work boundaries.
3. **Implementation semantics:** inspect object lifecycles, data/state flow, formulas, gradient/control sources, actual updates, and separation of paper data from teaching toys.
4. **Engineering acceptance:** run the project's declared build and checks; inspect repository hygiene and record actual outcomes.
5. **Accessibility and mobile:** check keyboard, focus, reduced-motion, reset, touch/non-drag alternatives, and mobile behavior as applicable.
6. **Release check:** verify Gate state, Canonical/Enhanced separation, asset provenance, and the official PaperSkill import boundary.
7. Save findings in `audit/final-check.md` and release readiness in `audit/release-check.md`. Keep unresolved blockers visible.
8. Present results for human acceptance. Never change G7 state.

## Forbidden Actions

- Do not treat all planned interactions being implemented as a pass condition.
- Do not claim checks passed when they were not run.
- Do not infer learning from build results or structural completeness.
- Do not push, import, publish, or create a PR.
- Do not mark G7 complete automatically.

## Completion Criteria

Both audit artifacts reflect actual findings. Overall status is FAIL if any core learning outcome or material evidence boundary fails, even when all engineering checks pass.
