# Reusable Kit

`reusable-kit/` is a source template library for paper tutorials. It is copied into a paper workspace, never imported at runtime, and it never syncs back. Its job is to make a paper's *structure* readable — objects, connections, states, comparisons, evidence, terms — while the paper supplies every algorithm fact.

Current source version: `2.0.0` (`reusable-kit/KIT_VERSION`).

## Copy-on-scaffold

```powershell
python3 tools/paper.py new kit-smoke-demo --title "Kit Smoke Demo" --url "https://example.org/kit-smoke"
python3 tools/paper.py scaffold-kit kit-smoke-demo --preset continual-learning --add StepNav,FigureFrame,FormulaBlock,PullQuote --allow-unapproved
```

The first command is a virtual sample for isolated validation; a real paper must use its real source and title. The second command is one first-scaffold option: the `continual-learning` preset includes P0 components, while `--add` accepts P1 components only. All current entries are `candidate`, so `--allow-unapproved` explicitly accepts copying them; it does not approve them. The alternative first-scaffold command without optional P1 additions is `python3 tools/paper.py scaffold-kit kit-smoke-demo --preset continual-learning --allow-unapproved`. These two scaffold commands are mutually exclusive for the same new workspace.

Scaffolding writes `papers/<paper-id>/web/enhanced/src/shared/` plus `KIT_VERSION`, keeps the source layer paths (`foundation/`, `core/`, `compositions/`, `optional/`) so internal imports resolve after the copy, and refuses to overwrite an existing `shared/` directory. Choose all desired P1 additions on the first command; the scaffold operation is copy-on-scaffold and does not merge into an existing `src/shared/`.

### Independent copy verification

On 2026-10-25, a fresh `kit-smoke-demo` workspace was created and scaffolded with the two commands above, then removed after verification. `npm ci` and `npm run build` passed with strict TypeScript enabled. A headless Chromium run against the production preview verified `DiagramFlow` data/gradient semantics, `StickySystemView + StepNav + FigureFrame` manual synchronization, `FormulaBlock` term selection with `PullQuote`, and the 390px no-overflow/list fallback. This is engineering evidence only: all copied items remain `candidate`, and no human visual acceptance is implied.

The same date, a second fresh workspace explicitly selected `MiniNetworkGlyph,useAnimationTimeline` through `--add`. Its strict build and Chromium production-preview test passed with both candidates rendered together, timeline stepping changing network focus, compressed-count disclosure, frozen/trainable identity, and a 390px no-overflow check. The temporary workspace was then removed; this remains automated candidate evidence, not approval.

Add the shared stylesheet once from the paper entry point, then import only the components actually used:

```tsx
// In papers/<paper-id>/web/enhanced/src/App.tsx, add this stylesheet once.
import "./shared/foundation/styles/kit.css";
import { DiagramFlow } from "./shared/foundation/layout/DiagramFlow";
import { FigureFrame } from "./shared/compositions/figure-frame";
import { SectionHeader } from "./shared/compositions/section-header";
import { MetaList } from "./shared/foundation/data/MetaList";
import { StepNav } from "./shared/compositions/step-nav";
```

### Maturity gate

`scaffold-kit` includes the P0 files in the selected preset and adds only requested P1 files. It refuses candidate copies by default. Without `--allow-unapproved`, it reports the requested candidate names and asks for the flag:

```
Reusable Kit component(s) are not approved: ... Pass --allow-unapproved to scaffold them anyway.
```

`--add` accepts P1 only; P0 components such as `DiagramFlow` and `StickySystemView` already arrive through the `continual-learning` preset. Asking for a P0 with `--add` fails. `--allow-unapproved` copies candidate components and prints one `[WARN]` line per component. `deprecated` components can never be copied, with or without the flag. `python tools/paper.py check <paper-id>` fails on a `deprecated` `reusable_pattern` and only warns for a `candidate` one. A copied candidate is still a candidate: copying is not approval.

## Three delivery layers

Do not blur these. A view that only works for one paper is not a reusable component because it happens to run in the same demo.

Registry records maturity, Gallery supports discovery and interaction, Recipe supports choosing the right relationship, and Scaffold delivers a source-owned copy. None of these layers turns a layout into a mandatory paper template.

**1. Foundation / visual primitives — must be directly reusable**

