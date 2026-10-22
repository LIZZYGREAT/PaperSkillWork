---
name: implementation-plan
description: Plan visual and interaction choices after the learning spine, then define the first vertical slice and human learning review.
---

# Implementation Plan — W5 to W7

## Purpose

Translate the reviewed spine into the smallest useful visual plan, then expose the teaching direction to a human before full implementation.

## Required Inputs

- `research/paper-model.md`
- `research/evidence-registry.yaml`
- `design/learning-spine.md`
- `design/asset-plan.md`
- `templates/implementation-plan.md`

## Procedure

Use the confirmed project W4 design and W2 Algorithm Execution Model as inputs, not as requests to redesign their learning order or real algorithm. W5 decides whether each teaching task is expressed through prose, graphics, formulas, pseudocode, interaction, animation, or a whole-system scene. Read the relevant sections of `docs/TEACHING_DESIGN_STANDARD.md`; use `docs/VISUAL_QA.md` to choose observable states and viewports. In the existing implementation plan, record the text/visual/interaction task, key states, protected invariants, safe local adjustments, shared/adjacent areas that may be affected, and unresolved decisions. Keep confirmed design separate from rendered-page acceptance and keep these notes outside the machine-readable YAML. Read a Reusable Kit recipe or a historical UI case only when the current design problem matches it; do not load every recipe or the full history file by default.

1. For each spine stage, ask whether prose, a table, or a selected paper figure already explains it.
2. Visualize only relationships that are hard to understand in text: architecture, branching, data/state flow, lifecycle, training steps, ownership, dependencies, comparisons, or evidence.
3. Choose the teaching expression from the current learning task. When an existing pattern may help, search the Kit registry and read the matching recipe; record what is copied or adapted. Copy helpful source into the paper's own project. Do not add cross-paper runtime imports or select a pattern just to fill a field.
4. For each algorithmically critical scene, record its teaching purpose, reader prerequisites, algorithm relation and conclusion; fixed inputs, persistent/temporary state, outputs, lifecycle, object identities, and provenance; and the semantics/calculations/order/approved visual relations that local implementation changes must protect. Ordinary prose pages do not need a frame table.
5. For the complete-algorithm integration stage, derive a global execution model from W2 before designing shots or motion. Compare compositions based on the paper's needs, then redesign the overall hierarchy, transitions, narrative focus, and state visibility for whole-system understanding. Reusing calculations or atomic assets is allowed; concatenating prior page components is not a complete integration design.
6. For only the meaningful or risky moments in a complex scene, record a compact semantic-frame contract: W2 operation and timing, entering state, real computation/trigger, leaving state, graphic action, aligned text/formula, protected identities/ownership/coordinates/results/update timing/connections, and reproducible verification. Do not impose a standard frame count, duration, or layout.
7. Fill the `implementation:` YAML block in `design/implementation-plan.md`; it is the sole machine-readable implementation plan. Use only Learning Spine stage IDs. Map each CORE item exactly once to one stage with one `primary_vehicle`, evidence refs, a page, reusable pattern (or null), and reason. Give each SUPPORTING item a compact placement, map each REFERENCE outside the mainline, and exclude DELETE.
8. Map each selected public asset once to a spine stage or `Reference Hub` and choose `original`, `crop`, `redraw`, or `overlay` rendering.
9. Define a first vertical slice that forms a real cognitive loop: the reader perceives a problem, sees why a mechanism is introduced, follows a key operation, observes a conclusion, and can continue naturally. It is usually 2–3 spine stages but may vary with the content. List its stages and required CORE IDs in `vertical_slice`.
10. Do not maintain a general upstream chapter/module mapping table in the plan. If the approved design has a specific conflict with the target PaperSkill contract, record only that conflict and the decision needed in the existing plan. Keep the approved learning order intact; do not add quota-driven teaching content.
11. Build and present only this slice. At W7 a person separately judges why the mechanism is needed, whether its key operation is accurate, whether prose and graphics work together, and whether the handoff is natural. W7 does not require the final integration scene to be complete.
12. If the slice fails, revise the information architecture and repeat W6/W7. Do not proceed to the full tutorial until a human records PASS.

Run `python tools/paper.py stage <paper-id> W5 complete` after the plan and cross-references pass. W5 is an automatic gate; it does not need a reviewer field. The project scaffold already contains the upstream source entrypoints. Codex builds and checks the actual slice during W6, then performs implementation coverage checks, project tests, production build, and Visual QA during W8. The user triggers official upstream validation as W10 after W9 acceptance; do not require an upstream checkout or official validator during W8. W7 alone records human acceptance with `--reviewed-by` and `--note`.

## Forbidden Actions

- Do not implement all pages before the slice review.
- Do not use interaction, chapter, analogy, animation, or Canvas quotas.
- Do not hide mainline reasoning in hover.
- Do not treat visual or implementation simplicity as a reason to remove objects, transitions, calculations, or explanations required for semantic accuracy. Complexity is acceptable when the learning task requires it.
- Do not turn a scalar setting into a large interaction without a learning reason.
- Do not mark W7 complete without a human review.
- Do not change the configured publish source after W5 without checking that the real source still represents the approved design.
- Do not add chapters, modules, or fake registry entries just to meet a quota; unresolved design/contract conflicts must be raised before W6.

## Completion Criteria

The plan validates against the Learning Spine and Evidence Registry, covers every priority once, records the upstream source/runtime/data mapping, slice boundary, and asset rendering decisions, and contains the human W7 decision before W8 begins.
