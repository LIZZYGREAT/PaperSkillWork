# Final Learning, Evidence, and Release Check: {{paper_title}}

## W7 Vertical Slice Human Review

See `design/implementation-plan.md` for the first-slice review and any revision loop.

## W9 Learning Audit

- [ ] A first-time reader can explain the problem and central idea.
- [ ] A reader can reconstruct the core architecture and ownership.
- [ ] A reader can trace a complete data/state/runtime flow.
- [ ] A reader can explain training/inference and the important equations where applicable.
- [ ] A reader can explain the main design reason, experimental conclusions, and major limits.
- [ ] Main-line explanation is not hidden in hover or Reference.
- [ ] No redundant core explanations, unnecessary formulas, toys, or interactions remain.
- [ ] Human reviewer and findings are recorded.

## W9 Evidence Audit

- [ ] Important facts, equations, architecture, numbers, datasets, and protocols resolve to the evidence registry and source cache.
- [ ] Paper facts/results, interpretations, implementation mappings, background, and teaching examples are distinguished.
- [ ] Conditions and limitations are stated without broadening the evidence.
- [ ] All source figures/tables are inventoried; selected images have correct provenance and reuse rights.
- [ ] Asset paths are relative; exported README includes image provenance; no PDF is included.

## Engineering, Accessibility, and Mobile

- [ ] Build and project checks were run; actual outcomes are recorded.
- [ ] Keyboard/focus, touch/non-drag alternatives, reduced-motion, and mobile behavior were reviewed where applicable.
- [ ] Export is self-contained and has no external shared runtime dependency or local machine path.

## W10 Upstream Preflight

Upstream Preflight: PENDING

- [ ] All upstream-required project files are present in `html_output/<paper-name>/<version>/`.
- [ ] Current official upstream validation/preflight was run; command, upstream revision, and actual result are recorded.
- [ ] Tutorial PR contains only this exported tutorial directory.
- [ ] Any workflow/skill change is in a separate PR.
- [ ] Maintainer merge/publication decision is not represented as guaranteed by CI.

## Open Issues

Record unresolved learning, evidence, rights, engineering, accessibility, or release issues.

Overall: PENDING

Overall must be FAIL if any core learning outcome, evidence boundary, or required reuse right fails. Build success cannot override a learning or evidence failure.