- Typography, colour roles, spacing, surfaces, buttons, focus, overlays (`foundation/styles/kit.css`, `foundation/controls`, `foundation/overlay`).
- Visual language: warm paper for reading, a sage surface for figures, one accent green, one clay accent, and neutrals. Roles carry form as well as colour — dashed outline plus hatching for frozen, a left bar for trainable, a sand fill for a stored reference, one dark bar for the single update target.
- Diagram primitives: `DiagramNode` roles, connectors, arrowheads, port dots, labels, state badges, and the geometry in `foundation/layout/diagram.ts`.
- `DiagramFlow` (`foundation/layout/DiagramFlow.tsx`): declarative nodes in a grid with connectors measured from the real boxes. Stage names sit on a hairline above the columns instead of in another panel; each role carries form as well as colour (dashed outline and hatching for frozen, a left bar for trainable, a filled block for the one update target). Wide layouts draw the graph; narrow layouts reflow the same spec into an ordered list grouped under the same stage names, listing each node's inputs. It reflows instead of scaling, so in-figure text keeps its role size at every viewport. `template` overrides the equal-column grid when one stage needs more room than another.
- Math typography: formulas are MathML (`<math>`, `msub`, `munderover`, `mfrac`), laid out by the browser's math engine, so summation limits, fractions, and italic variables are real rather than styled text. Writing MathML in JSX needs `foundation/math/mathml-jsx.d.ts` in the program; a paper copies it beside its own `src` types. Inline symbols inside prose use `.rk-math` with `<var>`/`<sub>`.
- `TermRef` (Chinese quick preview) + `ReferenceHub` (English detail) sharing one canonical entry ID.

**2. Reusable compositions — approved only after cross-scene validation**

- `StepNav` (`compositions/step-nav`): synchronised step navigation whose grid wraps to as many rows as the width needs, so no step name is ever replaced by an ellipsis. It owns no state; the caller passes the current step. Validated against three data samples (a five-step LwF mechanism, a seven-step EWC system view, and a four-item Component Lab sample with deliberately long Chinese and English labels).
- `SectionHeader` (`compositions/section-header`): numbered eyebrow on a hairline rule, heading, and one lead paragraph. One header for every section is what keeps a long tutorial from becoming a stack of cards.
- `FigureFrame` (`compositions/figure-frame`): caption strip, step counter, note, a sage drawing area, and a key row. It bleeds past the text column by exactly its own padding, so the drawing still starts on the text edge instead of floating inside a box.
- `MetaList` (`foundation/data`): hairline label/value rows for inspected facts. It lives in Foundation because `core/` components (the state machine inspector) use it too.
- `StateMachineExplorer` lays states on a centred grid derived from the authored rows instead of trusting hand-placed coordinates, so the graph fills the width. The inspected state is a two-column panel — what the state is on the left, the pressable legal transitions on the right — and history is a numbered chip trail.
- `FormulaBlock` puts the equation on its own tinted paper with real MathML typesetting and keeps the terms plus the selected explanation beside it, so the expression and its annotation are read together.
- `CompareView` renders two lettered columns with their own rule and tone, then states the consequence as two short lists (`What changes` / `What stays invariant`) instead of a pair of tinted boxes.
- Branch and merge layouts are **recipes, not components**: `recipes/diagram-branch.md`, `recipes/diagram-merge.md`. They describe the structure a paper must satisfy on top of `DiagramFlow`. They stay recipes until two semantically unrelated papers use the same abstraction.

**3. Paper-specific teaching scenes — reuse the language, not the figure**

The LwF and EWC figures in `reusable-kit/demo/src/figures.tsx` are scene data for one paper each. A new paper writes its own figure specs with the same primitives. Reusing the visual language, the state cues, and the geometry is the goal; reusing the whole picture is not.

The toolbox reuses primitives; each paper remains free to design the scene demanded by its objects, states, relationships, computation, and conclusion. Repeating a composition across adjacent sections is allowed when the repeated spatial relationship helps cognition, but changing only the text is not a default template strategy: the implementation plan should explain what the repetition lets the reader track. Conversely, avoiding repetition is not a reason to add motion or decoration that carries no teaching work.

## Maturity and the registry

`reusable-kit/registry.yaml` is canonical. `tier` (P0/P1) only controls copying scope; `status` records quality review:

| Status | Meaning |
| --- | --- |
| `candidate` | Exists and is used in the demo/at least one paper. Not reviewed for reuse. |
| `approved` | A named human accepted it, with a date and reviewed evidence recorded in the entry. |
| `deprecated` | Kept so old plans resolve; may not be scaffolded. |

