# Learning Spine: Overcoming catastrophic forgetting in neural networks

Paper ID: ewc

**W4 revision status:** this revised spine was approved by 甘文杰, as recorded in `paper.yaml` (note: “学习主线已通过评审”). It incorporates the approved EWC page specifications, workflow, Grand Animation and Hover/Reference specifications, paper model, evidence registry, and the supplied EWC notes.

## Design Authority and Source Boundaries

The EWC human design documents define **what to teach, in what order, and what each page must enable**. The paper model and evidence registry constrain **what can be stated as a paper fact or result**. The user notes help explain dependencies and runtime, but do not override the PDF-backed evidence boundary. CORE/SUPPORTING/REFERENCE/DELETE describe teaching placement; they do not change a claim's source category.

### Source-to-Spine Traceability

| Input | Requirement carried into this spine | W4 mapping |
| --- | --- | --- |
| EWC_Workflow.md | Preserve the approved Page 1–10 order; use the recommended seven-stage causal spine; keep W4 as a human gate; do not redesign the approved teaching path. | S1–S7 and the review questions below. |
| research/paper-model.md | Cover the problem, central idea, required concepts, objects, architecture/ownership, data flow, task-boundary state, training, results, and limits. | S1–S5 cover problem and method; S6 covers both experiments and the Atari system boundary. |
| research/evidence-registry.yaml | Resolve paper claims, results, interpretations, implementation mappings, background, and examples to their separate evidence records. | Every machine-readable item cites registry IDs; new background/runtime records added for the Page 3 and Page 5 design requirements. |
| EWC前置知识.md | Preserve the dependency from network probability and likelihood through prior/posterior, local approximation, Fisher, and the EWC objective. Its empirical-Fisher and MAP details are background unless separately supported by the paper. | S1–S4, with B02/B03/B04/B05 source boundaries visible at the point of use. |
| EWC论文阅读.md | Preserve the task-A training → fixed anchor → Fisher pass → task-B constrained training lifecycle; distinguish replay, task recognition, and EWC in Atari. | S5 and the two S6 experiment items; M01/M03 identify teaching/runtime mappings. |
| Page1_Page2_设计规范.md | Page 1 establishes parameter interference without introducing probability/Bayes/Fisher; Page 2 then derives the ordinary network probability → dataset likelihood → loss chain and leaves p(theta) open. | Two ordered CORE items inside S1; the within-stage order and page boundary are explicit. |
| Page3_Page4_设计规范.md | Page 3 answers why parameters receive a prior and how task-A posterior carries to task B; Page 4 focuses locally around theta_A*, relates width to precision, and hands off the need for Fisher. | S2 then S3; Gaussian-prior/L2 is optional background, not an EWC-paper prescription. |
| Page5_Page6_设计规范.md | Page 5 teaches the selected score-gradient/square/average workflow and a fixed-parameter, optimizer-off estimation mode; Page 6 assembles task-B loss, task-A anchor/Fisher penalty, lambda, and the gradient junction. | S4 contains ordered Page 5 and Page 6 subpaths. The estimator is explicitly marked as background/runtime choice because the PDF does not prescribe that general estimator. |
| Page7_Page8_Page9_设计规范.md | Page 7 places known quantities on a timeline; Page 8 explains the controlled fixed-permutation protocol before results; Page 9 distinguishes Atari system responsibilities, performance evidence, perturbation evidence, and limitations. | S5 and S6. Replay and task recognition are never attributed to EWC. |
| Page10_最终页设计规范.md | Page 10 only recombines knowledge taught on Pages 1–9; it adds no new core concept or experiment. | S7 is integration only. |
| Grand_Animation_Design_Spec.md | Keep the final stage tied to one runtime chain: training, task boundary, anchor, Fisher, EWC objective, combined gradient, and continual loop; keep mathematical views distinct from actual runtime. | S7's exit criterion is a retelling of the same chain, not a second derivation or implementation specification. |
| Hover_ReferenceHub_全站实现规范.md | Main text teaches CORE; hover recalls; expandable details are optional; Reference Hub holds cross-page details/evidence. A reference layer must not compensate for missing mainline teaching. | Supporting and Reference placements below; no CORE item is assigned only to hover or Hub. |

