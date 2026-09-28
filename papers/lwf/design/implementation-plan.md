# Implementation Plan: Learning without Forgetting

Paper ID: `lwf`

## Learning Goal and Non-goals

After using the tutorial, a reader should be able to explain the no-old-data constraint; identify shared, old-task, and new-task parameters; trace both model passes and the three loss terms; distinguish gradient computation from parameter updates; explain how the teacher changes in sequential use; and state what the reported evidence does and does not support.

The implementation does not claim that LwF eliminates forgetting on every old input. It does not simulate paper accuracy from the interactive toys. No original paper figure or table image is selected for publication while reuse rights remain unverified.

## Primary Spine Mapping

The machine-readable map below describes the current 00–07 standalone tutorial source. Its first slice follows S00–S03; the remaining chapters extend that path through limits, sequential use, evidence, and an integrated replay.

```yaml
implementation:
  stages:
    - {id: S00, page: "00-problem", core_items: [L01, L02], evidence_refs: [C01, C03], primary_vehicle: "Problem constraint and method comparison", reusable_pattern: null, reason: "Establish the missing-old-data condition before presenting the mechanism."}
    - {id: S01, page: "01-architecture", core_items: [L03, L04], evidence_refs: [A01, A02, A03], primary_vehicle: "Shared backbone and task-head ownership view", reusable_pattern: ArchitectureExplorer, reason: "Readers need to distinguish old state from newly created output parameters."}
    - {id: S02, page: "02-key-move", core_items: [L05, L06], evidence_refs: [C02, A04, A07], primary_vehicle: "Teacher/student dual-path process view", reusable_pattern: ProcessLoopExplorer, reason: "Make the source and meaning of the old response explicit on the same current input."}
    - {id: S03, page: "03-training-cycle", core_items: [L07, L08, L09], evidence_refs: [F01, F03, F04, A05, I03], primary_vehicle: "One-batch loss and update sequence", reusable_pattern: FlowStepper, reason: "Connect the two targets, objective, training phases, gradient, and optimizer update."}
    - {id: S04, page: "04-mechanism-boundary", core_items: [L10, L11, L12, L13], evidence_refs: [F02, F05, F06, C03, C07, C11, T01, T02, T03], primary_vehicle: "Temperature, objective-weight, and input-coverage controls", reusable_pattern: CompareView, reason: "Explain each control as a change to the objective and keep the preservation boundary visible."}
    - {id: S05, page: "05-sequential-tasks", core_items: [L14], evidence_refs: [C02, C09], primary_vehicle: "Eight-step task handoff sequence", reusable_pattern: StateMachineExplorer, reason: "Show the current expanded model becoming the source model for the next task."}
    - {id: S06, page: "06-paper-evidence", core_items: [L15, L16, L17, L18, L19], evidence_refs: [E01, E02, E03, E04, E05, E06, C09, C10, A08], primary_vehicle: "Evidence cards with source locators and verdict controls", reusable_pattern: EvidenceViewer, reason: "Bind results to task, model, split, metric, protocol, and interpretation limits."}
    - {id: S07, page: "07-grand-trail", core_items: [L20], evidence_refs: [C02, A05, F04, C07], primary_vehicle: "Nine-checkpoint integrated replay", reusable_pattern: FlowStepper, reason: "Let the learner reconstruct the complete state and information path in order."}
  assets: []
  supporting:
    - {item: SUP01, placement: compact-inline}
    - {item: SUP02, placement: expandable}
    - {item: SUP03, placement: compact-inline}
    - {item: SUP04, placement: expandable}
  reference:
    - {item: REF01, placement: Evidence details}
    - {item: REF02, placement: Evidence details}
    - {item: REF03, placement: Advanced details}
    - {item: REF04, placement: Implementation notes}
  vertical_slice:
    stages: [S00, S01, S02, S03]
    required_core_items: [L01, L02, L03, L04, L05, L06, L07, L08, L09]
```

## Reusable Pattern Library

The source uses `ArchitectureExplorer` for ownership, `ProcessLoopExplorer` and `FlowStepper` for the information/update sequence, `CompareView` for paired mechanism views, `StateMachineExplorer` for task handoff, and `EvidenceViewer` for source-bound results. `ReferenceHub` and `TermRef` support cross-links. Paper-specific components retain the LwF labels and constraints. The plan selects no paper-source assets; `implementation.assets` is empty.

## Vertical Slice (W6)

The first slice is the path through chapters 00–03: establish the no-old-data problem, identify parameters, trace the old response on current inputs, and complete one training cycle. The current `web/final/` source also contains chapters 04–07. That additional implementation does not substitute for the human W7 review of the slice.

### Vertical Slice Review (W7)

Vertical Slice Review: PASS

- Reviewer: the user, who explicitly confirmed in this conversation on 2026-09-28 that W7 was reviewed and approved.
- Decision: PASS.
- Review findings: no item-level correction was supplied.

## Full Implementation (W8)

The 00–07 tutorial source is present in `web/final/`; the chapter/data mapping is recorded above. Source-art inventory decisions are in `design/asset-plan.md`. The final source includes original teaching diagrams and evidence cards; the paper's PDF and original source art are not part of the standalone tutorial folder.

## Human Acceptance Record

The user explicitly confirmed on 2026-09-28 that W7 was reviewed and approved. The W7 PASS is recorded above; no item-level correction or learner finding was supplied. W4 and W9 decisions are recorded in `design/learning-spine.md` and `audit/final-check.md` respectively.
