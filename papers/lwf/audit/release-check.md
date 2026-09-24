# Learning without Forgetting Release Check — Workflow v2

## Workspace and artifacts

- [ ] G0 through G6 were reviewed under Workflow v2.
- [x] Existing Canonical and Enhanced outputs remain separate; Canonical was not modified during migration.
- [ ] Scenes A–C receive human learning acceptance.
- [ ] Final learning/evidence audit is marked `Overall: PASS`.
- [ ] Current Enhanced milestone passes its declared project checks.
- [ ] Accessibility, reduced-motion, and mobile acceptance are recorded.

## Repository hygiene

- [ ] No tracked dependencies, build output, secrets, or unintended local absolute paths.
- [ ] Local paper PDF stays outside the release output.
- [ ] Asset provenance and licenses are recorded where applicable.
- [ ] The release diff and scope are reviewed.

## PaperSkill release preparation

- [ ] Use the official PaperSkill import flow.
- [ ] Validate the imported artifact and prepare a release PR.
- [ ] Do not merge or cherry-pick PaperSkillWork history into PaperSkill.

## Current blockers

- Workflow v2 gates remain pending until reviewed.
- First Vertical Slice learning acceptance is still required.
- PaperSkill official import and release review have not started.

Release Check Status: NOT_READY
