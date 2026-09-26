# Reusable Kit

`reusable-kit/` is a source template library for paper tutorials. Its components reuse ways of showing structure, process, responsibility, state, evidence, and terms; paper projects supply the content and conclusions.

## Copy-on-scaffold

Create a Workflow v3 paper workspace first. Then copy the continual-learning P0 components and the P1 choices made in W5 in one command:

```powershell
python tools/paper.py new my-cl-paper --title "Continual Learning Paper" --url "https://example.org/paper"
python tools/paper.py scaffold-kit my-cl-paper --preset continual-learning --add EvidenceViewer,BenchmarkExplorer,FormulaBlock
```

To use only the P0 preset, omit `--add`.

The command creates `papers/<paper-id>/web/enhanced/src/shared/` and writes the Kit version to `KIT_VERSION`. It preserves the source layer paths (`foundation/`, `core/`, and selected `optional/`) so internal imports resolve after the copy. It refuses to overwrite an existing `shared/` directory. A paper's copied code is independent; it never syncs back to `reusable-kit/`.

Add the shared stylesheet once from the paper entry point:

```tsx
import "./shared/foundation/styles/kit.css";
```

Then import only the chosen components, for example:

```tsx
import { ProcessLoopExplorer } from "./shared/core/process-loop";
import { ResponsibilityMap } from "./shared/core/responsibility-map";
```

Optional component imports use `./shared/optional/<component-folder>`. No npm workspace package, symlink, or cross-paper runtime import is created.

## Registry and selection

`reusable-kit/registry.yaml` is the canonical list of names available to `implementation.stages[].reusable_pattern`. A non-null name not in the registry makes the Workflow v3 implementation-plan check fail. Use `null` when no reusable pattern applies. `--add` accepts registered P1 components only; the default continual-learning preset includes Foundation and P0.

| Tier | Contents |
| --- | --- |
| P0 | Foundation controls, feedback and overlays; ReferenceHub, TermRef, ExpandableDetail; ProcessLoopExplorer, ArchitectureExplorer, FlowStepper, ResponsibilityMap, StateMachineExplorer, PaperFigure, StickySystemView |
| P1 | CompareView, MultiViewInspector, RepresentationTransform, CompatibilityChecker, EvidenceViewer, BenchmarkExplorer, DatasetCard, FormulaBlock / FormulaTerm, InlineCallout |
| P2 | ProgressiveValidation and FaultInjectionStack are listed in the implementation plan as on-demand ideas, not implemented or scaffoldable in Kit v1 |

Each recipe in `reusable-kit/recipes/` describes when a pattern helps, when to avoid it, a minimum interaction, suggested components, and anti-patterns.

## Local demos and checks

The local app at `reusable-kit/demo/` contains LwF and EWC mini demos. It illustrates component reuse only; the displayed method sketches need paper-specific source checking before use in a tutorial.

```powershell
cd reusable-kit/demo
npm ci
npm run dev
npm run test:browser
npm run build
```

`test:browser` opens a local assertion page for rendering, data-driven interactions, keyboard focusability, reduced-motion behavior, and figure zoom. Workflow and scaffold checks run from the repository root with `python -m pytest -q`. TypeScript consumers should build their paper project after copying components. The kit preserves keyboard focus, touch-sized controls, reduced-motion behavior, and narrow-screen scrolling; the paper-specific implementation still needs its own accessibility and mobile review.
