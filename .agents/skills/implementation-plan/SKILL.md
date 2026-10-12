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

Read docs/TEACHING_DESIGN_STANDARD.md and docs/VISUAL_QA.md. Use the confirmed project W4/W5 design as input, not as a request to redesign it. In the existing implementation plan, record the text/visual/interaction task, key states and viewports, protected invariants, safe local adjustments, affected areas, and unresolved decisions. Keep design confirmation separate from rendered-page acceptance: list each confirmed page/state with its approved effect or screenshot reference, protected objects/scales/colors/connections/animations, allowed layout changes, and open choices. For substantial motion, identify key frames and object connections. Keep these notes outside the machine-readable implementation YAML.

1. For each spine stage, ask whether prose, a table, or a selected paper figure already explains it.
2. Visualize only relationships that are hard to understand in text: architecture, branching, data/state flow, lifecycle, training steps, ownership, dependencies, comparisons, or evidence.
3. Check the reusable pattern library first; record what is copied or adapted. Copy helpful source into the paper's own project. Do not add cross-paper runtime imports.
4. Fill the `implementation:` YAML block in `design/implementation-plan.md`; it is the sole machine-readable implementation plan. Use only Learning Spine stage IDs. Map each CORE item exactly once to one stage with one `primary_vehicle`, evidence refs, a page, reusable pattern (or null), and reason. Give each SUPPORTING item a compact placement, map each REFERENCE outside the mainline, and exclude DELETE.
5. Map each selected public asset once to a spine stage or `Reference Hub` and choose `original`, `crop`, `redraw`, or `overlay` rendering.
6. Define a first vertical slice of the opening/problem, core architecture, and primary runtime/algorithm flow (usually 2–3 spine stages). List the slice's stages and required CORE IDs in `vertical_slice`.
7. Do not maintain a general upstream chapter/module mapping table in the plan. If the approved design has a specific conflict with the target PaperSkill contract, record only that conflict and the decision needed in the existing plan. Keep the approved learning order intact; do not add quota-driven teaching content.
8. Build and present only this slice. A person judges learning, emphasis, spatial architecture, prose load, unnecessary detail, and whether interactivity adds value.
9. If the slice fails, revise the information architecture and repeat W6/W7. Do not proceed to the full tutorial until a human records PASS.

Run `python tools/paper.py stage <paper-id> W5 complete` after the plan and cross-references pass. W5 is an automatic gate; it does not need a reviewer field. The project scaffold already contains the upstream source entrypoints. Codex builds and checks the actual slice during W6, then performs the production build, Visual QA, and one direct official source validation during W8. W7 alone records human acceptance with `--reviewed-by` and `--note`.

## Forbidden Actions

- Do not implement all pages before the slice review.
- Do not use interaction, chapter, analogy, animation, or Canvas quotas.
- Do not hide mainline reasoning in hover.
- Do not turn a scalar setting into a large interaction without a learning reason.
- Do not mark W7 complete without a human review.
- Do not change the configured publish source after W5 without checking that the real source still represents the approved design.
- Do not add chapters, modules, or fake registry entries just to meet a quota; unresolved design/contract conflicts must be raised before W6.

## Completion Criteria

The plan validates against the Learning Spine and Evidence Registry, covers every priority once, records the upstream source/runtime/data mapping, slice boundary, and asset rendering decisions, and contains the human W7 decision before W8 begins.