### Reader Assumptions

The intended reader has a computer-science background and has encountered neural networks, parameters, predictions, losses, and gradients. The reader does not need prior knowledge of continual learning, Bayesian learning, Laplace approximation, or Fisher information. The path therefore starts from ordinary training, introduces each new concept only when the prior page has established its inputs, and avoids both childish metaphors and a proof-heavy mathematics treatment.

## Primary Learning Spine

The seven stages preserve the human-approved page order. Pages grouped in one stage retain their own question and handoff; grouping does not merge or reorder their teaching contracts.

| Stage | Pages | Question the reader answers | Handoff |
| --- | --- | --- | --- |
| S1 Problem and ordinary-training foundation | 1–2 | Why can Task B damage Task A, and how do an ordinary network prediction, data likelihood, and loss arise? | Page 1 identifies the shared-parameter conflict; Page 2 explains the training quantities. The reader still needs a probability view over parameters. |
| S2 Bayesian parameter view | 3 | Why introduce p(theta), how does Bayes form p(theta given data), and why does task-A posterior matter for task B? | The previous-task posterior carries information forward, but is too complex to preserve exactly. |
| S3 Local posterior approximation | 4 | What part of the task-A posterior can be retained locally around theta_A*, and what do its narrow and wide directions mean? | A local precision/sensitivity signal is needed in a real network. |
| S4 Fisher to EWC constraint | 5–6 | How is a local sensitivity estimate formed, and how do theta_A* and F_A enter task-B loss and gradient? | The objective is assembled; next put its quantities on the task timeline. |
| S5 Sequential lifecycle | 7 | When are the anchor and Fisher established, what changes during estimation, and how does the next task use them? | The method's runtime sequence can now be checked against experiments. |
| S6 Evidence and boundaries | 8–9 | What does controlled Permuted MNIST show, and what belongs to the complete Atari system rather than EWC alone? | The reader has evidence, system responsibilities, and approximation limits for the final replay. |
| S7 Full-system integration | 10 | Can the reader follow the already-taught concepts through one continuous EWC execution? | Recombine known ideas; introduce no new core claim, estimator, experiment, or implementation rule. |

## Source Boundaries for the Main Path

- **Page 1:** teach the shared-parameter conflict and EWC's differentiated-constraint motivation. Do not introduce p_theta(y|x), p(D|theta), p(theta), posterior, Laplace, Fisher, or the EWC equation here.
- **Page 2:** explain p_theta(y|x) from a classifier forward pass as GENERAL_BACKGROUND (B01), then p(D|theta) and its relation to negative task loss as the paper-supported link (C12). The conditional softmax derivation is not an equation derived by the EWC paper.
- **Page 3:** the Bayes equations and sequential posterior handoff are paper facts (C03, C13). The Gaussian prior/L2 example is optional GENERAL_BACKGROUND (B04); do not present it as the prior prescribed by this paper.
- **Page 4:** teach the local Gaussian around theta_A* and the width/precision intuition (C04, C05). Keep the paper's Fisher-as-approximate-precision rationale distinct from an exact Hessian identity.
- **Page 5:** the page design requires a concrete score-gradient → square → sample aggregation sequence and a fixed-parameter estimation mode. Treat the observed-label per-example empirical-Fisher recipe as selected GENERAL_BACKGROUND (B02, B03) and the no-optimizer-update behavior as a tutorial IMPLEMENTATION_MAPPING (M03). The 2017 PDF does not specify this general estimator.
- **Page 6:** Equation (3) and its components are paper facts (C06); the displayed restoring gradient is a derivative, not a separately printed paper equation (M02). EWC constrains movement; it does not freeze parameters.
- **Page 7:** teach the timeline and saved anchor/Fisher as a runtime representation (M01, M03). Keep the 20-million-frame threshold and task-switch Fisher timing scoped to the reported Atari experiment (C09).
- **Page 8:** present the MNIST task construction and protocol before results (C10, R01); Fisher-overlap is a second-layer analysis, not a training step (R02, I02).
- **Page 9:** identify task recognition, per-task replay, task-specific gains/biases, and EWC as distinct parts of the Atari system (C08). Attribute results to the full reported system (R03); include the perturbation result, its surprising nullspace outcome, and the authors' stated approximation concern (R04, A01, C11). The gap to separate DQNs is also retained (R05, A02).
- **Page 10:** replay previously taught concepts as an integration exercise (T02). Do not add experiment results or teach a new estimator.
- The supplied notes may clarify ordinary training, lifecycle, or experiment explanations; any statement about what the 2017 paper says must remain bounded by the PDF-backed registry.

