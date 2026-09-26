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

1. Confirm W0–W5 are complete. W2 and W4 must have human review records; W0, W1, W3, and W5 are automatic after their checks pass.
2. Implement only the slice named in the plan: the problem/opening, core architecture, and one primary end-to-end mechanism (normally 2–3 spine stages).
3. Update `implementation-manifest.json` for each implemented slice CORE item with its planned stage, component, and `status: complete`.
4. Preserve source/evidence boundaries and clearly label teaching examples.
5. Stop when the slice is usable. Do not fill out the remaining spine yet.

W6 completes automatically when every `vertical_slice.required_core_items` entry is complete in the manifest and the project entry checks pass. No reviewer fields are used for W6.

## W7: Human Learning Review

Present the slice for a person to judge the learning path, architecture, flow, emphasis, prose load, necessary math, and the value of each interaction. Record the decision and required edits in `design/implementation-plan.md`. Complete W7 with `--reviewed-by` and `--note` only after a person records PASS. If the decision is REVISE, return to the spine/plan and repeat W6/W7.

## W8: Full Implementation

1. Implement all remaining CORE content on the accepted spine.
2. Keep SUPPORTING content compact; put REFERENCE material in the Reference Hub/advanced area; omit DELETE.
3. Copy any reusable source into this paper's project. Do not import a cross-paper runtime package.
4. Keep paper data separate from teaching toys. Use real calculations for simulations and explain simplifications.
5. Support keyboard/focus, reduced motion, mobile, touch, and non-drag operation where applicable.
6. Run declared project build/audit commands when the user requests verification; report their actual outcomes.

Update the implementation manifest for every CORE item and for each SUPPORTING/REFERENCE placement. W8 completes automatically only when every planned CORE is complete, lower-priority placements match the plan, and selected asset derivatives/web copies plus README provenance exist.

## Forbidden Actions

- Do not generate the complete site before the human learning review.
- Do not add controls, animation, or formula labs to satisfy a quota.
- Do not continue after a failed W7 review.
- Do not mark W7 complete without human approval. W6/W8 are automatic stages and complete only after their structural coverage checks pass.

## Completion Criteria

The tutorial follows the accepted spine, its learning and evidence boundaries are preserved, and human W7 acceptance is recorded before W8 completion.
