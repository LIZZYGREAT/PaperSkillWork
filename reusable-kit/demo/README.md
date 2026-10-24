# Reusable Kit local demo

The demo is the review surface for the Kit source. It contains a Foundation Component Lab plus LwF and EWC real-content scenarios that use the same primitives with different paper data. The examples contain no benchmark values and are not a substitute for checking a paper's source, evidence, or conditions.

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
