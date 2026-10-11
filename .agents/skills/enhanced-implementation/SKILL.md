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

1. Confirm W0–W5 are complete. W2 and W4 must have human review records; W0, W1, W3, and W5 are automatic after their checks pass. Read the approved `Upstream Release Compatibility` mapping in the implementation plan.
2. Create the configured release source with the upstream-required files and directories from the first runnable project. Preserve the planned template-driven or custom React runtime; do not create a second runtime or empty compatibility stubs.
3. Implement only the slice named in the plan: the problem/opening, core architecture, and one primary end-to-end mechanism (normally 2–3 spine stages). Put real metadata for implemented content in `src/data/tutorial.ts`; unimplemented chapters may be planned but are not completed content. Register a `componentId` only when it maps to the actual component.
4. Update `implementation-manifest.json` for each implemented slice CORE item with its planned stage, component, and `status: complete`.
5. Preserve source/evidence boundaries and clearly label teaching examples.
6. Run the early source check on the actual configured publish source:

   ```powershell
   python tools/paper.py upstream-source-check <paper-id> --paperskill-repo <clean-PaperSkill-checkout> --level structure
   ```

   `structure` checks the required entry files, lockfile, basic content metadata, and independence, then runs `npm ci` and `npm run build` on that source. It does not enforce the full chapter/module thresholds and must print `FULL_UPSTREAM_VALIDATION NOT_RUN (pending W8)`. Save the result to `audit/upstream-source-check.json`; the W6 completion gate requires a passing report whose source path and fingerprint still match.
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
6. Run declared project build/audit commands when the user requests verification; report their actual outcomes.

Update the implementation manifest for every CORE item and for each SUPPORTING/REFERENCE placement. Then run the full source check against the same actual publish source:

```powershell
python tools/paper.py upstream-source-check <paper-id> --paperskill-repo <clean-PaperSkill-checkout> --level full
```

`full` runs `npm ci`, `npm run build`, and the supplied checkout's official `paper-skill/scripts/validate-output.js <absolute-publish-source>`. Require exit code 0 and the official `RESULT: PASS`; the live script and its adjacent `paper-skill/contract.md` are authoritative. The report binds the result to the PaperSkill commit, validator/contract hashes, actual publish-source path, and source fingerprint. Any meaningful source change makes the report stale. Do not substitute a local imitation, alternate source folder, stale report, or W6 `structure` result. If Node/npm, the clean upstream checkout, or its validator are missing, leave W8 blocked and record the failure.

W8 completes automatically only when every planned CORE is complete, lower-priority placements match the plan, selected asset derivatives/web copies plus README provenance exist, and the current full source-check evidence matches the actual release source.

## Forbidden Actions

- Do not generate the complete site before the human learning review.
- Do not add controls, animation, or formula labs to satisfy a quota.
- Do not continue after a failed W7 review.
- Do not mark W7 complete without human approval. W6/W8 are automatic stages and complete only after their structural coverage checks pass.
- Do not satisfy the official validator with empty files, placeholder chapters, unrelated modules, or fake registrations.
- Do not mark full upstream validation as passed based on a structure check, build, Visual QA, or a hand-authored report.

## Completion Criteria

The tutorial follows the accepted spine, its learning and evidence boundaries are preserved, and human W7 acceptance is recorded before W8 completion.
