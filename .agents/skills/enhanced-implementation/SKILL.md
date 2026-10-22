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

For rendered UI, follow `docs/VISUAL_QA.md`. Capture and inspect actual Chromium screenshots at the planned states and viewports; check geometry, visual balance, and any protected design baseline. For multi-step animation, inspect meaningful intermediate states as well as the final state. Do not mark a check PASS if its screenshot or browser state was not inspected; record NOT_RUN with the reason. Search `docs/ui-teaching-lessons.md` by matching symptom only when a historical case may help; do not read the entire case file by default.

Before W6 edits, use the accepted W5 plan to identify the slice, approved design invariants, allowed local changes, and shared areas that may be affected. Do not treat the first-slice implementation as permission to redesign unreviewed stages.

1. Confirm W0–W5 are complete. W2 and W4 must have human review records; W0, W1, W3, and W5 are automatic after their checks pass.
2. Use the configured release source, whose initial project scaffold already contains the required React/Vite entrypoints, styles, tutorial data module, registry, and lockfile. Preserve the custom React runtime; do not create a second runtime or empty compatibility stubs.
3. Implement only the slice named in the plan: a learner must be able to experience the planned problem → needed mechanism → key operation → conclusion → next-question loop (normally 2–3 spine stages, but use the reviewed scope). Put real metadata for implemented content in `src/data/tutorial.ts`; unimplemented chapters may be planned but are not completed content. Register a `componentId` only when it maps to the actual component.
4. Update `implementation-manifest.json` for each implemented slice CORE item with its planned stage, component, and `status: complete`.
5. Distinguish paper facts, real experimental data, synthetic teaching data, and implementation mappings. Where a reader could mistake an example for paper data, or a simplification changes their understanding of the paper's computation or applicability, add a concise note beside that material. Obvious demonstrations that cannot reasonably be confused need no repeated disclaimer; never invent results or weaken evidence boundaries.
6. Install dependencies, build the slice, and perform the minimal browser check on the actual configured source. Do not run or save a separate structure report; the scaffold supplies the standard source paths, and the slice contains only real implemented teaching content.
7. Stop when the slice is usable. Do not implement or count the remaining spine yet.

The W6 CLI gate checks the configured release source's required entrypoints and that every `vertical_slice.required_core_items` entry is complete in the manifest. It does not install dependencies, build, or run a browser. Separately run the applicable install/build and slice interaction/browser checks. At handoff, list actual commands and results, the browser states/viewports inspected, and any NOT_RUN item. Do not describe W6 quality QA as passed if a required check was skipped. No reviewer fields are used for W6, and no separate report is created.

## W7: Human Learning Review

Present the slice for a person to judge why the mechanism is introduced, whether the key operation can be explained accurately, whether prose and graphics jointly support the conclusion, whether the next step follows naturally, and also the emphasis, prose load, necessary math, and value of each interaction. Record the decision and required edits in `design/implementation-plan.md`. Complete W7 with `--reviewed-by` and `--note` only after a person records PASS. On REVISE, retain the decision and record feedback, scope, and approved content to preserve; repair the slice, rerun the W6-scope build/interaction/visual checks, and ask a person to review it again. This does not repeat `stage ... W6 complete` and does not reset W4/W5 in `paper.yaml`. If W4's core order or reasoning must change, first obtain the user's explicit reconfirmation and record the original decision, revision, and affected stages in the existing plan. Only a subsequent human PASS may complete W7. If W8/W9 work later reveals an upstream design change, record the impact and review scope, obtain the applicable human reconfirmation, and revisit affected W7/W9 learning acceptance; do not manually rewrite accepted workflow states. Do not require the unimplemented final integration scene to pass W7; inspect it during W8 and reserve formal learning acceptance for W9.

## W8: Full Implementation

After each page or complete interaction, inspect its relevant states. When a shared style or component changes, expand regression to affected pages and overlays. Preserve confirmed design invariants; pause for the user's decision if implementation would change an approved semantic or structural choice.

