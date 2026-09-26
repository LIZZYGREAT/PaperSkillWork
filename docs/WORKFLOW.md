# PaperSkillWork Macro Workflow v3

The workflow creates a tutorial that helps a reader understand what a paper does and why. Its governing order is:

> Establish the paper's main line before choosing visuals; establish information priority before interaction; implement only after both are clear.

The W stages describe the production process, not a fixed chapter outline. Only W6 starts tutorial-page coding. Human semantic review is required at W2, W4, W7, and W9. W0, W1, W3, W5, W6, W8, and W10 complete automatically after their structural checks pass. Structural checks never certify learning quality.

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

| Stage | Question and work | Completion rule |
| --- | --- | --- |
| W0 | What exact paper and source are we working from? Record title, authors, venue/year, source type and location, URL where available, and source hash when possible. Do not design chapters, metaphors, or animation. | Automatic after required source metadata is present in `paper.yaml`. |
| W1 | Can later work use one stable, complete read and a useful asset inventory? Read/extract the complete source once; cache its content, locators, and visual inventory. Correct a failed cache as a whole. | Automatic after cache files, manifest metadata, and figure inventory validate. |
| W2 | What is the paper actually doing? Build a source-grounded paper model of the problem, insight, objects, architecture, flow, state/time, training/runtime, results, and limits. No web design here. | **Human review:** confirm the model explains the source correctly. |
| W3 | Which explanations are safe to publish, and which source visuals help? Build claim-level evidence and decide use/omit for every visual. Record source, locator, processing plan, and reuse rights. Do not generate derivatives yet. | Automatic when structure and references validate. Stop for unresolved source/evidence conflicts, unsafe claim wording, or unclear rights. |
| W4 | What single causal/runtime path should the reader follow, and what can be omitted? Assign every candidate item `CORE`, `SUPPORTING`, `REFERENCE`, or `DELETE`. | **Human review:** confirm the main line and information priorities. |
| W5 | Where would text alone hide a relationship? Plan only useful visuals/interactions, their evidence, reusable patterns, assets, and the vertical slice. | Automatic after the machine-readable implementation plan covers all priority items and validates. No page code yet. |
| W6 | Does the proposed explanation work in a real slice? Implement the selected first 2–3 spine stages. | Automatic after every `vertical_slice.required_core_items` entry is complete in `web/enhanced/implementation-manifest.json`. |
| W7 | After seeing the slice, can a first-time reader explain the paper more accurately? Review main-line clarity, emphasis, architecture, flow, prose load, and whether interaction helps. | **Human review:** record PASS/REVISE and rationale. Revise and repeat W6/W7 on failure. |
| W8 | Can the accepted teaching model be completed consistently? Implement all CORE; place SUPPORTING compactly; keep REFERENCE outside the mainline; omit DELETE. | Automatic after the manifest covers the full plan and selected asset derivatives/web copies/provenance are present. |
| W9 | Can learners reconstruct the method, and can every important claim be traced? Audit outcomes, evidence, engineering checks, accessibility, mobile behavior, and teaching-example boundaries. | **Human review:** record the learning/evidence verdict and actual engineering outcomes in `audit/final-check.md`. |
| W10 | Can the tutorial be imported and validated as an independent upstream project? Run the official import, validation, build, and preflight. | Automatic only when the exported project passes and `audit/upstream-preflight.json` records the current commit and successful exit codes. |

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

For each asset selected for teaching, W3 records source paper/version, figure/table and page, source locator/path, original caption, teaching role, processing plan, evidence links, attribution, and approved reuse-rights basis. The original must exist in `source-cache/figures/`; a derivative is not required at W3. W5 adds a machine-readable asset mapping to `design/implementation-plan.md`, assigning each selected public asset to a Learning Spine stage or Reference Hub and choosing `original`, `crop`, `redraw`, or `overlay`. W6/W8 create the derivative in `assets/figures/web/` and its web copy; W8/W10 validate those files, the export copy, and README provenance. Explain why a high-value candidate is not used. An accessible paper PDF does not by itself grant image reuse rights.

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

Ask first whether prose, a table, or a paper figure is enough. Visualize when spatial or temporal relations are genuinely hard to follow in text. Do not make a scalar setting into a large lab merely because it can have a slider. Each CORE item appears in one implementation stage with one `primary_vehicle`; use references for depth.

