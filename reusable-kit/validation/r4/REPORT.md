# R4 validation report

Date: 2026-10-26. Current results include post-repair desktop browser review for the V1 closeout.

## Results by task

| Task | Result | Evidence |
| --- | --- | --- |
| T1 · preserve the two earlier trials | Source and concise scene notes are in `scenes/network/` and `scenes/matrix-reference/`; the public preview script reconstructs each in an isolated project. Only the earlier 1440px matrix screenshot is retained. | `preview.py`; `evidence/matrix-reference-1440.png` |
| T2 · independent 2→3→1 scene | Exact Registry selection of `MiniNetworkGlyph` produced its three-file closure: component TSX, component CSS, and `kit.css`. TypeScript/Vite build and both desktop layouts passed; focus/restore preserves the six nodes and nine edges. No Gallery CSS or component-internal patch is used. | `scenes/network/`; preview commands below |
| T3 · new positive-reuse scene | The vector-clipping scene selects `RepresentationVector`, `ResponseMeter`, and `FlowConnector`; exact closure has five files. TypeScript/Vite build (32 modules), both desktop layouts and input changes passed. | `scenes/vector-clipping/`; calculations and commands below |
| T4 · data-flow semantics | `representation-to-score` is classified as `data`; its desktop browser regression passed. | Commit `0312420`; `npm.cmd run test:browser -- --grep "catalog preview uses a data edge"` (1 passed) |

## Vector-clipping screenshot repair

The supplied image showed raw floating-point digits running together in the output vector, a long scale equation overflowing its card, and connector labels colliding with nearby content. The scene now rounds visible values to at most two decimal places, keeps full precision in the calculation, adds space between the displayed vector coordinates, puts the general scale formula and numeric substitution on separate lines in the same equation style, and shortens the connector labels to `norm`, `scale`, and `apply α`. The scene README records this display rule. No shared Kit component CSS was changed.

A follow-up image showed that the first repair gave the two scale equation rows different typography. Both rows now share one paragraph and therefore use the same font, size, color, and line-height. The clipped-gradient equation and its norm-bound row now use that same treatment; only a line break separates each pair.

For the screenshot values `g = (1, 4)` and `c = 2.5`, the full-precision calculations are `‖g‖₂ = √17`, `α = 2.5 / √17`, and `g′ = (2.5 / √17, 10 / √17)`. The display rounds these to `4.12`, `0.61`, and `(0.61, 2.43)`; the clipped norm displays as `2.5`. This is formatting only; the component calculations continue to use unrounded numbers.

The post-repair isolated TypeScript/Vite build succeeded and transformed 32 modules. The preview command serves `http://127.0.0.1:4179` while its process is running.

## Browser review status

The earlier browser attempt was NOT_RUN because its available browser surface could not connect. This closeout performed a fresh, explicitly requested automated desktop check on each independently reconstructed scene, using the existing Playwright/Chromium and Visual QA runner.

| Check | Network | Vector clipping |
| --- | --- | --- |
| Isolated TypeScript / production build | PASS, 29 Vite modules | PASS, 32 Vite modules |
| Desktop Window layout | PASS, actual 1440×900 | PASS, actual 1440×900 |
| FULLSCREEN_LAYOUT | PASS, actual 1920×1080 | PASS, actual 1920×1080 |
| Interaction / data assertions | PASS: focus two edges, restore all, stable node coordinates and score 0.64 | PASS: default, requested clipping and adjusted non-clipping inputs |
| GEOMETRY_QA / BROWSER_ERRORS | PASS / PASS, 6 captures, no diagnostics | PASS / PASS, 6 captures, no diagnostics |
| Agent VISUAL_REVIEW | PASS for initial, focused and expanded arithmetic screenshots | PASS for requested and adjusted input screenshots, labels and formula rows |
| Runner STYLE_QA / pixel REGRESSION | NOT_RUN: no computed-style contract / approved baseline configured | NOT_RUN: same; formula style was checked separately in browser DOM |
| FULLSCREEN_REAL | 已核查（用户确认，2026-10-26） | 已核查（用户确认，2026-10-26） |
| Human scene visual review | 已核查（用户确认，2026-10-26） | 已核查（用户确认，2026-10-26） |
| Human asset approval | PENDING | PENDING |

Automated browser: Chromium 153.0.8010.12, headless, DPR 1 and zoom 100%. The actual automated inner dimensions were checked directly. On 2026-10-26, the user confirmed completing the outstanding review and requested these fields be marked 已核查; real F11 and human scene review are therefore recorded as user-verified. The user's screen, zoom and real-F11 inner dimensions were not supplied, so no values are invented or attributed to the automated run. No mobile/tablet/1280px screenshots were run. The matrix trial's historical 1440px evidence remains unchanged; its old browser checks were not rerun.

For `g=(1,4), c=2.5`, browser data retained norm `4.123105625617661`, scale `0.6063390625908325` and clipped norm `2.5`, while visible formula/vector values were `4.12`, `0.61`, `(0.61, 2.43)`. The output coordinate boxes had a 12px gap in both desktop layouts. Scale and output equation paragraphs shared the same monospace font, 12px size, 19.2px line height and color; neither overflowed. Changing to `g=(-3,0), c=5` produced norm 3, scale 1 and output `(-3,0)`, with text, meters and vectors synchronized. Screenshot review found no unintended label overlap, clipping or connector drift; no scene/UI repair was required.

