# PaperSkillWork Repository Rules

## Task routes

Start with this file for repository-wide boundaries. Read the stage contract in `docs/WORKFLOW.md`, then use the matching skill for the task procedure. Load detailed standards and references only when the current task needs them.

| Task | Read next |
| --- | --- |
| New workspace, source intake, or templates | `docs/WORKFLOW.md`, `docs/TEMPLATE_CONTRACT.md`, `tools/paper.py` |
| W2 paper model | `.agents/skills/paper-review/SKILL.md` and its listed inputs |
| W3 claims and source assets | `.agents/skills/evidence-audit/SKILL.md` and its listed inputs |
| W4 learning spine | `.agents/skills/learning-architecture/SKILL.md`, `docs/TEACHING_DESIGN_STANDARD.md` |
| W5–W7 implementation plan and slice review | `.agents/skills/implementation-plan/SKILL.md`; consult `docs/reusable-kit.md` and matching history cases when useful |
| W6–W8 page implementation or UI repair | `.agents/skills/enhanced-implementation/SKILL.md`, the paper's `design/implementation-plan.md`, `docs/VISUAL_QA.md`; search `docs/ui-teaching-lessons.md` by matching symptom |
| W9 learning/evidence audit | `.agents/skills/final-audit/SKILL.md`, `docs/VISUAL_QA.md` |
| W10 release | `docs/UPSTREAM_RELEASE.md` after W9 acceptance; the user runs the official preflight |
| Workflow, skill, template, or shared QA-tool changes | `docs/WORKFLOW.md`, `docs/TEMPLATE_CONTRACT.md`, relevant tests |

Historical cases are diagnostic clues, not current policy. Apply only an active case that matches the observed issue and the paper's approved design; the teaching and Visual QA documents remain authoritative.

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

Human review is required only at W2, W4, W7, and W9. These stages need `reviewed_by` and `note`; never invent a reviewer or mark them complete on a person's behalf. W0, W1, W3, W5, W6, and W8 are recorded as `completed_by: automation` after their mechanical checks pass. W10 is recorded only after the user completes the official PaperSkill preflight and explicitly records the progress. W3 remains blocked by unresolved source/evidence conflicts, unsafe claim wording, or unclear asset rights. Never let build success override a failed learning or evidence review.

Do not make W5 depend on a hand-maintained upstream chapter/module mapping. Record a specific conflict in the existing `implementation-plan.md` only when the target upstream contract cannot naturally represent the approved design. At W6, the initial project scaffold already includes the upstream source entrypoints; Codex builds and checks the first real slice. At W8, Codex checks implementation coverage, runs project tests and the production build, and performs Visual QA against the actual source. W8 does not require an upstream checkout or official release validator; the official contract is checked by the user's full W10 preflight. Do not create a second validator or require `audit/upstream-source-check.json`. W9 remains a real human review of learning, evidence, and the rendered result. W10 is the single formal release gate, manually triggered by the user only after W9 is accepted. Follow the unique [W10 release guide](docs/UPSTREAM_RELEASE.md); Codex must not run PaperSkill release commands, push, or create a PR. Help explain preflight output or repair a specific defect only when the user explicitly asks.

## Source and evidence

Paper facts must resolve to the cited paper version and a source locator. Distinguish paper facts/results, author interpretations, our interpretations, implementation mappings, background, and teaching examples. Do not silently broaden a result beyond its conditions or present an illustrative toy as paper data.

Cache one complete, systematic paper read under `source-cache/`. Use the cache for later planning and review; repeat a full extraction only to correct a failed or incomplete cache. The cache manifest includes the figure inventory and source metadata. Do not accumulate unrelated partial reads as a substitute for a reliable cache.

## Visual feedback and iterative UI revisions

Follow docs/VISUAL_QA.md for browser screenshots, geometry checks, regression scope, reporting, and stop conditions. If the rendered result cannot be inspected, report NOT_RUN rather than implying visual verification. Search docs/ui-teaching-lessons.md by symptom when a matching historical case may help; do not treat project-specific visual mappings as general defaults.

## Visual assets

Inventory figures, tables, and other source visuals; classify and evaluate each; then record a use decision. At W3 keep selected originals in `source-cache/figures/`, record source/page/caption/processing/evidence/reuse-rights metadata, and do not require a derivative yet. At W5 assign each selected public asset to a spine stage and choose its rendering. Generate derivatives during implementation; W8 verifies the derivative and web copy. The W10 official Import carries the source README and selected assets into PaperSkill, where the upstream validator checks the official version. Do not publish assets whose reuse rights are unclear. Do not submit a paper PDF. Use relative image paths and include asset provenance in the exported project's `README.md`.

## Project and release boundaries

1. Each paper workspace lives under `papers/<paper-id>/`.
2. Macro-workflow refactors must not redesign paper-specific teaching content unless explicitly requested.
3. The official tutorial version is an independent React + TypeScript project under `PaperSkill/html_output/<upstream-paperName>/<upstream-version>/`. Internal `paper_id` is not an upstream directory identifier. Derive `release.upstream_paper_name` from the English paper title unless explicitly configured. `release.output`, when present, is only a PaperSkill-relative metadata path and must never be resolved or checked under PaperSkillWork. Let the official Import choose a free version and suffix; do not duplicate its version-collision logic.
4. Copy any useful shared source into that project; do not depend on a cross-paper runtime package or local workspace path.
5. Tutorial PRs contain only `html_output/<paper>/<version>/`. Workflow/skill changes, if ever contributed upstream, use a separate PR.
6. Retain the upstream-required entry files from project creation. After W9 acceptance, the user follows the [W10 release guide](docs/UPSTREAM_RELEASE.md): `release-info` reads paper metadata and contributor defaults, then the user's existing PaperSkill checkout receives the official Import, validate, a commit limited to this version directory, and preflight. The official Import selects the version and writes directly under PaperSkill's `html_output/`; do not create a temporary clone, PaperSkillWork export, copy step, SHA report, or parallel preflight. Once the user confirms preflight passed, `stage <paper-id> W10 complete` records progress without claiming to verify a report. Codex does not run PaperSkill release commands, push, or create a PR. Ordinary `check` does not require a local PaperSkill path. A green CI run does not guarantee merge; maintainers decide.
7. PaperSkill is a separate repository. Use its official import flow; do not merge or cherry-pick PaperSkillWork history into it.

## Scope and verification

For macro-workflow work, treat papers/<paper-id>/ as out of scope unless the user specifically requests work there. Do not use architecture changes as a reason to redesign paper-specific teaching content.

For macro-workflow work, update the workflow, contract, templates, relevant skills, and the smallest necessary helper behavior. Do not redesign paper-specific teaching content, rebuild a shared component library, or modify the upstream repository unless explicitly requested. All active workspaces use `schema_version: 3`; do not introduce compatibility branches for older workflow schemas.

`tools/paper.py` checks files, metadata shape, and resolvable references. It cannot decide whether an explanation teaches well. Preserve accessibility, keyboard/touch support, reduced motion, mobile behavior, build validation, human learning acceptance, and release boundaries in paper-specific work.
