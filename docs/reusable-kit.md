# Reusable Kit

`reusable-kit/` is a source template library for paper tutorials. It is copied into a paper workspace, never imported at runtime, and it never syncs back. Its job is to make a paper's *structure* readable — objects, connections, states, comparisons, evidence, terms — while the paper supplies every algorithm fact.

Current source version: `2.0.0` (`reusable-kit/KIT_VERSION`).

## Copy-on-scaffold

```powershell
python tools/paper.py new my-cl-paper --title "Continual Learning Paper" --url "https://example.org/paper"
python tools/paper.py scaffold-kit my-cl-paper --preset continual-learning --add EvidenceViewer,FormulaBlock
```

The command writes `papers/<paper-id>/web/enhanced/src/shared/` plus `KIT_VERSION`, keeps the source layer paths (`foundation/`, `core/`, `compositions/`, `optional/`) so internal imports resolve after the copy, and refuses to overwrite an existing `shared/` directory.

Add the shared stylesheet once from the paper entry point, then import only the components actually used:

```tsx
import "./shared/foundation/styles/kit.css";
import { DiagramFlow } from "./shared/foundation/layout/DiagramFlow";
import { StepNav } from "./shared/compositions/step-nav";
```

### Maturity gate

`scaffold-kit` copies **approved** components only. No component is approved yet, so today the command refuses to run and lists the unapproved names it would have copied:

```
Reusable Kit component(s) are not approved: Button, Chip, ... Accept this by passing --allow-unapproved.
```

`--allow-unapproved` copies them anyway and prints one `[WARN]` line per component. `deprecated` components can never be copied, with or without the flag. `python tools/paper.py check <paper-id>` fails on a `deprecated` `reusable_pattern` and only warns for a `candidate` one. A copied candidate is still a candidate: copying is not approval.

## Three delivery layers

Do not blur these. A view that only works for one paper is not a reusable component because it happens to run in the same demo.

**1. Foundation / visual primitives — must be directly reusable**

- Typography, colour roles, spacing, surfaces, buttons, focus, overlays (`foundation/styles/kit.css`, `foundation/controls`, `foundation/overlay`).
- Diagram primitives: `DiagramNode` roles, connectors, arrowheads, port dots, labels, state badges, and the geometry in `foundation/layout/diagram.ts`.
- `DiagramFlow` (`foundation/layout/DiagramFlow.tsx`): declarative nodes in a grid with connectors measured from the real boxes. Stage names sit on a hairline above the columns instead of in another panel; each role carries form as well as colour (dashed outline and hatching for frozen, a left bar for trainable, a filled block for the one update target). Wide layouts draw the graph; narrow layouts reflow the same spec into an ordered list grouped under the same stage names, listing each node's inputs. It reflows instead of scaling, so in-figure text keeps its role size at every viewport. `template` overrides the equal-column grid when one stage needs more room than another.
- Math typography: formulas are MathML (`<math>`, `msub`, `munderover`, `mfrac`), laid out by the browser's math engine, so summation limits, fractions, and italic variables are real rather than styled text. Writing MathML in JSX needs `foundation/math/mathml-jsx.d.ts` in the program; a paper copies it beside its own `src` types. Inline symbols inside prose use `.rk-math` with `<var>`/`<sub>`.
- `TermRef` (Chinese quick preview) + `ReferenceHub` (English detail) sharing one canonical entry ID.

**2. Reusable compositions — approved only after cross-scene validation**

- `StepNav` (`compositions/step-nav`): synchronised step navigation whose grid wraps to as many rows as the width needs, so no step name is ever replaced by an ellipsis. It owns no state; the caller passes the current step. Validated against two different data samples (a five-step LwF mechanism and a four-item Component Lab sample with deliberately long Chinese and English labels), which is why it is a shared composition rather than a one-off.
- Branch and merge layouts are **recipes, not components**: `recipes/diagram-branch.md`, `recipes/diagram-merge.md`. They describe the structure a paper must satisfy on top of `DiagramFlow`. They stay recipes until two semantically unrelated papers use the same abstraction.

**3. Paper-specific teaching scenes — reuse the language, not the figure**

The LwF and EWC figures in `reusable-kit/demo/src/figures.tsx` are scene data for one paper each. A new paper writes its own figure specs with the same primitives. Reusing the visual language, the state cues, and the geometry is the goal; reusing the whole picture is not.

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

The demo holds the Foundation Component Lab and the two paper scenarios. `test:browser` runs the assertion page plus Chromium checks for typography/control states, overlay contracts, the LwF figure (label completeness, connector geometry, in-figure type size, title/figure ratio, per-step object and edge state, narrow-screen reflow, sidebar selection versus keyboard focus), and the TermRef → English Hub journey. It asserts the *properties* the design requires, not a particular DOM shape.

Visual QA runs from the repository root; the Kit demo config declares four viewports (1280, 1440, 1920, 390) and the selectors that must not clip:

```powershell
node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json
node tools/visual-qa/self-check.mjs
```

Build and browser success keep this work at `candidate`. `HUMAN_ACCEPTANCE` in the Visual QA report stays `PENDING` until the user reviews the captured screenshots.

## Still open

- Nobody has accepted either visual direction (`Warm Editorial`, `Clear Research`); the selector stays demo-local until one is chosen.
- No component has an approval record, so the scaffold gate currently blocks a fresh copy unless `--allow-unapproved` is passed.
- The LwF notation in `figures.tsx` is a mechanism sketch. The loss coefficients, temperature, and head structure have not been checked against the paper PDF and must be verified before any of it appears in a tutorial.
- `ResponsibilityMap` is still only reachable as a collapsed audit view in the LwF scene; its own visual quality has not been redesigned.
