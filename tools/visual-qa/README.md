# Visual QA runner

This config-driven Chromium runner captures the two approved wide viewports (1440×900 and 1920×1080), records browser console/page errors, checks configured DOM geometry, and writes JSON and Markdown reports. It does not build a project, judge visual quality, approve designs, or change reference screenshots.

## Run the Kit demo example

From the repository root, install the already locked Playwright dependency and browser if needed, build the demo, then run:

```powershell
Push-Location reusable-kit/demo
npm ci
npx playwright install chromium
npm run build
Pop-Location
node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json
```

The runner loads Playwright from the Kit demo's existing lockfile so this repository keeps one pinned browser toolchain. Project pages do not import or depend on the demo. The example starts Vite preview on a strict port; if that port is occupied, the server startup error is reported instead of silently switching ports.

By default, artifacts go under `.visual-qa/run-<timestamp>/`. Use `--output <directory>` to choose another local artifact directory. Screenshots are stored by page, viewport, and state. The runner also writes `report.json` and `report.md`.

## Project config

Pass a JSON config with a `baseUrl`, optional local `server`, and a list of `pages`. Every state starts from a fresh page load, then applies only the declared actions. Supported actions are `click`, `fill`, `selectOption`, `press`, `scrollIntoView`, `waitFor`, and `wait`. Selectors use Playwright locator syntax, including CSS and role selectors. No arbitrary script is evaluated from config.

```json
{
  "baseUrl": "http://127.0.0.1:5173",
  "server": {
    "command": "node",
    "args": ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
    "cwd": "../../my-project",
    "readyPath": "/"
  },
  "pages": [
    {
      "id": "overview",
      "path": "/",
      "states": [
        { "id": "default" },
        { "id": "details-open", "actions": [{ "type": "click", "selector": "[data-testid='details']" }] }
      ]
    }
  ],
  "geometry": {
    "checkPageHorizontalOverflow": true,
    "minSemanticFontSizePx": 12,
    "clippingSelectors": ["[data-vqa-check-clipping]"],
    "stableAcrossStates": [
      { "selector": "[data-vqa-stable-frame]", "properties": ["x", "y", "width", "height"], "tolerancePx": 2 }
    ]
  }
}
```

Config-relative paths are used for `server.cwd` and `regression.baselineDir`. A project may omit `server` to connect to an already running local site. Keep configs in the owning project or another architecture-level location and declare only that project's pages and states; the shared runner contains no paper-specific selectors.

The default report treats unexpected page-wide horizontal overflow and configured clipping/stability failures as errors. Small semantic text is a warning for human review. Configure `clippingSelectors` and `stableAcrossStates` only for content whose clipping or frame stability is an actual invariant; the runner does not inspect every DOM overlap.

## Approved screenshot baselines

To compare a few manually approved screenshots, set `regression.baselineDir`. The directory uses the same `page-id/viewport/state-id.png` layout as the screenshot output. Set `required: true` when every generated capture must have a baseline. Configure `maxDiffPixels`, `maxDiffPixelRatio`, and `pixelThreshold` for the project's expected rendering noise. A missing optional baseline is reported as `NOT_RUN`; a mismatch fails the run and saves a red difference image. The runner has no baseline-update mode.

The report keeps independent `BUILD`, `GEOMETRY_QA`, `VISUAL_REVIEW`, `REGRESSION`, `BROWSER_ERRORS`, and `HUMAN_ACCEPTANCE` statuses. `VISUAL_REVIEW` remains `NOT_RUN` until an Agent actually inspects the screenshots, and `HUMAN_ACCEPTANCE` remains `PENDING` until the user reviews them.