## Priority Matrix

The YAML block is the machine-readable source for unique content-item IDs, priority, stage, placement, and evidence refs. One content item appears once. CORE/SUPPORTING/REFERENCE/DELETE are pedagogical decisions; evidence refs independently preserve the type and source boundary of each statement.

```yaml
stages:
  - id: S1_problem_and_loss
    pages: "1-2"
    question: "Why can Task B damage Task A, and how do ordinary network predictions lead to the data likelihood and loss used for training?"
    exit: "The reader can explain Page 1's shared-parameter conflict, then trace Page 2's prediction probability to likelihood and negative task loss; the probability background is labeled and p(theta) remains an open question."
  - id: S2_bayesian_parameter_view
    pages: "3"
    question: "Why introduce a prior over parameters, how does Bayes form a posterior, and why does task-A posterior carry into task B?"
    exit: "The reader can distinguish prior, likelihood, and posterior; trace the sequential update; and state that the EWC paper does not prescribe a particular general prior."
  - id: S3_local_posterior_approximation
    pages: "4"
    question: "How can the previous-task posterior be approximated locally around theta_A*, and what do the local widths imply?"
    exit: "The reader can identify the Gaussian approximation's center and the role of local curvature/precision, without equating diagonal Fisher exactly with a full Hessian."
  - id: S4_fisher_to_ewc_constraint
    pages: "5-6"
    question: "How does the Page 5 sensitivity-estimation workflow lead to the Page 6 task-B objective and combined gradient?"
    exit: "The reader can distinguish the selected background estimator from the paper's stated Fisher role, assemble Equation (3), explain F_i versus lambda, and explain why EWC constrains rather than freezes parameters."
  - id: S5_sequential_lifecycle
    pages: "7"
    question: "When are theta_A* and F_A established, what happens during consolidation, and how does task B use the saved quantities?"
    exit: "The reader can trace normal training, a fixed-parameter Fisher pass with optimizer off, the task boundary, and continued training from theta_A* with an EWC term."
  - id: S6_evidence_and_boundaries
    pages: "8-9"
    question: "What do the controlled MNIST and Atari experiments show, and which Atari mechanisms and limits belong to the full system?"
    exit: "The reader can state the fixed-permutation protocol, distinguish the Atari system's responsibilities, and report supported results and caveats within their experimental conditions."
  - id: S7_full_system_integration
    pages: "10"
    question: "Can the reader replay the already-taught probability, posterior, approximation, Fisher, objective, gradient, and lifecycle in one run?"
    exit: "The reader can narrate the full chain; Page 10 introduces no new core knowledge, estimator, experiment, or implementation claim."

items:
  - id: parameter-conflict-and-ewc-question
    title: "Shared-parameter interference and why different parameters need different constraints"
    priority: CORE
    stage: S1_problem_and_loss
    placement: mainline
    evidence_refs: [C01, C02]
  - id: network-likelihood-loss-chain
    title: "Classifier prediction probability, data likelihood, and negative task loss"
    priority: CORE
    stage: S1_problem_and_loss
    placement: mainline
    evidence_refs: [B01, C12]
  - id: sequential-bayesian-posterior
    title: "Task-A posterior becomes the prior contribution for task B"
    priority: CORE
    stage: S2_bayesian_parameter_view
    placement: mainline
    evidence_refs: [C03, C13]
  - id: task-a-local-laplace
    title: "Local Gaussian approximation centered at the task-A solution"
    priority: CORE
    stage: S3_local_posterior_approximation
    placement: mainline
    evidence_refs: [C04]
  - id: posterior-width-and-precision
    title: "Narrow and wide local directions encode different old-task constraints"
    priority: CORE
    stage: S3_local_posterior_approximation
    placement: mainline
    evidence_refs: [C04, C05]
  - id: fisher-estimation-path
    title: "Selected score-gradient, square, and sample-aggregation workflow at fixed theta_A*"
    priority: CORE
    stage: S4_fisher_to_ewc_constraint
    placement: mainline
    evidence_refs: [B02, B03, M03]
  - id: fisher-as-approximate-precision
    title: "Paper-supported Fisher role and the diagonal-approximation boundary"
    priority: CORE
    stage: S4_fisher_to_ewc_constraint
    placement: mainline
    evidence_refs: [C04, C05, C11]
  - id: ewc-objective-assembly
    title: "Task-B loss plus the task-A Fisher-weighted quadratic penalty"
    priority: CORE
    stage: S4_fisher_to_ewc_constraint
    placement: mainline
    evidence_refs: [C06, I01]
  - id: ewc-gradient-junction
    title: "Task-B and EWC gradients combine before the optimizer update"
    priority: CORE
    stage: S4_fisher_to_ewc_constraint
    placement: mainline
    evidence_refs: [M02]
  - id: task-boundary-lifecycle
    title: "Train, save the anchor, estimate Fisher, then learn the next task under the old constraint"
    priority: CORE
    stage: S5_sequential_lifecycle
    placement: mainline
    evidence_refs: [C07, C09, M01, M03]
  - id: permuted-mnist-protocol-and-result
    title: "Fixed pixel permutations, comparison protocol, and reported retention/plasticity evidence"
    priority: CORE
    stage: S6_evidence_and_boundaries
    placement: mainline
    evidence_refs: [C10, R01]
  - id: atari-system-responsibilities
    title: "EWC's long-timescale role beside task recognition, task-specific modulation, and replay"
    priority: CORE
    stage: S6_evidence_and_boundaries
    placement: mainline
    evidence_refs: [C08, R03]
  - id: atari-diagnostic-and-limits
    title: "Continual Atari evidence, Fisher perturbation, nullspace caveat, and gap to separate DQNs"
    priority: CORE
    stage: S6_evidence_and_boundaries
    placement: mainline
    evidence_refs: [R03, R04, R05, A01, A02, C11]
  - id: grand-animation-integration
    title: "Recombine previously taught EWC concepts in the final runtime replay"
    priority: CORE
    stage: S7_full_system_integration
    placement: mainline
    evidence_refs: [T02, M01, M02]

  - id: parameter-contour-example
    title: "Small illustrative parameter-space comparison"
    priority: SUPPORTING
    stage: S1_problem_and_loss
    placement: expandable
    evidence_refs: [T01]
  - id: softmax-and-cross-entropy-detail
    title: "Optional classifier-output and cross-entropy detail"
    priority: SUPPORTING
    stage: S1_problem_and_loss
    placement: expandable
    evidence_refs: [B01]
  - id: gaussian-prior-l2-link
    title: "Gaussian prior and L2 regularization as a general MAP example"
    priority: SUPPORTING
    stage: S2_bayesian_parameter_view
    placement: expandable
    evidence_refs: [B04]
  - id: bayes-evidence-normalizer
    title: "Full Bayes denominator and normalization detail"
    priority: SUPPORTING
    stage: S2_bayesian_parameter_view
    placement: expandable
    evidence_refs: [C13]
  - id: laplace-taylor-and-hessian-detail
    title: "Optional Taylor, Hessian, covariance, and precision notation"
    priority: SUPPORTING
    stage: S3_local_posterior_approximation
    placement: expandable
    evidence_refs: [C04, C05]
  - id: fisher-estimator-source-boundary
    title: "Immediate caveat that the Page 5 estimator is selected background, not a paper-specified recipe"
    priority: SUPPORTING
    stage: S4_fisher_to_ewc_constraint
    placement: compact-inline
    evidence_refs: [B02, B03]
  - id: fisher-kl-local-metric
    title: "Optional local KL interpretation of Fisher"
    priority: SUPPORTING
    stage: S4_fisher_to_ewc_constraint
    placement: expandable
    evidence_refs: [B05]
  - id: reported-atari-fisher-timing
    title: "Task-switch Fisher computation and the reported 20-million-frame threshold"
    priority: SUPPORTING
    stage: S5_sequential_lifecycle
    placement: expandable
    evidence_refs: [C09]
  - id: mnist-fisher-overlap
    title: "Fisher-overlap analysis for the reported permutation settings"
    priority: SUPPORTING
    stage: S6_evidence_and_boundaries
    placement: expandable
    evidence_refs: [R02, I02]
  - id: fixed-capacity-tradeoff
    title: "Qualitative stability-plasticity pressure in a fixed-capacity model"
    priority: SUPPORTING
    stage: S6_evidence_and_boundaries
    placement: compact-inline
    evidence_refs: [I03]
  - id: same-label-space-boundary
    title: "What the fixed 0–9 Permuted-MNIST output space does not test"
    priority: SUPPORTING
    stage: S6_evidence_and_boundaries
    placement: compact-inline
    evidence_refs: [C10]
  - id: detailed-atari-settings
    title: "Reported Atari settings beyond the main responsibility map"
    priority: SUPPORTING
    stage: S6_evidence_and_boundaries
    placement: expandable
    evidence_refs: [C09, R03]

  - id: atari-task-recognition-details
    title: "Task-recognition model and context-inference details"
    priority: REFERENCE
    stage: null
    placement: Reference Hub
    evidence_refs: [C08]
  - id: per-game-atari-curves
    title: "Appendix per-game Atari curves"
    priority: REFERENCE
    stage: null
    placement: Evidence details
    evidence_refs: [R06]
  - id: full-experiment-settings
    title: "Detailed MNIST and Atari protocols and appendix settings"
    priority: REFERENCE
    stage: null
    placement: Reference Hub
    evidence_refs: [C09, C10, R03, R04]
  - id: full-fisher-matrix-limit
    title: "Full Fisher notation, off-diagonal coupling, and diagonal approximation details"
    priority: REFERENCE
    stage: null
    placement: Advanced details
    evidence_refs: [B03, C11]
  - id: extended-bayes-laplace-notation
    title: "Full Bayesian, Laplace, and Fisher notation for later lookup"
    priority: REFERENCE
    stage: null
    placement: Advanced details
    evidence_refs: [C03, C04, C05, C13, B03, B05]
  - id: runtime-state-and-id-mapping
    title: "Teaching state schema, stable IDs, and animation/runtime mappings"
    priority: REFERENCE
    stage: null
    placement: Implementation notes
    evidence_refs: [M01, M03, T02]

  - id: softmax-presented-as-ewc-derivation
    title: "Claiming that the EWC paper derives the tutorial's conditional softmax classifier"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [B01, C12]
  - id: empirical-fisher-presented-as-paper-recipe
    title: "Claiming that the EWC paper specifies the observed-label per-example gradient-square estimator"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [B02, B03]
  - id: ewc-as-parameter-freezing
    title: "Claiming that EWC freezes high-Fisher parameters"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [C06, M02]
  - id: ewc-as-replay-or-task-discovery
    title: "Claiming that EWC replaces replay or discovers tasks in the Atari system"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [C08]
  - id: atari-outcome-attributed-to-ewc-alone
    title: "Attributing the complete Atari outcome to EWC alone"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [C08, R03, R05]
  - id: full-dqn-course
    title: "Full Bellman/DQN derivation unrelated to the EWC learning spine"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [C08]
  - id: new-concept-in-grand-animation
    title: "Introducing a new core concept for the first time in Page 10"
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: [T02]
```

