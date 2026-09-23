---
name: final-audit
description: Review the complete tutorial's content, engineering, interactions, and release scope for Gate G7.
---

# Final Audit

## Purpose

Find factual, interaction, engineering, and release-scope problems before a person decides whether the result is ready.

## Required Inputs

- Research review and evidence audit
- Storyboard and interaction plan
- Canonical and Enhanced outputs
- `templates/content-check.md`
- `templates/release-check.md`

## Preconditions

- Enhanced implementation is available for inspection.
- Existing build and project audit commands are known.
- Asset provenance and repository diff can be reviewed.

## Procedure

1. Check the core problem, idea, architecture, terms, equations, figures, experimental values, conclusions, limitations, and analogy boundaries against the evidence audit and paper.
2. Run the project's build and checks; inspect source paths, asset provenance, local absolute paths, tracked dependencies, and build artifacts.
3. Compare implemented interactions with the interaction plan, including important states, reset, keyboard access, reduced motion, and mobile layout.
4. Record findings and unresolved items in `audit/content-check.md`; set its status only after review.
5. Check gate states, canonical/Enhanced separation, repository hygiene, and the official PaperSkill import/validation/build/PR preparation boundary.
6. Record release blockers and set `audit/release-check.md` to `READY` only after the checklist is actually satisfied.
7. Present findings for human acceptance. Do not change G7 state.

## Output

- `papers/<paper-id>/audit/content-check.md`
- `papers/<paper-id>/audit/release-check.md`

## Validation

- Each factual finding points to a source or evidence-audit record.
- Build and project audit outcomes are recorded accurately.
- Interaction and accessibility review covers the implemented project.
- Release scope respects the separate PaperSkill repository.

## Forbidden Actions

- Do not claim checks passed when they were not run.
- Do not hide blockers or infer approval from an automated build.
- Do not push, import into PaperSkill, publish, or create a PR.
- Do not mark G7 complete automatically.

## Completion Criteria

Both audit files record their actual findings and status, with unresolved blockers clearly stated for a human release decision.
