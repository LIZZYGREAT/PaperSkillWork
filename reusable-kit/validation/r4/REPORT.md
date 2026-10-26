# R4 validation report

Date: 2026-10-26, with vector-clipping display repair recorded after review of the supplied desktop screenshot.

## Results by task

| Task | Result | Evidence |
| --- | --- | --- |
| T1 · preserve the two earlier trials | Source and concise scene notes are in `scenes/network/` and `scenes/matrix-reference/`; the public preview script reconstructs each in an isolated project. Only the earlier 1440px matrix screenshot is retained. | `preview.py`; `evidence/matrix-reference-1440.png` |
| T2 · independent 2→3→1 scene | Exact Registry selection of `MiniNetworkGlyph` produced its three-file closure: component TSX, component CSS, and `kit.css`. TypeScript and Vite production build passed. No Gallery CSS or component-internal patch is used. | `scenes/network/`; `python reusable-kit/validation/r4/preview.py --scene network --check-only` |
| T3 · new positive-reuse scene | The vector-clipping scene selects `RepresentationVector`, `ResponseMeter`, and `FlowConnector`; exact closure has five files. TypeScript and Vite production build passed (32 modules). | `scenes/vector-clipping/`; `python reusable-kit/validation/r4/preview.py --scene vector-clipping` |
| T4 · data-flow semantics | `representation-to-score` is classified as `data`; its desktop browser regression passed. | Commit `0312420`; `npm.cmd run test:browser -- --grep "catalog preview uses a data edge"` (1 passed) |

## Vector-clipping screenshot repair

The supplied image showed raw floating-point digits running together in the output vector, a long scale equation overflowing its card, and connector labels colliding with nearby content. The scene now rounds visible values to at most two decimal places, keeps full precision in the calculation, adds space between the displayed vector coordinates, puts the general scale formula and numeric substitution on separate lines in the same equation style, and shortens the connector labels to `norm`, `scale`, and `apply α`. The scene README records this display rule. No shared Kit component CSS was changed.

A follow-up image showed that the first repair gave the two scale equation rows different typography. Both rows now share one paragraph and therefore use the same font, size, color, and line-height. The clipped-gradient equation and its norm-bound row now use that same treatment; only a line break separates each pair.

For the screenshot values `g = (1, 4)` and `c = 2.5`, the full-precision calculations are `‖g‖₂ = √17`, `α = 2.5 / √17`, and `g′ = (2.5 / √17, 10 / √17)`. The display rounds these to `4.12`, `0.61`, and `(0.61, 2.43)`; the clipped norm displays as `2.5`. This is formatting only; the component calculations continue to use unrounded numbers.

The post-repair isolated TypeScript/Vite build succeeded and transformed 32 modules. The preview command serves `http://127.0.0.1:4179` while its process is running.

## Browser review status

Browser interaction, desktop layout, browser errors, and browser full-screen remain **NOT_RUN** for the network and vector-clipping trials. The in-app browser timed out connecting to `http://127.0.0.1:4179`; the available Edge window was minimized, and the Edge browser adapter was unavailable. The earlier network trial had already been blocked by the Computer Use policy, which explicitly prohibited trying another browser surface for that same capture. No alternate browser automation path was used.

No mobile viewport was checked in this follow-up, per the user's instruction to check only browser and browser full-screen. The earlier matrix trial report records its own historical Edge checks; this report does not claim those checks were rerun. Its 1440px screenshot is retained for reference, and no phone-sized screenshot has been copied into this validation package.

To finish the visual check locally, start one scene using the commands in `../README.md`, inspect it in a desktop browser, then press F11 for browser full-screen. In particular, confirm the formula stays within the shared-scale card and the clipped vector values remain separate and limited to two decimal places.

## Boundaries

All R4 scenes are synthetic. Registry assets remain `candidate`; this work does not approve them. No file under `papers/**` or the upstream PaperSkill repository was changed. The full Demo, CLI, and Visual QA regressions recorded earlier in `docs/VISUAL_LANGUAGE_SYSTEM.md` were not rerun after this validation-only typography repair.
