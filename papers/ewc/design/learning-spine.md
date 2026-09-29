# Learning Spine: Overcoming catastrophic forgetting in neural networks

Paper ID: `ewc`

**W4 draft status:** ready for human review; not yet approved. The approved stage order remains the ten-page design order below. This document compresses that order into seven workflow stages; it does not reorder the pages or begin page implementation.

## Approved Page Order

```text
1 Why EWC
2 Probability / Likelihood / Loss
3 Prior / Bayes / Posterior
4 Laplace approximation
5 Fisher information
6 EWC objective / gradient
7 EWC lifecycle
8 Permuted MNIST
9 Atari
10 Grand Animation integration
```

The Page 10 animation integrates concepts taught on Pages 1–9. It must not introduce a new core claim, estimator, or implementation detail.

## Primary Learning Spine

| Stage | Pages | Question the reader answers | Handoff |
| --- | --- | --- | --- |
| S1 Problem and loss | 1–2 | Why can sequential training forget an earlier task, and how do network predictions lead to a task loss? | The reader has a likelihood, but not yet a probability distribution over parameters. |
| S2 Bayesian parameter view | 3 | How do prior and likelihood produce a posterior, and how does task A's posterior carry forward to task B? | The previous-task posterior contains the needed information, but is too complex to use exactly. |
| S3 Local posterior approximation | 4 | How does Laplace replace that intractable posterior with a local Gaussian around the task-A solution? | The approximation needs a diagonal precision signal for each parameter. |
| S4 Fisher to EWC constraint | 5–6 | What role does Fisher play, and how does its diagonal become a quadratic penalty and restoring gradient? | The equation is known; the reader now needs to see when the quantities are recorded and applied. |
| S5 Sequential lifecycle | 7 | What happens while learning task A, at its boundary, and while learning task B? | The method can now be checked against the experiments that use it. |
| S6 Evidence and boundaries | 8–9 | What do the MNIST and Atari results show, and what belongs to the complete Atari system rather than EWC alone? | The reader has the reported evidence and its limits needed for a final system-level replay. |
| S7 Full-system integration | 10 | Can the reader narrate the complete path from task-A evidence to task-B updates? | Recombine known concepts without adding new ones. |

## Source Boundaries for the Main Path

- Pages 1–3 may teach the classifier view `p_theta(y|x)` as **general background** using evidence record `B01`. The paper itself supplies `p(D|theta)` and states its relationship to negative task loss (`C12`); do not imply that the paper derives a softmax model.
- Pages 3–4 should distinguish the paper's Bayesian/Laplace derivation (`C03`, `C04`, `C13`) from a chosen software prior or a concrete checkpoint format.
- Pages 5–6 should present the paper-supported Fisher role and Equation (3) (`C05`, `C06`). The paper does not specify a general per-example gradient-squared estimator (`B02`). If the page explains the observed-label empirical Fisher, label it as separate background, cite `B03`, and distinguish it from the Fisher expectation. Do not silently attribute the empirical estimator to the EWC paper.
- Page 7 may draw an anchor-and-importance record as a teaching mapping (`M01`), while making clear that the paper does not define a software checkpoint schema. The 20-million-frame threshold is specific to the reported Atari experiment (`C09`), not a universal EWC rule.
- Page 8 must preserve the fixed pixel-permutation protocol and the conditions around the plotted results (`C10`, `R01`, `R02`). Page 9 must show task recognition and per-task replay alongside EWC, and present the Fisher perturbation result and its caveat (`C08`, `R03`, `R04`, `A01`).
- Page 10 is an integration exercise (`T02`). Any illustrative model or numbers must be labeled as teaching material rather than paper data.

## Priority Matrix

The fenced YAML is the machine-readable source of unique item IDs, stage assignments, priorities, and placements. Every candidate is assigned once: `CORE` is taught on the main path, `SUPPORTING` is compact or optional detail within a valid stage, `REFERENCE` stays outside the main path, and `DELETE` is omitted.

