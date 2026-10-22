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

## Reuse and abstraction boundary

Reusable patterns express interaction behavior and visual relationships, not paper-specific conclusions or algorithm data. A recipe should state the learning task it serves, when not to use it, its inputs and state changes, responsive and accessibility behavior, and common misuse. Prefer existing CSS recipes and semantic HTML; add a shared component only when the same behavior recurs across projects and can be described without embedding one paper's content. Do not retrofit Kit source into existing paper copies automatically.

## v2 source audit and decisions

This audit describes the Kit source at `1.0.0`; it is not an approval record. Existing copies under `papers/**` are historical consumers and stay untouched. Every registry entry remains a v2 `candidate` until its API, representative content, browser states, screenshots, and human visual review have been completed.

| Area | Current evidence | Decision | v2 public boundary and risk |
| --- | --- | --- | --- |
| Typography and surface styles | `kit.css` exposes only body, supporting, meta, and formula roles, while component rules still use scattered rem/px values and repeated selectors. | REFACTOR | Add a small semantic type/spacing/surface token set and use it inside Kit components. Do not rewrite typography in existing papers. |
| Button | The source already has one import and the intended `primary`, `secondary`, `quiet`, and `danger` variants, with `small` and `medium` sizes. The Demo does not exercise the full state/content matrix. | REFACTOR | Keep `Button` as the only public button primitive; complete explicit size, icon-only, focus, pressed, disabled, long-label, and narrow-container behavior only where demonstrated and tested. |
| Chip, SegmentedControl, and Slider | Each has one public source and is used by Kit components or the Demo, but visual and input-boundary coverage is incomplete. | KEEP, then REFACTOR as evidence requires | Preserve the current focused APIs. Do not add synonymous variants or a control-provider layer. |
| Drawer, MobileSheet, and Popover | Focus trapping, focus restoration, Escape, backdrop/outside dismissal, and viewport placement already share useful foundation code. The default 440px Drawer leaves less usable width than ReferenceHub's two columns require. | REFACTOR | Keep one overlay foundation. Add an explicit reading-sized Drawer contract and responsive Hub composition rather than paper CSS that widens internals. |
| TermRef | Kit and copied-paper versions use the shared popover-position hook. Current default labels and Demo content are English, so they violate the v2 Chinese quick-preview contract. | REPLACE API/content model, reuse interaction base | `TermRef` is the sole public term trigger. It consumes the Hover side of one canonical knowledge entry and opens the matching Hub ID. |
| TermPopover | In Kit it is only `export const TermPopover = TermRef`; no Kit or Demo caller imports that alias. Similarly named paper-local components are independent historical implementations. | RETIRE from the new registry/API | Do not add a compatibility wrapper. Existing paper copies are not removed or migrated automatically. |
| ReferenceHub | It has search, kind filtering, separate list/detail scrolling, and detail scroll reset. It owns selection internally, starts unselected, and writes `location.hash`, which can overwrite the tutorial's reading anchor. | REPLACE API/state contract, reuse useful view behavior | Accept a controlled/opened canonical ID, navigate related IDs without losing context, keep all visible and accessible copy English, and leave URL synchronization opt-in. |
| ExpandableDetail | One implementation, no competing public API, and a bounded disclosure role. | KEEP | Supporting detail only; it must not hide a CORE explanation. |
| ProcessLoopExplorer, ArchitectureExplorer, FlowStepper, ResponsibilityMap, StateMachineExplorer, PaperFigure, and StickySystemView | They are exercised by the LwF/EWC Demo and several are present in copied paper source. That proves functional reuse, not approved visual quality. | KEEP as candidates | Retain their focused teaching roles and validate representative content. They do not become a universal algorithm runtime or a forced end-to-end composition. |
| Diagram geometry | `createDiagramPath()` derives boundary endpoints for straight, curve, and orthogonal paths, but has no explicit ports, endpoint gap, loop contract, label metadata, or marker-ID helper. | REFACTOR | Keep geometry data-only; add explicit ports/gaps and scoped marker support without promising general obstacle avoidance. |
| P1 optional components | Each has a single source entry and is copied only on request. Browser and visual evidence varies by component. | KEEP as candidates | Continue opt-in selection. Formula components receive priority because Hub and teaching scenarios need robust mathematical layout. |
| Demo and browser checks | The assertion page covers many interactions and the LwF/EWC walkthrough covers synchronized state. It does not provide a Component Lab, a Chinese Hover to English Hub journey, or a complete visual review matrix. | REFACTOR | Evolve the existing Demo and Playwright setup; do not add Storybook or a parallel QA system. |

