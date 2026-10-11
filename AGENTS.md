# PaperSkillWork Repository Rules

## Product principle

The deliverable is an executable mental model of a paper, not an animated summary or a collection of concept demos. Establish the paper's causal and runtime logic first; rank what matters; only then choose presentation and interaction.

Every `CORE` mechanism should let a first-time reader reconstruct, where applicable, its objects, ownership, inputs and outputs, lifecycle, state changes, data flow, learning/update signals, evidence, and limits. Correct details may be omitted when they do not help the reader understand the paper.

## Information priority

Before page implementation, assign each candidate item exactly one priority:

- `CORE`: required on the primary learning spine.
- `SUPPORTING`: compact inline explanation, hover, or expandable detail.
- `REFERENCE`: on-demand Reference Hub or advanced material, outside the main path.
- `DELETE`: omit from the tutorial.

Do not build an interaction, animation, analogy, chapter, or formula display to meet a quota. Choose a visual or interaction only when it explains a relationship or makes a real learning task easier. Prefer a validated reusable pattern, copied into the paper project when useful; do not import a shared runtime across paper projects.

Apply the teaching design standard in docs/TEACHING_DESIGN_STANDARD.md when planning narrative, language, mathematics, visuals, or interactions. Apply docs/VISUAL_QA.md when checking rendered UI. These documents add guidance to Workflow v3; they do not change its stage schema or human review gates.

## W0–W10 workflow

Follow `docs/WORKFLOW.md`. Source intake and a one-time source cache precede the paper model. Evidence and asset curation precede the learning spine. The first code is a small vertical slice; a person reviews whether it teaches the intended mental model before full implementation proceeds. Learning quality and evidence validity remain human judgments; tools may check structure, paths, references, coverage, and builds only.

Human review is required only at W2, W4, W7, and W9. These stages need `reviewed_by` and `note`; never invent a reviewer or mark them complete on a person's behalf. W0, W1, W3, W5, W6, W8, and W10 are recorded as `completed_by: automation` only after their mechanical checks pass. W3 remains blocked by unresolved source/evidence conflicts, unsafe claim wording, or unclear asset rights. Never let build success override a failed learning or evidence review.

At W5, record how the approved learning spine maps into the actual upstream release source in the existing `implementation-plan.md`; do not change the approved teaching design to meet upstream quotas. At W6, create the upstream-required source files with the first runnable slice and pass the `structure` source check plus that source's install/build. W8 requires a current `full` check of the configured release source using the official validator from a clean, identified PaperSkill checkout, plus its install/build. Bind the result to the source fingerprint and upstream commit/script/contract fingerprints; stale or missing evidence blocks automatic completion. The official validator and `paper-skill/contract.md` are the only authority for current upstream thresholds. A local checker may report early structure only and must never simulate full validation. W9 reviews the actual runtime mapping against tutorial metadata. W10 still runs the separate official import/validate/build/preflight flow.

## Source and evidence

Paper facts must resolve to the cited paper version and a source locator. Distinguish paper facts/results, author interpretations, our interpretations, implementation mappings, background, and teaching examples. Do not silently broaden a result beyond its conditions or present an illustrative toy as paper data.

Cache one complete, systematic paper read under `source-cache/`. Use the cache for later planning and review; repeat a full extraction only to correct a failed or incomplete cache. The cache manifest includes the figure inventory and source metadata. Do not accumulate unrelated partial reads as a substitute for a reliable cache.

## Visual feedback and iterative UI revisions

Follow docs/VISUAL_QA.md for browser screenshots, geometry checks, regression scope, reporting, and stop conditions. If the rendered result cannot be inspected, report NOT_RUN rather than implying visual verification. Consult docs/ui-teaching-lessons.md for historical examples; reuse general layout lessons while keeping paper-specific visual mappings and semantics scoped to their original project.

## Visual assets

Inventory figures, tables, and other source visuals; classify and evaluate each; then record a use decision. At W3 keep selected originals in `source-cache/figures/`, record source/page/caption/processing/evidence/reuse-rights metadata, and do not require a derivative yet. At W5 assign each selected public asset to a spine stage and choose its rendering. Generate derivatives during implementation; W8/W10 verify the derivative, web copy, export copy, and README provenance. Do not publish assets whose reuse rights are unclear. Do not submit a paper PDF. Use relative image paths and include asset provenance in the exported project's `README.md`.

## Project and release boundaries

1. Each paper workspace lives under `papers/<paper-id>/`.
2. Macro-workflow refactors must not redesign paper-specific teaching content unless explicitly requested.
3. The tutorial export is an independent React + TypeScript project under `html_output/<upstream-paperName>/<upstream-version>/`. Internal `paper_id` is not an upstream directory identifier; record `release.upstream_paper_name` and `release.upstream_version` separately, with `release.output` exactly matching those values.
4. Copy any useful shared source into that project; do not depend on a cross-paper runtime package or local workspace path.
5. Tutorial PRs contain only `html_output/<paper>/<version>/`. Workflow/skill changes, if ever contributed upstream, use a separate PR.
6. Retain the upstream-required entry files and run `tools/paper.py upstream-check` before release. It records the clean PaperSkill checkout's commit, runs official import/validation/build/preflight in an isolated temporary checkout, and writes `audit/upstream-preflight.json`. W10 reads this report; a Markdown PASS is not evidence. A green CI run does not guarantee merge; maintainers decide.
7. PaperSkill is a separate repository. Use its official import flow; do not merge or cherry-pick PaperSkillWork history into it.

## Scope and verification

For macro-workflow work, treat papers/<paper-id>/ as out of scope unless the user specifically requests work there. Do not use architecture changes as a reason to redesign paper-specific teaching content.

For macro-workflow work, update the workflow, contract, templates, relevant skills, and the smallest necessary helper behavior. Do not redesign paper-specific teaching content, rebuild a shared component library, or modify the upstream repository unless explicitly requested. All active workspaces use `schema_version: 3`; do not introduce compatibility branches for older workflow schemas.

`tools/paper.py` checks files, metadata shape, and resolvable references. It cannot decide whether an explanation teaches well. Preserve accessibility, keyboard/touch support, reduced motion, mobile behavior, build validation, human learning acceptance, and release boundaries in paper-specific work.
