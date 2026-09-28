# Learning Spine: Learning without Forgetting

Paper ID: `lwf`

## Primary Learning Spine

```text
Old data are unavailable → preserve the old model as a teacher → add a task head → run current inputs through teacher and expanded model → combine old-response and new-label objectives → update parameters in two phases → repeat as tasks arrive → inspect task-specific evidence and the input-coverage boundary
```

## Priority Matrix

```yaml
stages:
  - {id: S00, question: "What must be learned when the old training data are unavailable?"}
  - {id: S01, question: "Which model parts are shared, retained, and added?"}
  - {id: S02, question: "Where does the old-task learning signal come from?"}
  - {id: S03, question: "How do the two objectives change model state during one training cycle?"}
  - {id: S04, question: "What does the preservation objective constrain, and where does it stop?"}
  - {id: S05, question: "How does the teacher role move when another task arrives?"}
  - {id: S06, question: "What do the paper's results support, and what remains uncertain?"}
  - {id: S07, question: "Can the whole method be reconstructed as one ordered trace?"}
items:
  - {id: L01, title: "Old-task training examples are unavailable", priority: CORE, stage: S00, placement: mainline, evidence_refs: [C01]}
  - {id: L02, title: "Compare replay-free LwF with fine-tuning, feature extraction, and joint training", priority: CORE, stage: S00, placement: mainline, evidence_refs: [C01, C03]}
  - {id: L03, title: "Separate shared parameters from task-specific output parameters", priority: CORE, stage: S01, placement: mainline, evidence_refs: [A01, A02]}
  - {id: L04, title: "Add and initialize parameters for the new task", priority: CORE, stage: S01, placement: mainline, evidence_refs: [A03]}
  - {id: L05, title: "Run the same new-task input through the old and expanded models", priority: CORE, stage: S02, placement: mainline, evidence_refs: [C02, A04]}
  - {id: L06, title: "Distinguish old responses from replay examples and ground-truth labels", priority: CORE, stage: S02, placement: mainline, evidence_refs: [C02, A07]}
  - {id: L07, title: "Train new outputs against current task labels", priority: CORE, stage: S03, placement: mainline, evidence_refs: [F01]}
  - {id: L08, title: "Match old outputs while including weight decay", priority: CORE, stage: S03, placement: mainline, evidence_refs: [F03, F04, C03]}
  - {id: L09, title: "Separate warm-up, joint optimization, backward, and optimizer update", priority: CORE, stage: S03, placement: mainline, evidence_refs: [A05, I03]}
  - {id: L10, title: "Explain temperature as a response-distribution transform", priority: CORE, stage: S04, placement: mainline, evidence_refs: [F02, F06, T01]}
  - {id: L11, title: "Explain lambda as a loss coefficient rather than an accuracy control", priority: CORE, stage: S04, placement: mainline, evidence_refs: [F05, T03]}
  - {id: L12, title: "Distinguish output matching, weight decay, and parameter-L2 comparison", priority: CORE, stage: S04, placement: mainline, evidence_refs: [C03, C11]}
  - {id: L13, title: "Limit preservation claims to inputs covered by current training data", priority: CORE, stage: S04, placement: mainline, evidence_refs: [C07, T02]}
  - {id: L14, title: "Make the latest expanded model the teacher for the next task", priority: CORE, stage: S05, placement: mainline, evidence_refs: [C02, C09]}
  - {id: L15, title: "Read the named ImageNet-to-CUB LwF result with model and split", priority: CORE, stage: S06, placement: mainline, evidence_refs: [E01]}
  - {id: L16, title: "Mark comparator absolute values reconstructed from printed deltas", priority: CORE, stage: S06, placement: mainline, evidence_refs: [E02, E03, E04]}
  - {id: L17, title: "Read sequential results as task-specific trends, not a pooled guarantee", priority: CORE, stage: S06, placement: mainline, evidence_refs: [E05]}
  - {id: L18, title: "Keep the tracking appendix result and its significance caveat together", priority: CORE, stage: S06, placement: mainline, evidence_refs: [E06]}
  - {id: L19, title: "Keep the evidence scope and proposed future directions distinct", priority: CORE, stage: S06, placement: mainline, evidence_refs: [C09, C10]}
  - {id: L20, title: "Reconstruct the whole sequence from constraint through limits", priority: CORE, stage: S07, placement: mainline, evidence_refs: [C02, A05, F04, C07]}
  - {id: SUP01, title: "Classification loss and probability prerequisites", priority: SUPPORTING, stage: S00, placement: compact-inline, evidence_refs: [B01]}
  - {id: SUP02, title: "Autograd parameter-group terminology", priority: SUPPORTING, stage: S03, placement: expandable, evidence_refs: [I01, I02, I03]}
  - {id: SUP03, title: "Task-pair and dataset protocol details beyond the selected result", priority: SUPPORTING, stage: S06, placement: compact-inline, evidence_refs: [E05]}
  - {id: SUP04, title: "Task-specific layers and network expansion alternatives", priority: SUPPORTING, stage: S06, placement: expandable, evidence_refs: [A08]}
  - {id: REF01, title: "Full equations and per-class temperature derivation", priority: REFERENCE, stage: null, placement: Evidence details, evidence_refs: [F01, F02, F03, F04]}
  - {id: REF02, title: "All paper result protocols and source table locators", priority: REFERENCE, stage: null, placement: Evidence details, evidence_refs: [E01, E02, E03, E04, E05, E06]}
  - {id: REF03, title: "General continual-learning alternatives not evaluated as LwF components", priority: REFERENCE, stage: null, placement: Advanced details, evidence_refs: [C09, C10]}
  - {id: REF04, title: "Parameter-group to framework-object interpretation", priority: REFERENCE, stage: null, placement: Implementation notes, evidence_refs: [I01, I02, I03]}
  - {id: D01, title: "Claims that LwF guarantees no forgetting on every old input", priority: DELETE, stage: null, placement: none, evidence_refs: []}
  - {id: D02, title: "Claims that teacher outputs are cached old images or labels", priority: DELETE, stage: null, placement: none, evidence_refs: []}
  - {id: D03, title: "Claims that the paper validates LLMs or arbitrary online learning", priority: DELETE, stage: null, placement: none, evidence_refs: []}
```

## Reader's Causal Path

The sequence starts from the missing-data constraint, because that determines why ordinary joint training is not the method being taught. It then establishes ownership of the old model and the added head. Only after both models are visible does the reader see where the old-task target comes from: both models process current inputs. The training cycle combines that response target with true new labels, then separates the paper's two parameter-update phases. The mechanism chapter explains temperature, the loss weight, and the precise input-coverage boundary. Sequential task addition extends the same mechanism by making the latest model the next teacher. The evidence chapter narrows conclusions to the tested tasks, metrics, protocols, and caveats. The final replay asks the learner to reconstruct that path in order.

## Human Review

- Reviewer: the user, who explicitly confirmed in this conversation on 2026-09-28 that W4 was reviewed and approved.
- Decision: PASS.
- Review findings: no item-level correction was supplied.
