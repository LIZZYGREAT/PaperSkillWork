# Learning without Forgetting Release Check

Release Check Status: NOT_READY

## Workspace and artifacts

- [ ] G0 through G6 have been verified complete.
- [x] Canonical baseline is present at `web/canonical/`, frozen separately from the Enhanced output at `web/enhanced/`; Enhanced is not presented as Canonical.
- [x] Production builds passed for both outputs with the Vite runner option. Structural validator checks passed; the validator's TypeScript syntax phase terminates on the scaffold `vite-env.d.ts` declaration, as documented in `content-check.md`.
- [x] Agent visual review covered all ten illustration/text mappings, term explanation behavior, and desktop (1600 px) and narrow (624 px) layouts.
- [ ] Final human paper-fact and acceptance review is complete.
- [ ] `content-check.md` is marked `PASS`.

## Repository hygiene

- [x] `node_modules/` and `dist/` are ignored build/runtime outputs, not tutorial source deliverables.
- [x] No project-authored absolute local paths were added to tutorial content or documentation.
- [x] The source PDF remains in the local paper workspace; it is not copied into the website.
- [x] Git scope is limited to `papers/lwf/`; `node_modules/`, `dist/`, and `source/paper.pdf` are excluded by ignore rules.
- [x] No third-party visual assets were added; the only optional related-work link is identified as a follow-up, not the original paper.

## PaperSkill release preparation

- [x] No PaperSkill import or PR was started. The structural validator and local production build were run; any future release still needs PaperSkill's official import and release flow.
- [ ] Official import validation/build, a release diff, and PR scope remain unprepared.
- [x] No PaperSkillWork Git history was merged or cherry-picked.

## Current blockers

The PaperSkillWork workflow gates in `paper.yaml` remain pending by design; no gate has been advanced. Canonical and Enhanced builds exist, but Canonical has not received human acceptance, Enhanced has not received final human paper-fact sign-off, and the upstream validator's syntax phase remains unresolved. PaperSkill import, publication, and PR preparation are outside this task's scope. Keep release status `NOT_READY` until these review and release decisions are made.