## Stage-to-Page Contracts

- **S1 / Page 1 then Page 2:** Page 1 exits with the question “which parameters can move more or less?” and contains no probability/Bayesian/Fisher notation. Page 2 then shows forward → logits → p_theta(y|x) → p(D|theta) → log likelihood/NLL → loss/gradient/update. The softmax classifier is background. Page 2 ends with p(theta) unanswered.
- **S2 / Page 3:** reopen the probability-origin question, define prior/likelihood/posterior, show the sequential task-A-to-task-B update, and leave complete-posterior tractability as the Page 4 question. The Gaussian-prior example stays optional and explicitly general.
- **S3 / Page 4:** focus on theta_A*, approximate only the local task-A posterior, explain narrow/wide directions, and end by asking for a computable sensitivity measure. Do not teach Fisher's estimator or EWC's objective yet.
- **S4 / Page 5 then Page 6:** Page 5 reaches theta_A* and F_A via the specified estimator walkthrough and distinguishes Fisher estimation from model training. Page 6 starts from sequential Bayes, constructs L_B plus the quadratic old-task constraint, separates parameter-wise F_i from global lambda, and ends at the combined-gradient junction. The empirical-Fisher recipe is never attributed to the 2017 paper.
- **S5 / Page 7:** return to runtime; show normal training, task boundary, frozen anchor, Fisher estimation with optimizer off, stored task state, continuation from theta_A*, and the repeated A→B→C lifecycle. Do not recalculate the whole derivation.
- **S6 / Pages 8–9:** Page 8 explains dataset/task construction and protocol before reading baseline and retention/plasticity results. Page 9 starts from the RL loop, then the system responsibility map and separate time scales, then continual performance, Fisher perturbation evidence, nullspace failure, and supported limits.
- **S7 / Page 10:** the Grand Animation is the integration layer. Runtime and Mathematical View remain distinct; no MNIST/Atari experiments, new method, estimator, or theory is introduced.

