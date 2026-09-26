# PaperSkillWork Workflow v2

PaperSkillWork produces tutorials that help a first-time reader rebuild a paper's architecture, objects, state, information flow, mathematics, update process, experimental logic, and limits. A tutorial is not a paper abstract with animations.

## Gate sequence

```text
G0 Workspace + Learning Contract
→ G1 Paper Model
→ G2 Evidence Registry
→ G3 Canonical Compatibility Baseline
→ G4 Learning Architecture
→ G5 Scene Specifications
→ G6 Incremental Enhanced Implementation
→ G7 Learning + Evidence + Engineering Audit
→ PaperSkill Release
```

Gate identifiers and the explicit state machine remain stable. G1/G2 establish what the paper says; G4/G5 design the cognitive path; G6 implements reviewed milestones; G7 accepts learning first, then evidence, engineering, accessibility, and release scope. `paper.py` checks structure only and never claims that a learner has understood the paper.

| Gate | Purpose | Required artifact or acceptance |
| --- | --- | --- |
| G0 | Register the paper and learning contract | `paper.yaml`, `source/paper.url`, `design/learning-contract.md` |
| G1 | Build an executable model of the paper and classify its research positioning | `research/01_paper_model.md`, including a source-grounded Research Positioning section |
| G2 | Establish claim-level evidence boundaries | `research/02_evidence_registry.yaml` |
| G3 | Preserve the PaperSkill compatibility/build baseline | non-empty `web/canonical/`, build and human acceptance |
| G4 | Design dependencies, persistent objects, and learning scenes | `design/learning-architecture.md` |
| G5 | Specify only needed scenes and purposeful actions | one or more files in `design/scenes/` |
| G6 | Implement reviewed milestones and a first vertical slice | Enhanced project and milestone acceptance |
| G7 | Accept learning, evidence, engineering, accessibility, and release | `audit/final-check.md` and `audit/release-check.md` |

Valid gate states are `pending`, `in_progress`, `complete`, `skipped`, and `legacy`. Only a person may advance a gate after review. `skipped` requires a reason. Gates complete in sequence. Historical v1 `legacy` states are retained only for the PhyAgentOS migration or in migration metadata; they do not count as v2 acceptance.

## G0: Learning contract

Every v2 workspace records its target reader, prerequisites, unknowns, final learning outcomes, expected and implementation depth, evidence depth, and what the tutorial is not. This contract governs the rest of the work. Do not start from chapter count, a shared metaphor, animation, or interaction quota.

## G1: Paper Model

Read the full paper and build a source-grounded model in this order: problem; research positioning; prerequisites; objects and variables; architecture and ownership; state and time; data/tensor flow; transformations and formulas; optimization/update; end-to-end runtime; experiments; limitations. Include a Reconstruction Matrix for core objects with applicable lifecycle, producer/consumer, shape, state, gradient, update, and evidence details. Mark prerequisites as Required, Helpful, or Optional and state the depth needed. G1 contains no UI or interaction design.

The **Research Positioning** subsection in `research/01_paper_model.md` is required and records:

1. **Topic:** the broad research area and central phenomenon the paper studies.
2. **Problem type / setting:** the concrete task, constraints, and data or system conditions being addressed.
3. **Research direction:** the kind of technical approach the paper contributes, stated at the level supported by the paper.

Ground each field in the paper model and cite the relevant evidence IDs or source locations. Keep topic, problem setting, and method direction distinct. Prefer plain-language labels; avoid unsupported taxonomy labels and avoid turning a paper's experimental scope into a claim that its method is validated everywhere. This positioning later supplies the first-page topic tags.

## G2: Evidence Registry

`research/02_evidence_registry.yaml` is the structured source of claim evidence. Supported categories are `PAPER_FACT`, `PAPER_RESULT`, `AUTHOR_INTERPRETATION`, `OUR_INTERPRETATION`, `IMPLEMENTATION_MAPPING`, `TEACHING_TOY`, `GENERAL_BACKGROUND`, and `FUTURE_WORK`. Tie numerical results to dataset, model, split, metric, protocol, and source. A short `02_evidence_notes.md` may record unresolved conflicts or review notes; it must not duplicate the paper model.

## G3: Canonical compatibility baseline

