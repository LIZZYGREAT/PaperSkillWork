# Reusable Kit local demo

The demo is the review surface for the Kit source. Pattern Gallery is the entry route for reusable examples; its DiagramFlow, StickySystemView, and typography panels contain complete TSX components, while editorial panels are paired TSX/CSS fragments with caller-provided data. The Foundation Component Lab and LwF/EWC real-content scenarios remain available and use the same primitives with different paper data. The examples contain no benchmark values and are not a substitute for checking a paper's source, evidence, or conditions.

Run locally:

```powershell
npm ci
npx playwright install chromium
npm run dev
```

Build both demo pages and the browser assertion page with `npm run build`, then run `npm run test:browser`.

`test:browser` checks, in headless Chromium:

- Foundation typography sizes, control states, viewport-safe Popover placement, and the default versus reading Drawer contract.
- The LwF figure: complete stage and node labels (no ellipsis, nothing clipped), connectors that stay inside the figure, in-figure type at its role size, a title block that does not crowd out the figure, object and edge state per step, MathML formulas with real fractions and summation limits, the narrow-screen reflow into a grouped list, and sidebar selection kept separate from keyboard focus.
- Scroll-to-step synchronization, reduced motion, the Chinese hover to English Hub journey, and mobile layout.

The demo is a local validation surface, not a separately deployed product. Passing these checks does not mark components approved: `reusable-kit/registry.yaml` still records every entry as `candidate` until a human accepts the rendered result.

Writing MathML in JSX needs the type augmentation in `../foundation/math/mathml-jsx.d.ts`; this project lists it in `tsconfig.json` `include`.

## Editorial studies

Choose **Editorial studies**, or open `/?demo=editorial` (anchors `#ed-a`, `#ed-b`, `#ed-c`). These local candidates explore three reading patterns: an enlarged inline proposition linked to Fisher weights; an alternating EWC chronicle whose selected stage highlights the narrative and inherited state; and an asymmetric LwF comparison whose two loss cues continue into the objective before the student gradient/update. The importance weights are synthetic teaching data.

The handoff uses one `stageIndex`: `learn-a` generates the reference; `save` stores its copy; `estimate` adds saved importance; `use-b` reads both while current parameters remain trainable. Future timeline stages stay visible as previews. Stage selection keeps the reader's scroll position; reset restores the first stage. Buttons keep their content vertically centered and left aligned. Reduced motion removes the short colour transitions.

After building, run the shared desktop capture from the repository root:

```powershell
node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json
```

The config preserves the original demo states and adds A, three B states, and C at the existing three desktop viewports. To also save focused 1440px/390px sections and the three B states through the existing browser tests, run from this demo directory:

```powershell
$env:EDITORIAL_REVIEW_CAPTURE = '1'
npm run test:browser -- --grep editorial
Remove-Item Env:EDITORIAL_REVIEW_CAPTURE
```

These optional captures go into Playwright's `test-results/`. Inspect actual screenshots and the shared runner report before cleaning this run's exact paths, as described in `docs/VISUAL_QA.md`. Passing automated checks leaves human visual acceptance pending and every registry entry at `candidate`.

### C composition candidates

The default `/?demo=editorial#ed-c` keeps the original C baseline. Open `/?demo=editorial&c=c1#ed-c` for the editorial convergence candidate, or `/?demo=editorial&c=c2#ed-c` for the student-centered computation scene. Unrecognized `c` values fall back to baseline; A/B stay identical. Native links within either candidate allow keyboard comparison and a return to baseline. Neither candidate is selected as the new default.

See [the one-page design comparison and shared content checklist](EDITORIAL_C_REVIEW.md). The existing browser suite retains baseline C coverage and adds both candidate routes, four viewports, complete MathML, correct update ownership, and A/B DOM/pixel invariance. With `EDITORIAL_REVIEW_CAPTURE=1`, it also saves each candidate's full section at all four viewports and a 1440×900 opening screenshot. The same shared Visual QA config includes independent C1/C2 pages at the three desktop viewports.


## Mini network and synchronized timeline

Open `/?demo=gallery#gallery-mini-network` for the stable 3–5–3 focus toggle and shared-input Teacher/Student composition; open `/?demo=gallery#gallery-timeline` for the five-stage forward teaching scene. It creates one Hook and derives navigation, diagram, explanation, formula/output and controls from the same snapshot. Numbers are synthetic; sigmoid training output is distinct from nearest-mean classification.

`src/examples/NetworkExamples.tsx` and `ForwardTimelineExample.tsx` are both the rendered components and raw sources for runnable copy panels. Their recipes use identical TSX after import-path rewriting. `tests/advanced-primitives.spec.mjs` verifies network geometry/ownership, five-region synchronization, replay while playing, independent sigmoid arithmetic, reduced motion and 1440/1920/390 layouts. The generic read/transform/validate/write reuse fixture and deterministic clock checks live in `src/smoke-tests.tsx`.

Run `python reusable-kit/demo/scripts/test-advanced-scaffold.py` from repository root for a fresh isolated CLI scaffold, strict recipe TSX build and Chromium check. It installs from the template lockfile, never creates a test paper under this repository's `papers/`, and cleans only its own verified temporary root after success. Failures retain their exact diagnostic directory.

To preserve review screenshots outside Playwright output, set `PAPERWORK_REVIEW_DIR` to an owned absolute directory before running `npm run test:browser -- --grep "network focus|forward timeline|reduced motion keeps"`. Inspect them and the shared QA report before exact cleanup. Human acceptance remains pending.


The reference-informed refinement uses object-specific graphics: a fixed pixel sample, layered feature blocks and pooling, a signed vector, class-weight branches and per-class sigmoid meters. The same Hook snapshot also traces inner feature blocks and class rows. Run `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-advanced.json` from repository root for the two revised sections at 1440/1920/390; inspect its exact report and screenshots before cleanup. Actual paper pages are read-only references.