The fenced YAML under `implementation:` in `design/implementation-plan.md` is the only machine-readable plan. It maps every CORE exactly once, gives every SUPPORTING item a compact placement, maps every REFERENCE outside the mainline, and excludes DELETE. Evidence references must resolve; stage IDs must exist in the Learning Spine. `vertical_slice.stages` and `required_core_items` define the W6 coverage check. Selected assets also need a stage and rendering choice.

Use the reusable pattern library where it fits: Architecture Explorer, Flow Stepper, Branch Highlighter, Before/After Comparator, Timeline, Evidence Viewer, Term Hover, Reference Hub, Expandable Detail, or Result Protocol Card. Copy or adapt selected source into `web/enhanced/src/` so each export is self-contained; do not use cross-paper runtime imports.

Reference Hub and term hover are recommended infrastructure. A hover answers what a term is, what it does in this paper, and what it is easy to confuse with. Mainline-critical reasoning stays visible in the main path.

## W6–W9 implementation and review

W6 is the first tutorial-page code. Start with a thin vertical slice instead of all pages. Record implementation coverage in `web/enhanced/implementation-manifest.json`: each implemented CORE names its planned stage, component, and status. W6 completes only when the slice's required CORE items are `complete`. W7 is a learning review, not a button/animation review. If the reviewer cannot explain the problem, central mechanism, architecture, and one full flow after the slice, fix the teaching design before writing the rest.

After W7 passes, complete W8. W8 requires all planned CORE items to be `complete`, all SUPPORTING/REFERENCE placements to match the plan, and DELETE items to remain omitted. The final audit checks that a reader can state the problem and idea, reconstruct architecture and flow, explain training/inference where applicable, explain design reasons, summarize key results, and identify limitations. Separately trace claims to source evidence and ensure teaching examples are visibly distinct. Record actual build/a11y/mobile outcomes; never infer them.

## W10: pedagogical contract vs upstream compatibility contract

These contracts are separate:

- **Pedagogical design contract:** no fixed chapter count, interaction-pattern quota, universal analogy, animation in every chapter, or required Canvas. Add only what helps learning.
- **Upstream compatibility contract (as described by the supplied requirements for the current public validator):** the export has 6–10 chapters, at least 4 active modules, and at least one chapter with 2 modules, as well as the required project entry files and official validator requirements. These are export constraints, not internal teaching goals. Meet them with meaningful, organically grouped content; never invent toys solely for the numbers.

Export chapters are a packaging/grouping of the approved learning spine. Their boundaries do not dictate how many conceptual stages the paper needs.

Set `release.upstream_paper_name`, `release.upstream_version`, and `release.output` separately from the internal `paper_id`. `release.output` must be exactly `html_output/<upstream_paper_name>/<upstream_version>`. The generated tutorial starts with these release identifiers blank; fill them with the intended upstream directory names before W10.

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

It must build independently, use relative asset paths, include image provenance in `README.md`, include no paper PDF, require no portal or upstream script change, and need no external shared package. Update a clean local PaperSkill checkout to the intended upstream commit, then run:

```powershell
python tools/paper.py upstream-check <paper-id> `
  --paperskill-repo C:\path\to\PaperSkill `
  --participant "Public name" [--pinyin "romanized-name"] [--github "username"]
```

The command records the checkout commit and runs `npm run import`, `npm run validate`, `npm run build:paper`, and `npm run preflight` in an isolated temporary checkout. It does not write to the supplied PaperSkill checkout. On success, it copies the imported output to the configured `release.output` and writes `audit/upstream-preflight.json`; if that output already exists, pass `--replace-output` to replace the generated export. W10 reads this JSON report, not a manually entered Markdown marker. Tutorial PR scope is only `html_output/<paper-name>/<version>/`; any future workflow/skill contribution is a separate PR. Public automation behavior may be only partly visible, and maintainers make the final merge/publication decision. CI success does not guarantee a merge.

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

New workspaces use schema/workflow v3. `tools/paper.py` validates metadata, cache files, evidence/asset plans, implementation coverage, paths, and export structure. W2/W4/W7/W9 require `--reviewed-by` and `--note`; W0/W1/W3/W5/W6/W8/W10 record `completed_by: automation` after checks pass. The tool does not decide whether a lesson is good. Existing schema v1/v2 workspaces remain readable and are not automatically migrated.

Existing schema v1/v2 paper workspaces remain readable using their existing checks. Do not bulk migrate or rewrite those tutorials during this macro-workflow update. v1 templates under `templates/legacy/` and v2 scaffold templates exist only for explicit legacy migration, not for new paper work.
