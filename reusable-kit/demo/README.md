# Reusable Kit local demo

The demo contains a Foundation Component Lab plus small LwF and EWC real-content scenarios. The Lab displays typography roles, Button/control states, surfaces, a viewport-safe Popover, and the default/reading overlay size contract. The two scenarios use the same Kit components with different paper data. The examples contain no benchmark values and are not a substitute for checking a paper's source, evidence, or conditions.

Run locally:

```powershell
npm ci
npx playwright install chromium
npm run dev
```

Build both demo pages and the browser assertion page with `npm run build`, then run `npm run test:browser`. Headless Chromium checks Foundation sizing and responsive overlays, semantic graph edges and positions, interaction behavior, scroll-step synchronization, reduced motion, viewport-safe popovers, mobile layout, and figure zoom. The demo is a local component validation surface, not a separately deployed product, and passing these checks does not mark components approved.