The copied-paper survey found three kinds of reference implementation: snapshots of Kit `TermRef`/`ReferenceHub`, an EWC-specific `ReferenceTrigger` plus `ReferenceHubDrawer`, and LwF-specific `ReferencePrimitives` plus its own Hub. They are evidence for interaction details, not additional v2 public APIs. New Kit work converges on `TermRef`, `ReferenceHub`, and the Foundation overlay primitives; migration of an existing paper requires separate authorization, diff, build, browser regression, and review.

The current scaffold selects P0 entries by `tier` and `default_for`, then copies whole source directories. Because `foundation/` is always copied and several component names share a directory, registry maturity cannot yet prevent candidate code from appearing in a new workspace. v2 therefore needs `status: candidate | approved | deprecated` validation and selection rules in addition to `tier`; directory copying remains an implementation detail and must not be presented as component approval.

## Registry and selection

`reusable-kit/registry.yaml` is the canonical list of names available to `implementation.stages[].reusable_pattern`. A non-null name not in the registry makes the Workflow v3 implementation-plan check fail. Use `null` when no reusable pattern applies. `--add` accepts registered P1 components only; the default continual-learning preset includes Foundation and P0.

`tier` and future maturity `status` answer different questions: tier controls default/optional scope, while status records whether the component has completed quality review. Until the registry migration is implemented, the table below describes v1 behavior only and must not be read as v2 approval.

| Tier | Contents |
| --- | --- |
| P0 | Foundation controls, feedback and overlays; ReferenceHub, TermRef, ExpandableDetail; ProcessLoopExplorer, ArchitectureExplorer, FlowStepper, ResponsibilityMap, StateMachineExplorer, PaperFigure, StickySystemView |
| P1 | CompareView, MultiViewInspector, RepresentationTransform, CompatibilityChecker, EvidenceViewer, BenchmarkExplorer, DatasetCard, FormulaBlock / FormulaTerm, InlineCallout |
| P2 | ProgressiveValidation and FaultInjectionStack are listed in the implementation plan as on-demand ideas, not implemented or scaffoldable in Kit v1 |

Each recipe in `reusable-kit/recipes/` describes when a pattern helps, when to avoid it, a minimum interaction, suggested components, and anti-patterns.

`TermRef` and the general-purpose `Popover` share the Foundation `usePopoverPosition` hook. Both keep their panels inside the viewport, reposition after scroll or resize, and dismiss on an outside press or Escape. `TermRef` opens on pointer hover and keyboard focus; click or tap pins it open, and its callback routes the same canonical entry ID to the Reference Hub. `TermPopover` is not a separate v2 entry point.

## Component behavior and expression boundaries

For v2, `TermRef` quick-preview labels and prose default to natural Chinese, while every visible or announced `ReferenceHub` label and detail remains English. They share one canonical ID but use purpose-written content for different reading depths. ReferenceHub keeps its entry list and detail pane independently scrollable and resets only the detail pane when selection changes. Drawer uses the visible title as its dialog name, traps keyboard focus while open, restores focus when closed, and supports pointer dismissal on the backdrop.

Use FlowStepper for an ordered sequence only. If other views share its current stage, pass a controlled step and handle onStepChange with the same shared state; the component does not infer graph edges or transitions.

Simple mathematical notation can remain ordinary text. FormulaBlock is for a complete expression that benefits from a dedicated, horizontally scrollable region; pass an accessible label and a rendered MathML/KaTeX node for complex typesetting. FormulaTerm should represent only terms the learner can inspect or connect to another view, not every symbol in the equation.

Typography roles are exposed as overridable CSS custom properties in foundation/styles/kit.css. Paper themes may override these tokens; component defaults should not force a global typeface or color system.

## Local demos and checks

The local app at `reusable-kit/demo/` contains a Foundation Component Lab and LwF/EWC real-content scenarios. The Lab is the review surface for semantic typography roles, bounded Button/control variants, shared surfaces, viewport-safe Popover behavior, and default versus reading-sized Drawer layouts. The scenarios illustrate component reuse only; the displayed method sketches need paper-specific source checking before use in a tutorial.

```powershell
cd reusable-kit/demo
npm ci
npx playwright install chromium
npm run dev
npm run build
npm run test:browser
```

`test:browser` runs the assertion page, Component Lab layout checks, and LwF/EWC scroll-sync walkthrough in headless Chromium. Workflow and scaffold checks run from the repository root with `python -m pytest -q`. TypeScript consumers should build their paper project after copying components. The Kit preserves keyboard focus, touch-sized controls, reduced-motion behavior, and narrow-screen scrolling; the paper-specific implementation still needs its own accessibility and mobile review. Build and browser success keep the v2 work at `candidate`; approval still requires screenshot review and explicit human acceptance.
