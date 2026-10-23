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