`approved` requires `approved_by`, `approved_at` (`YYYY-MM-DD`) and a non-empty `evidence` list. The validator rejects an approval record on a non-approved entry and vice versa, so maturity cannot be claimed in one direction and silently kept in another. **Every entry is currently `candidate`**: this round produced the reviewable figures and the gate, not the acceptance.

Layer 1 and 2 items are listed in the registry by name so `implementation.stages[].reusable_pattern` can resolve them. A non-null name that is not in the registry fails the implementation-plan check; use `null` when no reusable pattern applies.

## Reviewer constraints that are not negotiable

These come from the visual review that rejected the previous candidate. They apply to Kit work itself, not just to paper pages.

- Do not hide a sizing failure with `overflow: hidden`, `text-overflow: ellipsis`, or an arbitrary font shrink. Mainline step names, node titles, and axis labels must stay complete.
- Do not scale a diagram until its labels stop being readable; reflow, split into segments, or offer an inspect mode.
- Do not make every region the same rounded card. Groups, alignment, and whitespace carry the hierarchy.
- Do not put the paper's composition in a large override stylesheet. Paper CSS is for page rhythm; component behaviour and visual language belong in `kit.css`, where the component can be copied without its overrides.
- Do not let the title compete with the figure. A page title is one or two lines at 38–52px on desktop; the figure is the main scene.
- Do not claim approval, reuse success, or design completion from a passing build, a passing browser test, or a copied source directory.

## Local demo and checks

```powershell
cd reusable-kit/demo
npm ci
npx playwright install chromium
npm run dev
npm run build
npm run test:browser
```

The first demo route is the Pattern Gallery: it makes DiagramFlow connector and focus variants, editorial composition recipes, StickySystemView scroll synchronization, typography/formula examples, MiniNetworkGlyph local topology / parallel model composition, and one five-stage synchronized Animation Timeline scene discoverable with code panels. Diagram, sticky, typography, network, and timeline panels contain complete runnable TSX examples; editorial panels are TSX/CSS structural fragments whose caller data must be supplied. The Foundation Component Lab remains available as its own route, alongside the EWC, LwF, Editorial Studies, and Reading Journey scenarios. The Gallery is an entry point, not a second component registry; `registry.yaml` remains canonical and its entries remain candidates until human acceptance.

`test:browser` runs the assertion page plus Chromium checks for Gallery diagrams and scroll/manual synchronization, typography/control states, overlay contracts, the LwF figure (label completeness, connector geometry, in-figure type size, title/figure ratio, per-step object and edge state, narrow-screen reflow, sidebar selection versus keyboard focus), and the TermRef → English Hub journey. It asserts the *properties* the design requires, not a particular DOM shape.

Visual QA runs from the repository root; the Kit demo config captures three desktop viewports (1280×900, 1440×900, 1920×1080) and checks the declared selectors for clipping. The browser suite additionally checks its narrow reflow at 390px; the shared visual capture remains desktop-only:

```powershell
node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json
node tools/visual-qa/self-check.mjs
```

Build and browser success keep this work at `candidate`. `HUMAN_ACCEPTANCE` in the Visual QA report stays `PENDING` until the user reviews the captured screenshots.

## Still open

- The Kit now has one visual direction (warm paper, one green, one clay, sage figure surface). It has not been signed off by a human, and the earlier second candidate has been deleted rather than kept as a toggle.
- No component has an approval record, so the scaffold gate currently blocks a fresh copy unless `--allow-unapproved` is passed.
- The LwF notation in `figures.tsx` is a mechanism sketch. The loss coefficients, temperature, and head structure have not been checked against the paper PDF and must be verified before any of it appears in a tutorial.
- `ResponsibilityMap` is still only reachable as a collapsed audit view in the LwF scene; its own visual quality has not been redesigned.


The 2026-10-25 revision replaces the serial frozen→trainable example with independent models receiving shared input, and replaces two unrelated players with one clock driving navigation, system focus, explanation and computed outputs. `MiniNetworkGlyph.showDetails` defaults to true; false retains labels, ARIA descriptions and compression disclosure while omitting optional metadata. Both P1 entries remain candidates. See [the execution and verification record](mini-network-timeline-revision.md). Gallery copy panels load the actual compiled example sources; the recipes contain the same TSX with standalone import paths.