```yaml
stages:
  - id: S1_problem_and_loss
    pages: "1-2"
    question: "Why can sequential training forget task A, and where do prediction probability, data likelihood, and task loss enter?"
    exit: "The reader can describe the task-A/task-B conflict and connect a network prediction to a data likelihood and loss, with general background labeled."
  - id: S2_bayesian_parameter_view
    pages: "3"
    question: "How do prior and likelihood form a posterior, and why does task A's posterior matter when task B arrives?"
    exit: "The reader can explain the sequential Bayesian update and why the previous posterior becomes the next task's prior contribution."
  - id: S3_local_posterior_approximation
    pages: "4"
    question: "How can an intractable previous-task posterior be represented locally around the learned solution?"
    exit: "The reader can identify the Laplace Gaussian's center and the paper's diagonal Fisher precision approximation."
  - id: S4_fisher_to_ewc_constraint
    pages: "5-6"
    question: "How does Fisher supply parameter-wise constraint strength, and how does that strength enter EWC's objective and gradient?"
    exit: "The reader can read Equation (3), explain lambda and the diagonal weights, and derive the restoring term without calling it a separately printed equation."
  - id: S5_sequential_lifecycle
    pages: "7"
    question: "When are the previous solution and Fisher information established and used during sequential task learning?"
    exit: "The reader can trace task-A training, the task boundary, and task-B training while separating the paper's mathematical quantities from a teaching implementation mapping."
  - id: S6_evidence_and_boundaries
    pages: "8-9"
    question: "What do the reported MNIST and Atari experiments show, and which parts of the Atari outcome belong to the whole system?"
    exit: "The reader can state the experiment protocols and supported results without attributing task discovery or replay to EWC."
  - id: S7_full_system_integration
    pages: "10"
    question: "Can the reader connect the previously taught probability, posterior, approximation, Fisher, penalty, and task-boundary steps in one run?"
    exit: "The reader can retell the full chain; the animation adds no new core concept or unsupported implementation claim."

items:
  - id: forgetting-conflict
    title: "Sequential updates can damage earlier-task performance"
    priority: CORE
    stage: S1_problem_and_loss
    placement: mainline
    evidence_refs: [C01]
  - id: probability-and-loss
    title: "Network prediction probability, data likelihood, and negative task loss"
    priority: CORE
    stage: S1_problem_and_loss
    placement: mainline
    evidence_refs: [B01, C12]
  - id: sequential-bayes
    title: "Task-A posterior becomes task-B prior contribution"
    priority: CORE
    stage: S2_bayesian_parameter_view
    placement: mainline
    evidence_refs: [C03, C13]
  - id: laplace-approximation
    title: "Local Gaussian approximation around the task-A solution"
    priority: CORE
    stage: S3_local_posterior_approximation
    placement: mainline
    evidence_refs: [C04]
  - id: fisher-role
    title: "Diagonal Fisher is the paper's approximate precision signal"
    priority: CORE
    stage: S4_fisher_to_ewc_constraint
    placement: mainline
    evidence_refs: [C04, C05]
  - id: ewc-objective
    title: "Task-B loss plus the task-A Fisher-weighted quadratic penalty"
    priority: CORE
    stage: S4_fisher_to_ewc_constraint
    placement: mainline
    evidence_refs: [C06, I01]
  - id: ewc-gradient
    title: "Gradient of the quadratic penalty produces a restoring term"
    priority: CORE
    stage: S4_fisher_to_ewc_constraint
    placement: mainline
    evidence_refs: [M02]
  - id: task-boundary
    title: "Record task-A information and apply the constraint while learning task B"
    priority: CORE
    stage: S5_sequential_lifecycle
    placement: mainline
    evidence_refs: [C07, C09, M01]
  - id: permuted-mnist-evidence
    title: "Fixed pixel permutations and the reported retention and overlap results"
    priority: CORE
    stage: S6_evidence_and_boundaries
    placement: mainline
    evidence_refs: [C10, R01, R02]
  - id: atari-system-boundary
    title: "EWC is one part of the task-recognition, gain/bias, and replay system"
    priority: CORE
    stage: S6_evidence_and_boundaries
    placement: mainline
    evidence_refs: [C08, C09, R03]
  - id: atari-diagnostic-and-limit
    title: "Fisher perturbation evidence and the reported gap from separate DQNs"
    priority: CORE
    stage: S6_evidence_and_boundaries
    placement: mainline
    evidence_refs: [R04, R05, A01, A02]
  - id: grand-animation-integration
    title: "Recombine previously taught EWC concepts in one sequential run"
    priority: CORE
    stage: S7_full_system_integration
    placement: mainline
    evidence_refs: [T02, M01, M02]

  - id: softmax-classifier-detail
    title: "Optional detail on classifier output distributions and cross-entropy"
    priority: SUPPORTING
    stage: S1_problem_and_loss
    placement: expandable
    evidence_refs: [B01]
  - id: parameter-space-example
    title: "Small illustrative parameter-space example"
    priority: SUPPORTING
    stage: S1_problem_and_loss
    placement: expandable
    evidence_refs: [T01]
  - id: fisher-estimator-background
    title: "Expected Fisher and observed-label empirical Fisher are distinct"
    priority: SUPPORTING
    stage: S4_fisher_to_ewc_constraint
    placement: expandable
    evidence_refs: [B02, B03]
  - id: fisher-curvature-caveat
    title: "How to phrase the paper's local-curvature rationale"
    priority: SUPPORTING
    stage: S4_fisher_to_ewc_constraint
    placement: hover
    evidence_refs: [C05, B03]
  - id: atari-threshold-detail
    title: "Reported Atari Fisher timing and activation threshold"
    priority: SUPPORTING
    stage: S5_sequential_lifecycle
    placement: expandable
    evidence_refs: [C09]

  - id: atari-task-recognition-details
    title: "Task-recognition model and context inference details"
    priority: REFERENCE
    stage: null
    placement: Reference Hub
    evidence_refs: [C08]
  - id: per-game-atari-curves
    title: "Per-game Atari curves from the appendix"
    priority: REFERENCE
    stage: null
    placement: Evidence details
    evidence_refs: [R06]
  - id: exact-experiment-settings
    title: "Detailed MNIST and Atari settings and appendix tables"
    priority: REFERENCE
    stage: null
    placement: Reference Hub
    evidence_refs: [C09, C10]
  - id: extended-equation-notation
    title: "Full Bayes and Fisher notation for later lookup"
    priority: REFERENCE
    stage: null
    placement: Advanced details
    evidence_refs: [C03, C05, C13, B03]
  - id: implementation-state-details
    title: "Illustrative anchor-and-importance state and derivative notes"
    priority: REFERENCE
    stage: null
    placement: Implementation notes
    evidence_refs: [M01, M02]

  - id: empirical-estimator-as-paper-fact
    title: "Claiming the paper specifies an observed-label per-example Fisher estimator"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [B02, B03]
  - id: ewc-removes-replay
    title: "Claiming EWC removes replay from the Atari system"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [C08]
  - id: atari-result-is-ewc-alone
    title: "Attributing the complete Atari result to EWC alone"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [C08, R03, R05]
  - id: exact-prior-is-paper-prescribed
    title: "Claiming the paper prescribes one general prior distribution or software checkpoint schema"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [C04, C13, M01]
  - id: softmax-derived-by-ewc-paper
    title: "Presenting the tutorial's conditional softmax classifier as an equation derived by the EWC paper"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [B01, C12]
```

## Reader's Causal Path

1. Pages 1–2 establish the retention problem and the likelihood/loss language used by the later derivation.
2. Page 3 changes the object of uncertainty from predictions to parameters and carries task-A information forward as a posterior.
3. Page 4 makes that posterior usable by approximating it locally.
4. Pages 5–6 connect the approximate precision to Fisher, then show the objective and its derived gradient.
5. Page 7 turns those quantities into a sequence of task training and boundary operations.
6. Pages 8–9 test the account against the supervised and Atari evidence, while keeping the full Atari system and its limits visible.
7. Page 10 replays that same chain as an integration exercise.

## Human Review

- Does the seven-stage compression preserve the approved Page 1–10 order and the causal handoffs?
- Is the CORE path sufficient to explain the method without moving a required idea into Hover or Reference Hub?
- Are the conditional classifier and empirical-Fisher explanations clearly marked as general background rather than paper claims?
- Do Pages 8–9 preserve the protocol, system responsibilities, and limitations around each result?
- Does Grand Animation only integrate concepts taught earlier?
- Are the SUPPORTING, REFERENCE, and DELETE items assigned appropriately?

Record the W4 reviewer and decision in `paper.yaml` only after human review. Until then, keep W4 in progress.
