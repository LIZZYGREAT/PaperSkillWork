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

Follow `docs/WORKFLOW.md`. At W0, the user supplies known paper metadata once through `tools/paper.py new`; the command writes `paper.yaml` and synchronizes initial source-cache metadata. Later stages read `paper.yaml`; do not ask again for information already recorded. Correct missing or incorrect facts in `paper.yaml` and synchronize the relevant cache. Source intake and a one-time source cache precede the paper model. Evidence and asset curation precede the learning spine. The first code is a small vertical slice; a person reviews whether it teaches the intended mental model before full implementation proceeds. Learning quality and evidence validity remain human judgments; tools may check structure, paths, references, coverage, and builds only.

Human review is required only at W2, W4, W7, and W9. These stages need `reviewed_by` and `note`; never invent a reviewer or mark them complete on a person's behalf. W0, W1, W3, W5, W6, W8, and W10 are recorded as `completed_by: automation` only after their mechanical checks pass. W3 remains blocked by unresolved source/evidence conflicts, unsafe claim wording, or unclear asset rights. Never let build success override a failed learning or evidence review.

Do not make W5 depend on a hand-maintained upstream chapter/module mapping. Record a specific conflict in the existing `implementation-plan.md` only when the target upstream contract cannot naturally represent the approved design. At W6, the initial project scaffold already includes the upstream source entrypoints; Codex builds and checks the first real slice. At W8, Codex checks implementation coverage, runs project tests and the production build, and performs Visual QA against the actual source. W8 does not require an upstream checkout or official release validator; the official contract is checked by the full W10 preflight. Do not create a second validator or require `audit/upstream-source-check.json`. W9 remains a real human review of learning, evidence, and the rendered result. W10 is the single formal release gate, manually triggered by the user only after W9 is accepted. Follow the unique [manual release guide](docs/UPSTREAM_RELEASE.md); Codex must not run W10, push, or create a PR. Help explain preflight output or fix a specific defect only when the user explicitly asks.

## Source and evidence

Paper facts must resolve to the cited paper version and a source locator. Distinguish paper facts/results, author interpretations, our interpretations, implementation mappings, background, and teaching examples. Do not silently broaden a result beyond its conditions or present an illustrative toy as paper data.

Cache one complete, systematic paper read under `source-cache/`. Use the cache for later planning and review; repeat a full extraction only to correct a failed or incomplete cache. The cache manifest includes the figure inventory and source metadata. Do not accumulate unrelated partial reads as a substitute for a reliable cache.

## Visual feedback and iterative UI revisions

Follow docs/VISUAL_QA.md for browser screenshots, geometry checks, regression scope, reporting, and stop conditions. If the rendered result cannot be inspected, report NOT_RUN rather than implying visual verification. Consult docs/ui-teaching-lessons.md for historical examples; reuse general layout lessons while keeping paper-specific visual mappings and semantics scoped to their original project.

## Visual assets

Inventory figures, tables, and other source visuals; classify and evaluate each; then record a use decision. At W3 keep selected originals in `source-cache/figures/`, record source/page/caption/processing/evidence/reuse-rights metadata, and do not require a derivative yet. At W5 assign each selected public asset to a spine stage and choose its rendering. Generate derivatives during implementation; W8 verifies the derivative and web copy, and W10 verifies export copies and README provenance. Do not publish assets whose reuse rights are unclear. Do not submit a paper PDF. Use relative image paths and include asset provenance in the exported project's `README.md`.

## Project and release boundaries

1. Each paper workspace lives under `papers/<paper-id>/`.
2. Macro-workflow refactors must not redesign paper-specific teaching content unless explicitly requested.
3. The tutorial export is an independent React + TypeScript project under `html_output/<upstream-paperName>/<upstream-version>/`. Internal `paper_id` is not an upstream directory identifier. Derive `release.upstream_paper_name` from the English paper title and `release.upstream_version` from the shared contributor profile plus submission date (pinyin, or an ASCII display name/GitHub username when pinyin is absent); `release.output` follows those fields exactly. Auto-generated versions take the next free upstream suffix. Never overwrite an existing upstream version.
4. Copy any useful shared source into that project; do not depend on a cross-paper runtime package or local workspace path.
5. Tutorial PRs contain only `html_output/<paper>/<version>/`. Workflow/skill changes, if ever contributed upstream, use a separate PR.
6. Retain the upstream-required entry files from project creation. After W9 acceptance, the user manually triggers `tools/paper.py upstream-check` using the [manual release guide](docs/UPSTREAM_RELEASE.md). It reads paper metadata from `paper.yaml` and contributor defaults from the user's Git config; explicit CLI values override defaults. The command records the clean PaperSkill checkout's commit, runs official import/validation/build/preflight in an isolated temporary checkout, and writes `audit/upstream-preflight.json`. W10 reads this machine report; a Markdown PASS is not evidence. Codex does not trigger W10, push, or create a PR, and helps interpret output or repair a specific defect only on explicit request. Ordinary `check` does not require a local PaperSkill path, and pending W10 is a warning until release. A green CI run does not guarantee merge; maintainers decide.
7. PaperSkill is a separate repository. Use its official import flow; do not merge or cherry-pick PaperSkillWork history into it.

## Scope and verification

For macro-workflow work, treat papers/<paper-id>/ as out of scope unless the user specifically requests work there. Do not use architecture changes as a reason to redesign paper-specific teaching content.

For macro-workflow work, update the workflow, contract, templates, relevant skills, and the smallest necessary helper behavior. Do not redesign paper-specific teaching content, rebuild a shared component library, or modify the upstream repository unless explicitly requested. All active workspaces use `schema_version: 3`; do not introduce compatibility branches for older workflow schemas.

`tools/paper.py` checks files, metadata shape, and resolvable references. It cannot decide whether an explanation teaches well. Preserve accessibility, keyboard/touch support, reduced motion, mobile behavior, build validation, human learning acceptance, and release boundaries in paper-specific work.
