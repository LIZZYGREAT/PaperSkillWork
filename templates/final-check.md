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

## W9 Visual QA Record

Record the actual commands, pages, states, viewports, screenshot/report locations, and findings. Use NOT_RUN when a check was unavailable.

| Status | Result | Evidence / notes |
| --- | --- | --- |
| BUILD | PASS / FAIL / NOT_RUN |  |
| GEOMETRY_QA | PASS / FAIL / NOT_RUN |  |
| VISUAL_REVIEW | PASS / FAIL / NOT_RUN |  |
| REGRESSION | PASS / FAIL / NOT_RUN |  |
| HUMAN_ACCEPTANCE | PENDING / PASS / REVISE |  |

BUILD, geometry, screenshot review, regression, and human acceptance are separate decisions. An agent must not record human W7/W9 acceptance on a person's behalf.

Record the exact build command and exit result. Geometry evidence names the pages, states, and viewports checked. Visual review requires screenshot paths and findings from screenshots actually inspected. Regression requires an approved baseline or before/after evidence and its interpretation. If evidence is missing, record BUILD, GEOMETRY_QA, VISUAL_REVIEW, or REGRESSION as NOT_RUN; keep HUMAN_ACCEPTANCE as PENDING until the user reviews the rendered result. A machine report cannot set visual review or human acceptance to PASS.

## Engineering, Accessibility, and Mobile

- [ ] Build and project checks were run; actual outcomes are recorded.
- [ ] Implementation coverage, project tests, production build, and Visual QA outcomes are recorded for the actual source. W8 does not require a PaperSkill checkout or official validator; that contract check belongs to the user's W10 preflight after W9 acceptance.
- [ ] Keyboard/focus, touch/non-drag alternatives, reduced-motion, and mobile behavior were reviewed where applicable.
- [ ] Export is self-contained and has no external shared runtime dependency or local machine path.

## W10 Official PaperSkill Release

After accepting W9, the user follows the official release steps in `docs/UPSTREAM_RELEASE.md` using the existing PaperSkill checkout. The official Import writes the version there; validate and preflight run in that repository. Codex does not run PaperSkill release commands or perform push/PR actions.

If recording the result, add only the actual command, outcome, and PaperSkill target path:

Official preflight command:

User-reported result: NOT_RUN / PASS / FAIL

PaperSkill target: `html_output/<paper-name>/<version>/`

After the user confirms preflight passed, `python tools/paper.py stage <paper-id> W10 complete` records progress. It does not verify or generate a machine report. The user's push and PR decision happens separately.

## Open Issues

Record unresolved learning, evidence, rights, engineering, accessibility, or release issues.

Overall: PENDING

Overall must be FAIL if any core learning outcome, evidence boundary, or required reuse right fails. Build success cannot override a learning or evidence failure.
