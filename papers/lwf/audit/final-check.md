# Final Learning, Evidence, and Release Check: Learning without Forgetting

Scope: standalone source `web/final/`, chapters 00–07. This v3 audit replaces the active v2 checklist; the original v2 bytes are preserved at `migration/legacy-final-check-v2.md`.

## W7 Vertical Slice Human Review

See `design/implementation-plan.md`. The human review decision is pending. Engineering checks do not establish learning acceptance.

## W9 Learning Audit

- [ ] A first-time reader can explain the old-data constraint and LwF's key move.
- [ ] A reader can reconstruct shared parameters, old/new task heads, and ownership.
- [ ] A reader can trace one full input, response, loss, backward, and optimizer-update sequence.
- [ ] A reader can explain temperature, `λ_o`, weight decay, and the input-coverage limit.
- [ ] A reader can identify the latest-model teacher handoff in sequential task addition.
- [ ] A reader can explain the selected result with dataset, model, split, metric, protocol, and value derivation.
- [ ] Paper facts, paper results, author interpretations, implementation mappings, background, and teaching toys remain distinct.
- [ ] The source-visual inventory and evidence locators have been visually reviewed against the PDF.
- [ ] Human reviewer and findings are recorded.

## Engineering, Accessibility, and Mobile

- [x] Final source dependencies were installed from the lockfile; production build completed.
- [x] Final source unit and browser checks completed; exact outcomes are recorded below.
- [x] Automated 390px overflow and reduced-motion checks passed.
- [ ] Keyboard-only navigation, visible focus, and assistive-technology behavior received human review.
- [x] The standalone Final source reads reference YAML locally and has no workspace-external import.
- [x] The PDF and source cache are outside `web/final/`.

## W10 Upstream Preflight

- [ ] W0–W9 prerequisites are complete, including the human W9 audit.
- [ ] Public participant name and pinyin release identifier are supplied and recorded.
- [ ] A clean PaperSkill checkout and its current upstream base are supplied and verified.
- [ ] The machine report `audit/upstream-preflight.json` records the official import, validation, build, preflight, upstream revision, and export hash.
- [ ] The proposed upstream diff contains only this exported tutorial directory.
- [ ] Maintainer review and publication decision are recorded separately from CI.

## Engineering Run Record

- 2026-09-28: `npm ci --cache .npm-cache` in `web/final/` — PASS.
- 2026-09-28: `npm run build` in `web/final/` — PASS (TypeScript and Vite production build).
- 2026-09-28: `npm test` in `web/final/` — PASS (5 tests).
- 2026-09-28: `npm run test:browser` in `web/final/` — PASS (11 browser checks, including chapter navigation, interactive controls, mobile width, and reduced motion).
- Python workflow suite, migration status check, source-visual human review, and upstream preflight are recorded after the remaining work; none is represented as complete here.

## Open Issues

- W2, W4, W7, and W9 require real human review; no reviewer decision is fabricated.
- Figure/table images are inventoried but not selected for public reuse because rights are unverified.
- `upstream_paper_name`, version/pinyin, participant identity, PaperSkill checkout, and the W10 preflight report are not available yet.

Overall: PENDING

Overall must remain PENDING until the human learning/evidence audits and required release checks are complete. Build success cannot override a learning, evidence, accessibility, or rights failure.
