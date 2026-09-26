# Reusable Kit local demo

The demo switches between small LwF and EWC mechanism sketches. Both use the same kit components with different paper data. The examples contain no benchmark values and are not a substitute for checking a paper's source, evidence, or conditions.

Run locally:

```powershell
npm ci
npx playwright install chromium
npm run dev
```

Build both demo pages and the browser assertion page with `npm run build`, then run `npm run test:browser`. Headless Chromium checks semantic graph edges and positions, interaction behavior, scroll-step synchronization, reduced motion, viewport-safe popovers, mobile layout, and figure zoom. The demo is a local component validation surface, not a separately deployed product.
