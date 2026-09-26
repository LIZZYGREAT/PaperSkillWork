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

## W0–W10 workflow

Follow `docs/WORKFLOW.md`. Source intake and a one-time source cache precede the paper model. Evidence and asset curation precede the learning spine. The first code is a small vertical slice; a person reviews whether it teaches the intended mental model before full implementation proceeds. Learning quality and evidence validity remain human judgments; tools may check structure and references only.

Never mark a workflow stage complete on behalf of a human reviewer. Never let build success override a failed learning or evidence review.

## Source and evidence

Paper facts must resolve to the cited paper version and a source locator. Distinguish paper facts/results, author interpretations, our interpretations, implementation mappings, background, and teaching examples. Do not silently broaden a result beyond its conditions or present an illustrative toy as paper data.

Cache one complete, systematic paper read under `source-cache/`. Use the cache for later planning and review; repeat a full extraction only to correct a failed or incomplete cache. The cache manifest includes the figure inventory and source metadata. Do not accumulate unrelated partial reads as a substitute for a reliable cache.

## Visual assets

Inventory figures, tables, and other source visuals; classify and evaluate each; then record a use decision. Preserve selected source assets apart from derivatives, record source/page/caption/processing/evidence/reuse-rights metadata, and explain selected paper visuals in the tutorial. Do not publish assets whose reuse rights are unclear. Do not submit a paper PDF. Use relative image paths and include asset provenance in the exported project's `README.md`.

## Project and release boundaries

1. Each paper workspace lives under `papers/<paper-id>/`.
2. Do not rewrite existing LwF scenes or modify frozen `web/canonical/` artifacts as part of a macro-workflow change.
3. The tutorial export is an independent React + TypeScript project under `html_output/<paper-name>/<version>/`.
4. Copy any useful shared source into that project; do not depend on a cross-paper runtime package or local workspace path.
5. Tutorial PRs contain only `html_output/<paper>/<version>/`. Workflow/skill changes, if ever contributed upstream, use a separate PR.
6. Retain the upstream-required entry files and run the official current upstream preflight before release. A green CI run does not guarantee merge; maintainers decide.
7. PaperSkill is a separate repository. Use its official import flow; do not merge or cherry-pick PaperSkillWork history into it.

## Scope and verification

For macro-workflow work, update the workflow, contract, templates, relevant skills, and the smallest necessary helper behavior. Do not redesign a paper's scenes, rebuild a shared component library, or modify the upstream repository unless explicitly requested. Keep existing v1/v2 workspaces readable; new workspaces use schema/workflow v3.

`tools/paper.py` checks files, metadata shape, and resolvable references. It cannot decide whether an explanation teaches well. Preserve accessibility, keyboard/touch support, reduced motion, mobile behavior, build validation, human learning acceptance, and release boundaries in paper-specific work.