Before editing, follow the task route in `AGENTS.md` and read the project's `design/implementation-plan.md`. Read the applicable teaching, evidence, and browser QA rules for the change; do not reload the full workflow or unrelated standards when their route points to a focused section. Record the protected invariants, allowed local changes, and shared/adjacent areas at risk in the existing plan. Fix ordinary defects within that scope; ask for a decision before changing approved diagram meaning, state order, primary workspace layout, or main animation. After editing, inspect the actual diff and affected browser states; do not rely on a self-report that the approved design was preserved.

For a complex mechanism or complete-algorithm integration scene, complexity is not itself a defect. Use the amount of state, motion, spatial precision, explanation, and viewpoint change required by the W4 learning task and W5 semantic contract. Reject complexity that communicates no algorithm fact, but do not remove required objects or actions merely to make implementation simpler.

1. Implement all remaining CORE content on the accepted spine.
2. Keep SUPPORTING content compact; put REFERENCE material in the Reference Hub/advanced area; omit DELETE.
3. Copy any reusable source into this paper's project. Do not import a cross-paper runtime package.
4. Keep paper data separate from teaching demonstrations and distinguish paper state, computed/derived state, and teaching-only visible state. Derive key outputs, transitions, sample identities, and formula results from one project-level data/calculation model; text, graphics, formulas, and animation must read that same result rather than implementing an incompatible "animation algorithm." Where a simplification changes understanding of the algorithm or its applicability, explain it briefly near the affected material; where it creates no reasonable risk of confusion, avoid repetitive disclaimers.
5. Implement complex paths as independently verifiable state segments. Make the initial state and one real transition correct, assert their handoff, then add later segments through the final prediction/output. Important states must be reproducible, pausable, and inspectable. When continuous computation is part of the meaning, do not simulate it solely by replacing an entire static image.
6. Before any repair, compare the current code with confirmed W4/W5 content. A style fix must not delete causal prose, formula correspondence, key animation states, or approved visual relationships. Ask the user before changing established teaching logic or an accepted visual baseline.
7. Support keyboard/focus, reduced motion, mobile, touch, and non-drag operation where applicable.
8. At W8, run project tests, the production build, declared project audits, implementation coverage checks, and Visual QA against the actual publish source. Verify DOM/data invariants plus representative initial, intermediate, handoff, and final states and motion where applicable; report actual outcomes. For an intermediate fix, run the existing checks that cover the changed behavior when available. W8 does not require a PaperSkill checkout or official upstream validator; the official contract is covered by the user's W10 preflight after W9 acceptance.

After a W6/W8 feedback fix is verified, decide whether to add, merge, supersede, add regression coverage for, or leave out a public history case. Search existing active cases first. Project-specific decisions stay in that paper's implementation plan. Add a general case only when the root cause and correction have evidence; if not verified, report the observation for the current task without promoting it to policy. Do not create a separate experience report.

Update the implementation manifest for every CORE item and for each SUPPORTING/REFERENCE placement. The W8 CLI gate checks planned CORE coverage, lower-priority placements, and asset materialization/provenance. It does not run project tests, production builds, DOM assertions, or browser Visual QA. Run those checks against the actual publish source; at handoff list the real commands/results, states/viewports inspected, and NOT_RUN items. If required QA was skipped, do not claim W8 quality acceptance passed. Use the existing implementation plan and Visual QA outputs; do not create another report. The user runs the sole official upstream validation flow as W10 after accepting W9; do not require an upstream checkout during W8.

## Forbidden Actions

- Do not generate the complete site before the human learning review.
- Do not add controls, animation, or formula labs to satisfy a quota.
- Do not create a second calculation layer for animation or let teaching-visible state change paper/computed state semantics.
- Do not replace a required continuous computation with unrelated static swaps, nor reduce a verified complex scene solely because it is complex.
- Do not continue after a failed W7 review.
- Do not mark W7 complete without human approval. W6/W8 are automatic stages and complete only after their structural coverage checks pass.
- Do not satisfy structural coverage with empty files, placeholder chapters, unrelated modules, or fake registrations.
- Do not describe a build or Visual QA result as an official upstream validation result.
- Do not equate a W6/W8 CLI structural completion record with project quality QA.

## Completion Criteria

The tutorial follows the accepted spine, its learning and evidence boundaries are preserved, and human W7 acceptance is recorded before W8 completion.