## Reader's Causal Path

1. Page 1 establishes the problem: a later task changes the same parameters an earlier task depends on, so “freeze everything” is not the solution.
2. Page 2 supplies the ordinary training objects that make that conflict concrete: a network prediction, its data likelihood, and the loss that updates theta. It leaves parameter probability unanswered.
3. Page 3 changes the question from “how likely is this data under theta?” to “which theta values remain plausible after this task?”, then carries the task-A posterior toward task B.
4. Page 4 makes that old posterior locally usable around the learned solution and turns its shape into a need for a computable sensitivity signal.
5. Page 5 introduces the selected sensitivity-estimation walkthrough; Page 6 uses the paper's Fisher-weighted quadratic objective and its derived gradient to constrain task-B updates.
6. Page 7 puts the known quantities on the timeline: train A, consolidate before leaving its data, continue from the same learned model on B, and repeat at later boundaries.
7. Pages 8–9 test this account in a controlled supervised setting and a more complex Atari system, separating EWC's contribution from surrounding mechanisms and retaining the evidence limits.
8. Page 10 replays the same chain as one system without adding a new teaching obligation.

## Human Review

- Does the spine preserve the approved Page 1–10 order and each page's entry/exit contract?
- Does Page 1 avoid introducing the probability and Fisher material reserved for Page 2 and later?
- Does the Page 2→3 handoff leave p(theta) as a real question?
- Does Page 4 teach only the local posterior view before handing off to Fisher?
- Is the Page 5 selected estimator unmistakably labeled as background/implementation detail rather than as an estimator specified by the paper?
- Does Page 6 distinguish F_i, lambda, the task-B loss, and the restoring gradient without saying parameters are frozen?
- Does Page 7 preserve the task-boundary timing, fixed anchor, optimizer-off Fisher pass, and same-model continuation?
- Do Pages 8–9 preserve protocol, system responsibilities, reported result conditions, and limitations?
- Does Hover/Reference remain secondary to first teaching in the main path?
- Does Page 10 only integrate concepts already taught?
- Are the SUPPORTING, REFERENCE, and DELETE choices appropriate?

W4 review record: 甘文杰 — PASS (“学习主线已通过评审”), recorded in `paper.yaml`. W7 remains pending until a human reviews the implemented vertical slice.
