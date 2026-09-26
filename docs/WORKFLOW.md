# PaperSkillWork Macro Workflow v3

The workflow creates a tutorial that helps a reader understand what a paper does and why. Its governing order is:

> Establish the paper's main line before choosing visuals; establish information priority before interaction; implement only after both are clear.

The W stages describe the production process, not a fixed chapter outline. Only W6 starts tutorial-page coding. A human must review each stage before its status is marked complete. Structural checks never certify learning quality.

## W0–W10 at a glance

```text
W0 Source Intake
 ↓
W1 Source Cache + Asset Inventory
 ↓
W2 Paper Understanding Model
 ↓
W3 Evidence + Asset Curation
 ↓
W4 Learning Spine + Information Priority
 ↓
W5 Visual / Interaction Planning
 ↓
W6 First Vertical Slice
 ↓
W7 Human Learning Review
 ↓
W8 Full Implementation
 ↓
W9 Learning + Evidence Audit
 ↓
W10 Upstream Packaging & Preflight
```

| Stage | Question and work | Exit artifact / human gate |
| --- | --- | --- |
| W0 | What exact paper and source are we working from? Record title, authors, venue/year, source type and location, URL where available, and source hash when possible. Accept PDF, LaTeX, paper text, arXiv/official links, or another user-approved reliable source. Do not design chapters, metaphors, or animation. | Metadata in `paper.yaml` and `source/paper.url`; source identity is confirmed. |
| W1 | Can later work use one stable, complete read and a useful asset inventory? Read/extract the complete source once; cache its content, locators, and visual inventory. Classify each figure/table and note candidate teaching role. Correct a failed cache as a whole rather than adding endless partial extracts. | `source-cache/content.md`, `manifest.json`, `evidence.json`, and `figures/`; a person confirms cache coverage. |
| W2 | What is the paper actually doing? Build a paper model with the one-paragraph core explanation, problem, insight, prerequisites, objects/variables, architecture and ownership, data flow, state/time, training, inference, core equations, results, and limitations. For non-ML/system papers, adapt the flow to their actual runtime. No web design here. | `research/paper-model.md`; a person can state the problem, central mechanism, and why it may work. |
| W3 | Which explanations are safe to publish, and which source visuals help? Build a claim-level evidence registry with locators, type, conditions, and allowed wording. Evaluate and select assets from W1; stage chosen originals separately from derivatives and document reuse rights. Do not publish assets with unclear rights. | `research/evidence-registry.yaml` and `design/asset-plan.md`; all important claims and chosen assets resolve. |
| W4 | What single causal/runtime path should the reader follow, and what can be omitted? Compress the paper model into a coherent primary learning spine, usually 5–8 logical stages. Assign every candidate item `CORE`, `SUPPORTING`, `REFERENCE`, or `DELETE`. | `design/learning-spine.md`; a person confirms every CORE item has a mainline stage and lower-priority material stays proportionate. |
| W5 | Where would text alone hide a relationship? Plan only visuals and interactions that clarify architecture, branching, data flow, state, training, ownership, dependencies, or evidence. Check the reusable pattern library first and record what is copied/adapted. | `design/implementation-plan.md`; planned teaching purpose and evidence are explicit. No page code yet. |
| W6 | Does the proposed explanation work in a real slice? Implement only the opening/problem, core architecture, and most important end-to-end mechanism (or the paper's most informative 2–3 spine stages). | A running first vertical slice plus findings recorded in `design/implementation-plan.md`. |
| W7 | After seeing the slice, can a first-time reader explain the paper more accurately? Review main-line clarity, emphasis, architecture, flow, prose load, unnecessary math/toys, and whether the interaction helps. A visual polish review alone does not pass. | Human decision and rationale recorded in `design/implementation-plan.md`. If it fails, revise the information architecture and repeat W6/W7; do not expand the tutorial. |
| W8 | Can the accepted teaching model be completed consistently? Implement remaining CORE content; put SUPPORTING in compact form; place REFERENCE in the Hub/advanced area; omit DELETE. | Complete tutorial implementation. Preserve the approved learning spine and evidence boundaries. |
| W9 | Can learners reconstruct the method, and can every important claim be traced? Audit learning outcomes and evidence, including facts, equations, numbers, architecture, protocol, datasets, limitations, and teaching-example boundaries. | `audit/final-check.md`; a person records the learning and evidence verdict and actual engineering outcomes. |
| W10 | Can the tutorial be imported and validated as an independent upstream project? Export, check the exact upstream-required structure and asset provenance, then run the current official upstream validation/preflight. | `html_output/<paper-name>/<version>/` plus W10 results in `audit/final-check.md`. A green local check is not a merge promise. |

## W1 source cache and visual inventory

Use this structure:

```text
source-cache/
├── content.md
├── manifest.json
├── evidence.json
└── figures/
```

`content.md` contains the complete extracted or transcribed paper text, organized with section/page/equation locators. `manifest.json` records source metadata, hash when available, extraction details, and every source figure/table. Each figure entry has `id`, `locator`, `caption`, optional `image_path`, `type`, and `candidate_role`. `evidence.json` stores source-located notes needed to build the evidence registry. Cache data is an internal planning source, not automatically public tutorial content.

Classify source visuals as `ARCHITECTURE`, `PIPELINE`, `ALGORITHM`, `MECHANISM`, `RESULT`, `ABLATION`, `DATASET_EXAMPLE`, `QUALITATIVE_RESULT`, or `LOW_VALUE`. The inventory must include all source visuals, including items later excluded.

## W2 model and W3 evidence

The Paper Model answers only “what is this paper doing?” It must first explain in a short paragraph what problem existed, what the authors changed, and why that change could help. For non-trivial systems, record components, ownership, connections/branches, inputs, outputs, and shared/task-specific parts before writing an interface plan. Trace one end-to-end data, state, or request flow. For training papers include inputs, outputs, supervision, losses, backward/control signals, and updates when applicable.

The Evidence Registry answers “what may we safely say?” Each important claim records its evidence ID, claim, source locator, type, conditions, and allowed wording. Types include `PAPER_FACT`, `PAPER_RESULT`, `AUTHOR_INTERPRETATION`, `OUR_INTERPRETATION`, `IMPLEMENTATION_MAPPING`, `GENERAL_BACKGROUND`, and `TEACHING_EXAMPLE`. Tie numerical results to their dataset, model, split, metric, and protocol.

For each asset selected for teaching, record source paper/version, figure/table and page, original caption, processing (`direct`, `crop`, or `redraw`), evidence links, attribution, and reuse-rights status. Preserve originals separately from web-ready derivatives. Explain why a high-value candidate is not used. An accessible paper PDF does not by itself grant image reuse rights.

## W4 priority and primary learning spine

The spine is a causal/runtime learning path, not a paper table of contents or fixed chapter count. A common shape is:

```text
problem → why prior approaches are insufficient → core idea → architecture
→ information/state flow → training/inference → evidence → limits
```

Adapt it to the paper and keep one continuous path. In the priority matrix:

- `CORE` must be assigned to a mainline spine stage.
- `SUPPORTING` gets a compact inline explanation, brief interaction, hover, or expandable detail.
- `REFERENCE` stays in a Reference Hub, hover, implementation note, or advanced details; it does not occupy a mainline scene.
- `DELETE` is omitted, even if factually correct.

Do not duplicate a core explanation just to fill chapters. The checker can catch repeated item IDs; a person must judge semantic repetition.

## W5 interaction planning

Ask first whether prose, a table, or a paper figure is enough. Visualize when spatial or temporal relations are genuinely hard to follow in text. Do not make a scalar setting into a large lab merely because it can have a slider. Each concept should have at most one primary explanatory vehicle; use references for depth.

Use the reusable pattern library where it fits: Architecture Explorer, Flow Stepper, Branch Highlighter, Before/After Comparator, Timeline, Evidence Viewer, Term Hover, Reference Hub, Expandable Detail, or Result Protocol Card. Copy or adapt selected source into `web/enhanced/src/` so each export is self-contained; do not use cross-paper runtime imports.

Reference Hub and term hover are recommended infrastructure. A hover answers what a term is, what it does in this paper, and what it is easy to confuse with. Mainline-critical reasoning stays visible in the main path.

## W6–W9 implementation and review

W6 is the first tutorial-page code. Start with a thin vertical slice instead of all pages. W7 is a learning review, not a button/animation review. If the reviewer cannot explain the problem, central mechanism, architecture, and one full flow after the slice, fix the teaching design before writing the rest.

After W7 passes, complete W8. The final audit checks that a reader can state the problem and idea, reconstruct architecture and flow, explain training/inference where applicable, explain design reasons, summarize key results, and identify limitations. Separately trace claims to source evidence and ensure teaching examples are visibly distinct. Record actual build/a11y/mobile outcomes; never infer them.

## W10: pedagogical contract vs upstream compatibility contract

These contracts are separate:

- **Pedagogical design contract:** no fixed chapter count, interaction-pattern quota, universal analogy, animation in every chapter, or required Canvas. Add only what helps learning.
- **Upstream compatibility contract (as described by the supplied requirements for the current public validator):** the export has 6–10 chapters, at least 4 active modules, and at least one chapter with 2 modules, as well as the required project entry files and official validator requirements. These are export constraints, not internal teaching goals. Meet them with meaningful, organically grouped content; never invent toys solely for the numbers.

Export chapters are a packaging/grouping of the approved learning spine. Their boundaries do not dictate how many conceptual stages the paper needs.

The exported project must include at least:

```text
paper.json
README.md
package.json
package-lock.json
index.html
vite.config.ts
tsconfig.json
src/App.tsx
src/data/tutorial.ts
src/modules/registry.tsx
src/styles/paper.css
```

It must build independently, use relative asset paths, include image provenance in `README.md`, include no paper PDF, require no portal or upstream script change, and need no external shared package. Run the official latest-upstream validation/preflight before submission. Tutorial PR scope is only `html_output/<paper-name>/<version>/`; any future workflow/skill contribution is a separate PR. Public automation behavior may be only partly visible, and maintainers make the final merge/publication decision. CI success does not guarantee a merge.

## Design documents and workspace

Keep one canonical document for each design decision; do not create redundant prose files:

```text
research/
├── paper-model.md
└── evidence-registry.yaml
design/
├── learning-spine.md
├── asset-plan.md
└── implementation-plan.md
audit/
└── final-check.md
```

```text
papers/<paper-id>/
├── paper.yaml
├── source/paper.url
├── source-cache/
├── research/
├── design/
├── audit/
├── assets/figures/{original,web}/
└── web/enhanced/
```

```text
html_output/<paper-name>/<version>/
```

Terms and reference content belong in the app's knowledge/reference data when needed; create no separate design documents just to restate the same content.

## Tool behavior and older workspaces

New workspaces use schema/workflow v3. `tools/paper.py` validates metadata, cache files, references, asset paths, priority assignments, and export structure. It never decides whether a lesson is good and never marks a stage complete automatically. A reviewer name and note are required to mark a stage complete.

Existing schema v1/v2 paper workspaces remain readable using their existing checks. Do not bulk migrate or rewrite those tutorials during this macro-workflow update. v1 templates under `templates/legacy/` and v2 scaffold templates exist only for explicit legacy migration, not for new paper work.