## Commands and reproduction

From repository root, both build-only commands exited 0:

```powershell
python reusable-kit/validation/r4/preview.py --scene network --check-only
python reusable-kit/validation/r4/preview.py --scene vector-clipping --check-only
```

Each scene was then started separately with the corresponding command below, inspected at `http://127.0.0.1:4179`, and stopped with Ctrl+C. The terminal wrapper reported exit 1 for this intentional interruption; both temporary scene directories were verified absent afterward, and the completed build/browser checks above are the PASS evidence.

```powershell
python reusable-kit/validation/r4/preview.py --scene network
python reusable-kit/validation/r4/preview.py --scene vector-clipping
```

During each preview, `node tools/visual-qa/cli.mjs --config .qa/r4-v1-network.json` or `--config .qa/r4-v1-vector-clipping.json` exited 0 (three representative states × two desktop layouts). `node .qa/r4-v1-check.mjs network` and `node .qa/r4-v1-check.mjs vector-clipping` also exited 0 for the data/geometry/interaction checks above. These were task-owned temporary configs/checks, not a new permanent QA tool or supported entry point. Report/screenshot cleanup is recorded after review below; no unapproved screenshot is added to `evidence/`.

To reproduce the now user-verified review, run one permanent preview command, open the displayed URL in a desktop browser at 100% zoom and press F11. Check focus/restore for the network; for vector clipping set x=1, y=4, c=2.5, then change an input or threshold. Inspect labels, formula bounds and coordinate separation. Scene review does not change Registry maturity: asset approval still requires explicit per-asset acceptance and Registry evidence.

Both runner reports were read and key screenshots inspected before exact cleanup. The terminal `Report:` outputs identified `.visual-qa/run-2026-10-26T14-00-23-964Z` (network) and `.visual-qa/run-2026-10-26T14-06-36-266Z` (vector); each `--cleanup-run` exited 0, printed the same path with `CLEANED`, and `Test-Path` returned false. These are removed-run identifiers, not live evidence links. The task-owned focused screenshots were also removed after review. All four temporary preview/build directories were verified absent. The retained historical matrix evidence was untouched.

## Boundaries

All R4 scenes are synthetic. Registry assets remain `candidate`; this work does not approve them. No file under `papers/**` or the upstream PaperSkill repository was changed. The earlier Demo/CLI/Visual QA runs are available through Git history; they do not establish R4 post-repair browser acceptance. Current Kit principles live in [VISUAL_LANGUAGE.md](../../VISUAL_LANGUAGE.md).

## V1 closeout regression · 2026-10-26

From repository root, the final document/CLI/copy checks and existing Demo regressions produced:

| Actual command | Result / exit code |
| --- | --- |
| `python -m pytest -q tests/test_document_governance.py tests/test_kit_copy.py tests/test_paper_cli.py tests/test_workflow_implementation.py tests/test_workflow_schema.py --basetemp=.qa/v1-closeout-regression -o cache_dir=.qa/v1-closeout-regression-cache` | 63 passed / 0 |
| `npm.cmd --prefix reusable-kit/demo run build` | TypeScript/Vite PASS / 0; existing large-chunk notice retained |
| `npm.cmd --prefix reusable-kit/demo run test:browser -- --output=../../.visual-qa/v1-closeout-playwright` | 35 desktop tests passed / 0 |
| `python reusable-kit/demo/scripts/test-advanced-scaffold.py` | Exact example copy, isolated build and 1440/1920 interactions PASS / 0; own isolated directory self-cleaned and absence verified |
| `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-gallery.json` | 60 captures PASS / 0, zero geometry/style diagnostics and browser errors |
| `git diff --check`; protected paper/Registry/component/CLI/runner source diff against `e9df6f1` | PASS / 0 |

General Markdown/Skill checks remain active; only the retired case-library checks were removed. Relative links in the new Kit visual guide, Demo README, validation README and this report were also checked with the existing link-resolution helper. The initial general-link check caught an invalid link in the pre-existing setup draft; the revised setup guide and release-guide anchor resolved it, and the final suite passed.

Gallery screenshots were actually inspected for the opening and selected Reference Hub at both desktop sizes. This Agent review is separate from the runner's automatic statuses; approved pixel-baseline comparison remains NOT_RUN. Human visual review is 已核查（用户确认，2026-10-26）, following the user's closeout confirmation; individual Registry asset approval remains separate. Only this Gallery config was run for closeout; the unchanged runner core did not require another self-check, and no mobile visual trigger applied. The Gallery report path returned by this invocation was `.visual-qa/run-2026-10-26T14-14-39-020Z/report.md`; exact post-review cleanup is recorded below.

The Gallery `--cleanup-run` exited 0, printed `CLEANED` for that exact run, and absence was verified. Task-owned review crops, native Playwright output, pytest/cache directories and temporary R4 config/check files were also removed by their verified exact paths; the retained matrix screenshot and other historical evidence were preserved. The two preview commands stopped their temporary services, and no task listener remained on 4173/4178/4179. No additional permanent status/history document or screenshot baseline was created.