Canonical is retained for PaperSkill compatibility, project shell, build contract, tokens, and reusable primitives. It does not set Enhanced chapter order, layout, interaction count, metaphor, or scene architecture. Enhanced follows the Learning Architecture, not Canonical's teaching structure, unless the architecture explicitly chooses otherwise.

## G4: Learning Architecture

Start with a Concept Dependency Graph: what a reader must understand first, what depends on it, and why. Define a persistent system workspace when it helps the learner reason across scenes. For each scene specify entry knowledge, unresolved question, new mental model, persistent objects, exit capability, and next question. A core scene also carries Entry Knowledge → Unresolved Question → Scene → New Mental Model → Next Question. Analogies are optional and must document their mapping, boundary, and removal condition.

## G5: Scene Specifications

Create `design/scenes/` files only for scenes that need specification. Each core scene states its learning goal, dependencies, persistent objects, system state, user actions, state transitions, architecture/data flow, mathematical model, implementation mapping, evidence, teaching-toy boundary, prerequisite terms, reconstruction test, implementation trace test, global dependency test, deletion test, acceptance questions, accessibility, mobile behavior, and non-goals.

For every core scene, answer:

1. **Reconstruction:** Can the learner draw or explain the mechanism without the page?
2. **Implementation trace:** What is the object, where and when does it exist, what produces/consumes/changes it, and what does not? For neural models, include shape, gradient source, optimizer membership, and update operation when applicable.
3. **Global dependency:** What does the scene consume and produce, and where is its output used later?
4. **Deletion:** What understanding is lost if the interaction is removed?

The deletion test is necessary but does not compensate for a failed reconstruction test. Interaction labels describe function (`RECONSTRUCTION`, `TRACE`, `COUNTERFACTUAL`, `PARAMETER_EXPLORATION`, `EVIDENCE_INSPECTION`, `DIAGNOSTIC`, `REFERENCE`); there is no coverage quota. Hover never carries the only explanation of knowledge required by the main path.

## G6: Incremental implementation

Implement in reviewed milestones, commonly Foundation, First Vertical Slice, Core Mechanism, Boundaries, Evidence + End-to-End, and Integration. The First Vertical Slice must arrive early enough for human learning acceptance. If it fails, stop and revise the learning architecture before expanding. Reuse persistent objects across scenes; keep paper data distinct from teaching toys; use real calculations for simulations; link terms, symbols, datasets, and evidence through registries. Do not invent narrative while coding.

On the first page, render the three G1 Research Positioning fields as compact tags directly below the page title. Each tag shows its category and short label; its detail is available on pointer hover and keyboard focus, and can be opened on touch devices. Make the same detail accessible to assistive technology. Treat the tags as orientation, not as a substitute for the page's explanation; essential learning content must not exist only in a tooltip. Keep the tag content in paper-specific data so it can be reviewed against the source.

## G7: Final audit

Run the audit in this order: learning acceptance; evidence acceptance; implementation semantics; engineering checks; accessibility/mobile; release scope. Reconstruct architecture, flow, state, mathematics, implementation mapping, and evidence boundaries across the tutorial. Any core learning failure makes the overall result FAIL even if build checks pass. Preserve build/validation, accessibility, reduced-motion, mobile, human acceptance, and release checks.

## Workspace and release boundary

```text
papers/<paper-id>/
├─ paper.yaml
├─ source/paper.url
├─ research/01_paper_model.md
├─ research/02_evidence_registry.yaml
├─ knowledge/terms.yaml
├─ design/learning-contract.md
├─ design/learning-architecture.md
├─ design/scenes/                 # only specified scenes
├─ web/canonical/                 # compatibility baseline
├─ web/enhanced/
├─ audit/final-check.md
├─ audit/release-check.md
└─ assets/{figures,screenshots}/
```

Local v1 artifacts are retained as legacy inputs. `paper.py migrate-v2 <paper-id>` is non-destructive: it creates v2 artifacts, records detected legacy paths and old gate states, does not alter Canonical or Enhanced, and leaves every v2 gate pending. `paper.py check` checks paths, files, YAML structure, and references; `paper.py learning-check` checks machine-verifiable scene structure and references only. Neither command evaluates semantic learning.

PaperSkill remains a separate release repository. Never merge PaperSkillWork history into PaperSkill or cherry-pick its commits. Release uses PaperSkill's official import flow, followed by validation and PR review.
