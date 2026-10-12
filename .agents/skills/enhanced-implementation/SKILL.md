---
name: enhanced-implementation
description: Build an accepted first vertical slice, pause for a human learning review, then finish the tutorial under Workflow v3 stages W6–W8.
---

# Tutorial Implementation — W6 to W8

## Purpose

Implement the reviewed learning spine as an inspectable mental model. Optimize for understanding and traceable evidence, not interaction count.

## Required Inputs

- `research/paper-model.md`
- `research/evidence-registry.yaml`
- `design/learning-spine.md`
- `design/asset-plan.md`
- `design/implementation-plan.md`
- `web/enhanced/implementation-manifest.json`
- The existing paper project, when iterating

## W6: First Vertical Slice

For rendered UI, follow docs/VISUAL_QA.md. Capture and inspect actual Chromium screenshots at the planned states and viewports; check geometry, visual balance, and any protected design baseline. Do not mark a check PASS if its screenshot or browser state was not inspected; record NOT_RUN with the reason.

1. Confirm W0–W5 are complete. W2 and W4 must have human review records; W0, W1, W3, and W5 are automatic after their checks pass.
2. Use the configured release source, whose initial project scaffold already contains the required React/Vite entrypoints, styles, tutorial data module, registry, and lockfile. Preserve the custom React runtime; do not create a second runtime or empty compatibility stubs.
3. Implement only the slice named in the plan: the problem/opening, core architecture, and one primary end-to-end mechanism (normally 2–3 spine stages). Put real metadata for implemented content in `src/data/tutorial.ts`; unimplemented chapters may be planned but are not completed content. Register a `componentId` only when it maps to the actual component.
4. Update `implementation-manifest.json` for each implemented slice CORE item with its planned stage, component, and `status: complete`.
5. Preserve source/evidence boundaries and clearly label teaching examples.
6. Install dependencies, build the slice, and perform the minimal browser check on the actual configured source. Do not run or save a separate structure report; the scaffold supplies the standard source paths, and the slice contains only real implemented teaching content.
7. Stop when the slice is usable. Do not implement or count the remaining spine yet.

W6 completes automatically when every `vertical_slice.required_core_items` entry is complete in the manifest and the current release source passes `structure`, dependency installation, and build checks. No reviewer fields are used for W6.

## W7: Human Learning Review

Present the slice for a person to judge the learning path, architecture, flow, emphasis, prose load, necessary math, and the value of each interaction. Record the decision and required edits in `design/implementation-plan.md`. Complete W7 with `--reviewed-by` and `--note` only after a person records PASS. If the decision is REVISE, return to the spine/plan and repeat W6/W7.

## W8: Full Implementation

After each page or complete interaction, inspect its relevant states. When a shared style or component changes, expand regression to affected pages and overlays. Preserve confirmed design invariants; pause for the user's decision if implementation would change an approved semantic or structural choice.

Before editing, read `AGENTS.md`, `docs/WORKFLOW.md`, `docs/TEACHING_DESIGN_STANDARD.md`, `docs/VISUAL_QA.md`, and the project's `design/implementation-plan.md`. State the invariants and allowed local changes that will be protected. Fix ordinary layout defects within that scope; ask for a decision before changing approved diagram meaning, state order, primary workspace layout, or main animation.

1. Implement all remaining CORE content on the accepted spine.
2. Keep SUPPORTING content compact; put REFERENCE material in the Reference Hub/advanced area; omit DELETE.
3. Copy any reusable source into this paper's project. Do not import a cross-paper runtime package.
4. Keep paper data separate from teaching toys. Use real calculations for simulations and explain simplifications.
5. Support keyboard/focus, reduced motion, mobile, touch, and non-drag operation where applicable.
6. Run project tests, the production build, and declared project audits when verification is requested; report their actual outcomes. Check implementation coverage and perform Visual QA against the actual publish source. W8 does not require a PaperSkill checkout or official upstream validator; the official contract is covered by the user's W10 preflight after W9 acceptance.

Update the implementation manifest for every CORE item and for each SUPPORTING/REFERENCE placement. W8 completes automatically only when every planned CORE is complete, lower-priority placements match the plan, selected asset derivatives/web copies plus README provenance exist, project tests and the actual source build pass, and Visual QA is complete. The user runs the sole official upstream validation flow as W10 after accepting W9; do not require an upstream checkout during W8.

## Forbidden Actions

- Do not generate the complete site before the human learning review.
- Do not add controls, animation, or formula labs to satisfy a quota.
- Do not continue after a failed W7 review.
- Do not mark W7 complete without human approval. W6/W8 are automatic stages and complete only after their structural coverage checks pass.
- Do not satisfy structural coverage with empty files, placeholder chapters, unrelated modules, or fake registrations.
- Do not describe a build or Visual QA result as an official upstream validation result.

## Completion Criteria

The tutorial follows the accepted spine, its learning and evidence boundaries are preserved, and human W7 acceptance is recorded before W8 completion.
