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

Follow `docs/WORKFLOW.md`. Source intake and a one-time source cache precede the paper model. Evidence and asset curation precede the learning spine. The first code is a small vertical slice; a person reviews whether it teaches the intended mental model before full implementation proceeds. Learning quality and evidence validity remain human judgments; tools may check structure, paths, references, coverage, and builds only.

Human review is required only at W2, W4, W7, and W9. These stages need `reviewed_by` and `note`; never invent a reviewer or mark them complete on a person's behalf. W0, W1, W3, W5, W6, W8, and W10 are recorded as `completed_by: automation` only after their mechanical checks pass. W3 remains blocked by unresolved source/evidence conflicts, unsafe claim wording, or unclear asset rights. Never let build success override a failed learning or evidence review.

## Source and evidence

Paper facts must resolve to the cited paper version and a source locator. Distinguish paper facts/results, author interpretations, our interpretations, implementation mappings, background, and teaching examples. Do not silently broaden a result beyond its conditions or present an illustrative toy as paper data.

Cache one complete, systematic paper read under `source-cache/`. Use the cache for later planning and review; repeat a full extraction only to correct a failed or incomplete cache. The cache manifest includes the figure inventory and source metadata. Do not accumulate unrelated partial reads as a substitute for a reliable cache.

## Visual feedback and iterative UI revisions

When a user gives screenshot-based or visual revision feedback, translate it into explicit acceptance criteria before changing the UI. Record the affected object, the relationship it should show, direction and alignment, exact source/target pairs, what must stay invariant, what may change, semantic colors, language, and the requested scope.

- Read the relevant conversation history together with the screenshot. Do not infer that an arrow should connect an entire sequence when the requested relation is between adjacent nodes. Write down the intended edges (for example, `01→02`, `02→03`) before implementing them.
- For comparisons and charts, separate invariants from changing values: dimensions, coordinate identity, axes, scale, and zero point may need to stay fixed while measurements change.
- Check terminal conditions as well as the middle of a diagram: stray lines before the first node or after the last node, arrow direction, clipping, and container bounds.
- Preserve already accepted page framing and shared interactions unless the user asks to change them. After a local fix, inspect the full affected sequence and nearby sections so the same defect has not been repeated elsewhere.
- Validate the rendered UI at the relevant viewport when possible, then run the project build. If the rendered result could not be inspected, say so instead of implying visual verification.

For screenshot-based UI revisions, consult [`docs/ui-teaching-lessons.md`](docs/ui-teaching-lessons.md) for recorded layout, typography, animation, diagram, and language feedback. Check each entry's paper scope; reuse general layout lessons while keeping paper-specific visual mappings and semantics scoped to their original project.

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

For macro-workflow work, update the workflow, contract, templates, relevant skills, and the smallest necessary helper behavior. Do not redesign paper-specific teaching content, rebuild a shared component library, or modify the upstream repository unless explicitly requested. All active workspaces use `schema_version: 3`; do not introduce compatibility branches for older workflow schemas.

`tools/paper.py` checks files, metadata shape, and resolvable references. It cannot decide whether an explanation teaches well. Preserve accessibility, keyboard/touch support, reduced motion, mobile behavior, build validation, human learning acceptance, and release boundaries in paper-specific work.
