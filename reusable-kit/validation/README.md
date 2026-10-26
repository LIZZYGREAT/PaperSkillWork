# Reusable Kit validation scenes

These standalone scenes make the R4 reuse trials reviewable without searching the Gallery or relying on the original temporary QA folders. All values are synthetic teaching examples, not paper results.

## Preview a scene

Run one command from the repository root:

```powershell
python reusable-kit/validation/r4/preview.py --scene network
python reusable-kit/validation/r4/preview.py --scene matrix-reference
python reusable-kit/validation/r4/preview.py --scene vector-clipping
```

The script recreates the selected scene in a disposable project, runs TypeScript and a Vite production build, then serves it at `http://127.0.0.1:4179`. Open that address in a desktop browser; press F11 to inspect browser full-screen. Press Ctrl+C in the terminal to stop the preview. `--check-only` rebuilds without starting the server.

The disposable project reuses the installed dependencies under `reusable-kit/demo/node_modules`; install the Demo dependencies with `npm.cmd ci --prefix reusable-kit/demo` if they are missing. The script does not use the old `.qa` trial directories, modify `papers/**`, or import Gallery CSS.

## Scenes

- `network`: exact `MiniNetworkGlyph` Registry closure in a synthetic 2→3→1 sensor network, with a focus/restore interaction.
- `matrix-reference`: a retained local calculation toy. The earlier trial correctly found that no Kit component expressed row-wise reduction and a shared mean reference. It is an example of choosing not to reuse.
- `vector-clipping`: positive reuse of `RepresentationVector`, `ResponseMeter`, and `FlowConnector` for vector norm clipping. The scene owns its calculation and layout. Displayed values use at most two decimal places while internal calculations retain full precision.

See [the R4 report](r4/REPORT.md) for the Registry closures, build results, screenshot provenance, and browser/full-screen checks that remain outstanding.
