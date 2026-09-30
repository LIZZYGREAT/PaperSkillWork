# Implementation Plan: Overcoming catastrophic forgetting in neural networks

Paper ID: ewc

## Learning Goal and Non-goals

W8 must let a first-time reader reconstruct why sequential updates can damage earlier tasks, how ordinary network probabilities lead to a task loss, why the previous-task posterior matters, how EWC approximates that constraint locally, when the anchor and Fisher are formed, how the EWC term changes Task-B updates, and what the MNIST and Atari evidence does and does not establish.

The approved ten-page teaching order remains unchanged. Pages 1–9 teach each concept for the first time; Page 10 integrates those concepts in the Grand Animation. The implementation plan chooses visuals and interactions only where they clarify a relationship or let the reader inspect an important state.

This plan does not add a continual-learning survey, a full DQN course, a general probability course, a new estimator claim, experiments to Page 10, a complete Reference Hub glossary before the page copy is stable, or any page implementation before W7 passes.

## Primary Spine Mapping

The YAML below is the sole machine-readable source for implementation coverage. Every CORE item is assigned exactly once. The grouped stages preserve the distinct page contracts inside them.

```yaml
implementation:
  stages:
    - id: S1_problem_and_loss
      page: "1–2"
      core_items:
        - parameter-conflict-and-ewc-question
        - network-likelihood-loss-chain
      evidence_refs: [C01, C02, B01, C12]
      primary_vehicle: "Page 1 shared-parameter conflict and two-parameter comparison, followed by Page 2 forward-to-likelihood-to-loss flow and fixed-data parameter comparison."
      reusable_pattern: CompareView
      reason: "The visual handoff keeps the human-designed boundary: Page 1 introduces no probability or Fisher notation; Page 2 starts from a forward pass, derives the data likelihood and loss, and leaves p(theta) unanswered. Figure 1 is used intact as the paper's mechanism overview."
    - id: S2_bayesian_parameter_view
      page: "3"
      core_items:
        - sequential-bayesian-posterior
      evidence_refs: [C03, C13]
      primary_vehicle: "Bayes box followed by a Task-A-to-Task-B posterior flow, with a small candidate-parameter view showing how evidence changes the distribution."
      reusable_pattern: FlowStepper
      reason: "The reader sees prior, likelihood, and posterior in context, then follows the previous-task posterior into the next update. The optional Gaussian-prior/L2 example remains expandable background."
    - id: S3_local_posterior_approximation
      page: "4"
      core_items:
        - task-a-local-laplace
        - posterior-width-and-precision
      evidence_refs: [C04, C05]
      primary_vehicle: "A custom two-dimensional posterior contour that focuses from the global distribution to theta_A* and lets the reader compare equal-sized moves along narrow and wide local directions."
      reusable_pattern: CompareView
      reason: "The contour and focus transition are specific to the approved Laplace explanation, so CompareView is only a secondary comparison aid. The page stops at local shape and precision, then hands off the need for a computable sensitivity signal."
    - id: S4_fisher_to_ewc_constraint
      page: "5–6"
      core_items:
        - fisher-estimation-path
        - fisher-as-approximate-precision
        - ewc-objective-assembly
        - ewc-gradient-junction
      evidence_refs: [B02, B03, M03, C04, C05, C11, C06, I01, M02]
      primary_vehicle: "Page 5 same-network Fisher-estimation sequence and training-versus-estimation comparison, followed by Page 6 stepwise EWC penalty assembly and the task-gradient/EWC-gradient junction."
      reusable_pattern: FlowStepper
      reason: "Page 5 holds the model at theta_A*, accumulates the selected estimate with gradients enabled and optimizer.step disabled, and labels the empirical-Fisher recipe as background rather than as a recipe specified by the 2017 paper. Page 6 distinguishes F_A,i from lambda and shows that EWC constrains updates without freezing parameters."
    - id: S5_sequential_lifecycle
      page: "7"
      core_items:
        - task-boundary-lifecycle
      evidence_refs: [C07, C09, M01, M03]
      primary_vehicle: "Horizontal task lifecycle with a visibly wide task-boundary region, three operating modes, and a synchronized active-state table."
      reusable_pattern: ProcessLoopExplorer
      reason: "The timeline makes training, consolidation, and next-task training distinct, including which data are available, whether parameters move, and which saved state is read. The repeated A-to-B-to-C cycle stays simpler than Page 10's spatial workbench."
    - id: S6_evidence_and_boundaries
      page: "8–9"
      core_items:
        - permuted-mnist-protocol-and-result
        - atari-system-responsibilities
        - atari-diagnostic-and-limits
      evidence_refs: [C10, R01, C08, R03, R04, R05, A01, A02, C11]
      primary_vehicle: "Protocol-before-results evidence reading for Permuted MNIST, then an Atari responsibility map with the full Figure 3 evidence and explicit result boundaries."
      reusable_pattern: ResponsibilityMap
      reason: "Page 8 establishes fixed task permutations and comparison conditions before reading Figure 2. Page 9 separates the RL loop, task recognition, task-specific modulation, replay, and EWC, then distinguishes system-level performance from the Fisher perturbation diagnostic and its limitation."
    - id: S7_full_system_integration
      page: "10"
      core_items:
        - grand-animation-integration
      evidence_refs: [T02, M01, M02]
      primary_vehicle: "The approved 2D wide workbench with Runtime and Mathematical Views, central teaching network, parameter blocks, persistent memory, formula-to-runtime links, gradient junction, and the 18-state cognitive state machine."
      reusable_pattern: null
      reason: "The approved camera, semantic zoom, memory rail, formula links, and Grand Replay need a paper-specific composition. Reusable state-machine primitives may inform data structure, but do not replace the designed workbench or alter its 18 states. Page 10 introduces no new core teaching or experiment."
  assets:
    - asset: EWC-F1
      stage: S1_problem_and_loss
      rendering: crop
    - asset: EWC-F2
      stage: S6_evidence_and_boundaries
      rendering: crop
    - asset: EWC-F3
      stage: S6_evidence_and_boundaries
      rendering: crop
  supporting:
    - item: parameter-contour-example
      placement: expandable
    - item: softmax-and-cross-entropy-detail
      placement: expandable
    - item: gaussian-prior-l2-link
      placement: expandable
    - item: bayes-evidence-normalizer
      placement: expandable
    - item: laplace-taylor-and-hessian-detail
      placement: expandable
    - item: fisher-estimator-source-boundary
      placement: compact-inline
    - item: fisher-kl-local-metric
      placement: expandable
    - item: reported-atari-fisher-timing
      placement: expandable
    - item: mnist-fisher-overlap
      placement: expandable
    - item: fixed-capacity-tradeoff
      placement: compact-inline
    - item: same-label-space-boundary
      placement: compact-inline
    - item: detailed-atari-settings
      placement: expandable
  reference:
    - item: atari-task-recognition-details
      placement: Reference Hub
    - item: per-game-atari-curves
      placement: Evidence details
    - item: full-experiment-settings
      placement: Reference Hub
    - item: full-fisher-matrix-limit
      placement: Advanced details
    - item: extended-bayes-laplace-notation
      placement: Advanced details
    - item: runtime-state-and-id-mapping
      placement: Implementation notes
  vertical_slice:
    stages: [S1_problem_and_loss, S4_fisher_to_ewc_constraint]
    required_core_items:
      - parameter-conflict-and-ewc-question
      - fisher-estimation-path
      - fisher-as-approximate-precision
      - ewc-objective-assembly
      - ewc-gradient-junction
    pages: [1, 5, 6]
    source_figures: [EWC-F1]
    learner_task: "Explain the shared-parameter conflict, trace how the selected Fisher estimate is formed at a fixed anchor, then identify how the Fisher-weighted constraint joins the Task-B gradient."
    reviewable_without: "A reviewer can judge the problem framing, runtime visual language, estimator-versus-training distinction, formula readability, and formula-to-runtime mapping without the remaining pages or the Grand Animation."
```

## Source-to-Plan Traceability

The EWC documents define the teaching and interaction intent. The paper model and evidence registry constrain claims. The two notes help explain prerequisites and runtime sequence; they do not override paper evidence.

| Design source | W5 constraint carried into this plan |
| --- | --- |
| EWC_Workflow.md | Preserve the approved Page 1–10 order, create the W6 representative slice around Page 1, Page 5 Fisher estimation, and Page 6 objective/gradient, and freeze the interface contract before W6 code. |
| Page1_Page2_设计规范.md | Page 1 stays at shared-parameter conflict; Page 2 begins at network forward and explains probability, data likelihood, NLL/loss, update, and the open p(theta) question. |
| Page3_Page4_设计规范.md | Page 3 uses a Bayes box and sequential posterior handoff; Page 4 focuses locally on theta_A*, shows narrow/wide directions, and ends by motivating Fisher without teaching its estimator. |
| Page5_Page6_设计规范.md | Page 5 uses the same network, fixed theta_A*, score-gradient/square/sample-aggregation path, and a clear optimizer-off mode. Page 6 assembles the penalty one part at a time and ends at the gradient junction. The empirical estimator remains labeled background. |
| Page7_Page8_Page9_设计规范.md | Page 7 is a timeline and mode navigator; Page 8 presents protocol before results; Page 9 maps system responsibilities and evidence boundaries, including replay, task recognition, and Fisher perturbation. |
| Page10_最终页设计规范.md | Page 10 has a narrow header, a knowledge recall strip, a dominant Grand Animation, lightweight phase orientation, one-time orientation overlay, final summary, and replay/explore exits; experiments do not return on this page. |
| Grand_Animation_Design_Spec.md | Preserve the wide 2D workbench, camera model, Runtime/Mathematical View distinction, parameter-aligned memory, formula linking, playback behavior, Grand Replay, accuracy boundaries, and all 18 cognitive states. |
| Hover_ReferenceHub_全站实现规范.md | Freeze canonical IDs and one registry/API shared by inline references, symbols, formulas, the Hub, page anchors, runtime objects, and animation states. Mainline teaching remains in page content. |
| research/paper-model.md and research/evidence-registry.yaml | Every planned core item is tied to evidence IDs; results remain within their conditions and full-system Atari evidence is not attributed to EWC alone. |
| EWC前置知识.md and EWC论文阅读.md | Use the probability-to-objective prerequisites and the train/boundary/estimate/next-task sequence as explanatory checks only; source claims continue to follow the evidence registry. |

## Asset and Rights Plan

Use the three W3-selected source figures as intact figures, cropped only to the figure bounds already recorded in the asset plan. Do not crop out panels, repaint marks, alter labels, or place annotations over source pixels. Put any teaching annotations beside the figure and identify them as tutorial annotations. Add descriptive alt text and the complete attribution from the asset plan.

| Asset | Placement | W5 rendering | Teaching use |
| --- | --- | --- | --- |
| EWC-F1 / Figure 1 | Page 1, S1 | crop | Show the paper's parameter-space contrast among Task-B-only updates, uniform constraint, and EWC. Keep the page's first explanation focused on the forgetting conflict. |
| EWC-F2 / Figure 2 | Page 8, S6 | crop | Show all panels after the task construction and comparison protocol. Use the Fisher-overlap panel only as a secondary analysis, not as a training step. |
| EWC-F3 / Figure 3 | Page 9, S6 | crop | Show all panels while separating the Atari schedule/system results from the single-game perturbation diagnostic. Preserve the paper's system-level attribution and caveats. |

The W3 asset plan records noncommercial educational reuse with full journal citation under the publisher's stated policy. Preserve that purpose and attribution in the tutorial. The PDF stays internal and is not included in the exported site. W8 creates the web derivative and README provenance; W8/W10 verify both project and export copies. If the distribution or use becomes commercial, replace the original figures with redraws or obtain permission before release.

## Page Implementation Decisions

These are implementation decisions, not a replacement page specification.

1. **Page 1 — Why EWC:** Keep the opening to the specified short scenario. Use Figure 1 and a small shared-model sequence to show that Task B changes the same parameters Task A depends on. A compact two-parameter compare may reveal different old-task sensitivity. Do not show probability, Bayes, posterior, Laplace, Fisher, or the EWC equation.
2. **Page 2 — Probability, likelihood, loss:** Start with input → network → logits → softmax probability. Continue through a true-label probability, per-sample loss, dataset likelihood under the stated independent-sample setup, log likelihood/NLL, gradient, and update. Let the reader compare parameter states while D stays fixed. End with p(theta) unresolved; do not start Bayes here.
3. **Page 3 — Prior, Bayes, posterior:** Connect prior and likelihood in the Bayes box, then use a short sequential update from D_A to D_B. Show the posterior changing its weight over a few illustrative parameter candidates. Keep Gaussian-prior/L2 optional and labeled general background. End with the difficulty of retaining a full high-dimensional posterior.
4. **Page 4 — Laplace:** Focus the view from the complex posterior onto theta_A*. Use an explicitly illustrative 2D slice of the high-dimensional parameter space and equal-sized movement along narrow and wide directions. Reveal local curvature/precision after the geometry. Do not equate diagonal Fisher with an exact Hessian or teach the estimator yet.
5. **Page 5 — Fisher:** Reuse the same model representation introduced earlier. Sequence fixed theta_A* → sample probability → log-probability score gradient → square → sample aggregation → F_A. Compare normal training with Fisher estimation: gradients are computed, optimizer.step is off, and parameters do not move. Keep the chosen empirical-Fisher estimator and runtime mode labeled as background/implementation mapping, not as a general recipe specified in the paper.
6. **Page 6 — Objective and gradient:** Begin from the sequential Bayesian handoff, show L_B, then assemble displacement from theta_A*, squared displacement, parameter-wise F_A,i weighting, summation, and global lambda. Link formula symbols to the same runtime/reference IDs. Finish at the Task-B plus EWC gradient junction before the optimizer update. EWC constrains movement; it does not freeze parameters.
7. **Page 7 — Lifecycle:** Use a horizontal timeline with a substantial task-boundary region, three modes, and an active-state table. Make current data, theta movement, anchor, Fisher, gradient, and optimizer status visible. Keep this an algorithm navigator; reserve the detailed camera workbench for Page 10.
8. **Page 8 — Permuted MNIST:** Establish MNIST, one fixed pixel permutation per task, unchanged labels, protocol, and baselines before exposing results. Display the full Figure 2. Read forgetting and plasticity separately; put Fisher overlap after the main result and label it analysis rather than a training step.
9. **Page 9 — Atari:** Start from the minimal environment/observation/action/reward/learning loop, then use a responsibility map to distinguish the Q-network, short-timescale replay, task recognition, task-specific gains/biases, and long-timescale EWC. Display all of Figure 3 and separate system-level performance from the perturbation diagnostic, nullspace caveat, and gap to separate DQNs.
10. **Page 10 — Integration:** Keep the page close to full-screen, with a narrow header and the approved recall strip. Show a one-time orientation overlay, phase indicator, current-state explanation, and on-demand details. The Grand Animation remains the focus; the final state offers Replay Full Execution and Explore Timeline. Do not introduce experiments or first-teach a concept here.

## Reusable Pattern Library

Reusable patterns are implementation aids, not constraints on the approved design. The continual-learning preset will copy the P0 sources into the EWC project. The two selected P1 sources are listed with the plan and copied with the scaffold command. EWC imports only its local copies.

| Pattern | Source | Planned use and adaptation |
| --- | --- | --- |
| CompareView | reusable-kit/optional/compare-view | Page 1 compares the two representative parameter changes; Page 4 may reuse its comparison presentation beside the custom contour. Do not add numeric controls or a parameter calculator. |
| FlowStepper | reusable-kit/core/flow-stepper | Page 2 probability-to-loss chain, Page 3 sequential Bayes handoff, and the ordered Page 5 estimation explanation. Keep each page's own start/end boundary. |
| ProcessLoopExplorer | reusable-kit/core/process-loop | Page 7 task lifecycle and A→B→C repetition; keep its states simpler than the Grand Animation. |
| ResponsibilityMap | reusable-kit/core/responsibility-map | Page 9 ownership map for EWC and the surrounding Atari mechanisms. |
| PaperFigure | reusable-kit/core/paper-figure | Render EWC-F1/F2/F3 with source captions, accessible alt text, and separate attribution. No source pixels are annotated. |
| EvidenceViewer | reusable-kit/optional/evidence-viewer | Page 8/9 read mode for claim → experiment → observed evidence → interpretation → boundary. Do not use its verdict/judge mode as a quiz. |
| ReferenceHub, TermRef, ExpandableDetail, StateMachineExplorer, ArchitectureExplorer, Foundation controls/overlays, and other continual-learning P0 sources | reusable-kit/registry.yaml continual-learning preset | Available as local source for the approved Reference shell and suitable page details. Their presence does not require use where they do not fit. StateMachineExplorer does not replace the Grand Animation workbench. |

FormulaBlock is deliberately not selected. Its current implementation renders the equation as plain code and puts selectable terms in a separate list; that does not meet the approved requirement for properly rendered equations, symbol-level references, and formula-to-runtime highlighting. W6 should build the smallest EWC formula view that satisfies those contracts rather than distort Page 6 or the Grand Animation around this component.

The selected P1 components are CompareView and EvidenceViewer. The W5 source-copy command is:

~~~powershell
python tools/paper.py scaffold-kit ewc --preset continual-learning --add CompareView,EvidenceViewer
~~~

This copies sources only. Page components, page content, Reference data, animation states, and the formula renderer remain W6/W8 work.

## Vertical Slice (W6)

The W6 slice follows the EWC workflow's representative cross-section rather than implementing the opening pages consecutively:

- **Page 1 / S1:** parameter interference and why different parameters need different constraints;
- **Page 5 / S4:** how the selected Fisher estimate is formed at fixed theta_A* and why estimation does not update parameters;
- **Page 6 / S4:** how F_A and theta_A* enter the penalty and how its gradient joins the Task-B gradient.

The slice includes Figure 1, the shared network/parameter visual language, one complete estimator-to-objective flow, the EWC symbol/runtime mapping, and only the minimal Reference shell needed to exercise a concept link. It does not implement Page 2–4, Page 7–9, the Grand Animation, or the complete Hub content. W7 must judge learning, spatial architecture, prose load, formula clarity, and whether each interaction earns its place before W8 begins.

### Vertical Slice Review (W7)

Vertical Slice Review: PENDING

- Reviewer:
- Decision: PASS / REVISE
- Can the reviewer explain the problem and core idea after using the slice?
- Can the reviewer reconstruct the architecture and one complete information/state flow?
- Was any key explanation hidden in hover or omitted?
- Were any formulas, toys, or interactions unnecessary?
- Required information-architecture changes:

## Full Implementation (W8)

W8 starts only after a human records W7 PASS. Complete the remaining CORE content in the approved order:

- Finish Page 2's network-likelihood-loss chain from S1.
- Implement S2 and S3: sequential Bayes, then the local Laplace approximation.
- Complete S5's task-boundary lifecycle.
- Complete S6's protocol-first Permuted-MNIST evidence and bounded Atari system/evidence explanation.
- Implement S7 / Page 10 last, using the frozen 18-state contract and Grand Animation specification.
- Add compact SUPPORTING placements and REFERENCE items in the planned locations as pages stabilize; complete cross-links and evidence details after the main pages stabilize.
- Keep every DELETE item out of the tutorial.

Page 10 / Grand Animation is the final implementation batch. Experiments remain on Pages 8–9; full Reference Hub content and Grand Animation links are completed after the main page content is stable.

## Implementation Contracts

### Contract status

**W5.5 interface contract: FROZEN in this document before W6 page implementation.** W5.5 is a required execution step, not a separate Workflow stage.

W5 freezes names and data relationships. W6 will implement and validate the TypeScript types and behavior; it may not silently rename contracts during page work. If a frozen ID or behavior must change because of a concrete technical conflict, update this section and all affected references together before adding dependent page code. No second contract document is created.

### Page IDs

| Page | Frozen ID |
| --- | --- |
| 1 — Why EWC | page-01-problem |
| 2 — Probability, Likelihood, Loss | page-02-probability |
| 3 — Prior, Bayes, Posterior | page-03-bayes |
| 4 — Laplace | page-04-laplace |
| 5 — Fisher | page-05-fisher |
| 6 — EWC Objective and Gradient | page-06-ewc-objective |
| 7 — Lifecycle | page-07-lifecycle |
| 8 — Permuted MNIST | page-08-mnist |
| 9 — Atari | page-09-atari |
| 10 — Grand Animation | page-10-grand-animation |

### Section anchors

All anchor IDs are globally unique, lowercase kebab-case, and stable. A page-target record uses both the frozen page ID and an optional anchor ID.

| Page ID | Frozen anchor IDs |
| --- | --- |
| page-01-problem | problem-context, parameter-conflict, ewc-motivation |
| page-02-probability | forward-probability, likelihood-origin, likelihood-comparison, loss-and-update, probability-source-table |
| page-03-bayes | prior-likelihood-posterior, parameter-belief-update, sequential-update |
| page-04-laplace | posterior-global-to-local, laplace-local-view, narrow-wide-directions, fisher-handoff |
| page-05-fisher | fisher-estimation, score-gradient, square-and-aggregate, training-vs-estimation, fisher-role |
| page-06-ewc-objective | ewc-objective, penalty-components, gradient-junction |
| page-07-lifecycle | training-modes, task-boundary, active-state-table, task-a-to-b-to-c |
| page-08-mnist | permuted-mnist-task, protocol-before-results, forgetting-and-plasticity, fisher-overlap |
| page-09-atari | atari-rl-loop, system-responsibilities, replay-timescale, atari-evidence-limits |
| page-10-grand-animation | grand-animation, full-execution-replay |

### Canonical Reference IDs

IDs use one global namespace: lowercase snake_case for concepts, symbols, formulas, and evidence references. Repeated appearances in prose, equations, Hub entries, runtime objects, and animation states resolve to the same ID.

| Reference group | Frozen IDs |
| --- | --- |
| Learning concepts | continual_learning, catastrophic_forgetting, parameter_interference, ewc, normal_training, likelihood, negative_log_likelihood, prior, posterior, sequential_bayes, laplace_approximation, local_precision, fisher_information, fisher_estimation, consolidation, task_boundary, optimizer_step |
| Network/data objects | neural_network, p_theta_y_given_x, p_D_given_theta, p_theta, p_theta_given_D, task_a_posterior, task_b_posterior, task_a_data, task_b_data, task_a_loss |
| EWC symbols/formulas | theta, theta_a_star, fisher_a, fisher_a_i, lambda_ewc, task_a_gradient, task_b_loss, ewc_penalty, ewc_objective, task_b_gradient, ewc_gradient, total_gradient |
| Experiments/system | permuted_mnist, atari, replay, task_recognition, task_specific_modulation, fisher_perturbation, grand_animation |
| Source/implementation distinctions | empirical_fisher_estimator_background, diagonal_fisher_limit, task_state_mapping |

Every populated Reference item records its source category and sourceRefs. The allowed source categories are PAPER_FACT, PAPER_RESULT, AUTHOR_INTERPRETATION, GENERAL_BACKGROUND, MECHANISM_INTERPRETATION, IMPLEMENTATION_MAPPING, TEACHING_EXAMPLE, and LIMITATION. In particular, the chosen observed-label empirical-Fisher walkthrough is GENERAL_BACKGROUND; the fixed-parameter, optimizer-off tutorial mode is IMPLEMENTATION_MAPPING. Neither is mislabeled as a general estimator specified by the paper.

### Reference Registry schema

The W6 registry is a single EWC-owned data source; reusable-kit reference code supplies behavior only. Terms, symbols, formulas, evidence, and implementation objects all share the same canonical ID namespace.

~~~ts
type ReferenceKind =
  | "term" | "symbol" | "formula" | "dataset" | "environment"
  | "method" | "phase" | "evidence" | "confusion"
  | "implementation" | "advanced";

type SourceCategory =
  | "PAPER_FACT" | "PAPER_RESULT" | "AUTHOR_INTERPRETATION"
  | "GENERAL_BACKGROUND" | "MECHANISM_INTERPRETATION"
  | "IMPLEMENTATION_MAPPING" | "TEACHING_EXAMPLE" | "LIMITATION";

type PageTarget = { pageId: PageId; anchorId?: AnchorId };
type ReferenceDetail = { label: string; text: string; sourceRefs?: string[] };

type ReferenceItem = {
  id: CanonicalReferenceId;
  kind: ReferenceKind;
  title: string;
  fullName?: string;
  summary: string;
  role: string;
  roleInEWC?: string;
  confusion?: string;
  sourceCategory?: SourceCategory;
  sourceRefs?: string[];
  relatedIds?: CanonicalReferenceId[];
  relatedPages?: PageTarget[];
  relatedAnimationStates?: GrandAnimationStateId[];
  tags?: string[];
  keywords?: string[];
  boundary?: string;
  details?: ReferenceDetail[];
};

type TermReference = ReferenceItem & {
  kind: "term";
  definition: string;
  paperRole?: string;
};

type SymbolReference = ReferenceItem & {
  kind: "symbol";
  symbol: string;
  meaning: string;
  createdWhen?: string;
  usedWhen?: string;
  runtimeObject?: RuntimeObjectId;
  typicalShape?: string;
  trainable?: string;
  gradientSource?: string;
  optimizerMembership?: string;
};

type FormulaReference = ReferenceItem & {
  kind: "formula";
  expression: string;
  meaning: string;
  variables: CanonicalReferenceId[];
  derivationFrom?: CanonicalReferenceId[];
  runtimeMapping?: RuntimeObjectId[];
  usedIn?: PageId[];
};

type EvidenceReference = ReferenceItem & {
  kind: "evidence";
  claim: string;
  experiment: string;
  observedEvidence: string[];
  interpretation: string;
  boundary: string;
  sourceLocator: string;
};
~~~

The required role field records the item's role in the method or learning path, matching the W5.5 workflow field name. The source-category vocabulary follows the Hover/Reference specification and the evidence registry boundaries.

role is the concise required role field from the Workflow; roleInEWC is the optional EWC-specific refinement used by the Hover/Reference design when that distinction helps.

The structured page targets extend the design document's page/anchor navigation example, so one Registry entry can link to a stable page and section rather than relying on page numbers alone. Evidence records keep claim, experiment, observation, interpretation, boundary, and source locator distinct.

### Reference API and interaction behavior

The names below are frozen for W6:

~~~ts
<ReferenceRef id="fisher_information">Fisher Information</ReferenceRef>
<TermRef id="posterior">Posterior</TermRef>
<SymbolRef id="theta_a_star">θ_A*</SymbolRef>
<FormulaRef id="ewc_objective">...</FormulaRef>

type OpenReferenceTarget = {
  referenceId?: CanonicalReferenceId;
  pageId?: PageId;
  anchorId?: AnchorId;
  animationStateId?: GrandAnimationStateId;
};

function openReference(target: OpenReferenceTarget): void;

function openHub(referenceId?: CanonicalReferenceId): void;
function closeHub(): void;
~~~

- Hover and keyboard focus show a short recall preview; click pins/opens it. On touch, tap opens it.
- An explicit page/anchor target navigates to that section. An animationStateId navigates to Page 10 and restores that state. A referenceId without a destination opens the Hub focused on that entry.
- The global Hub is a drawer/overlay, not a separate route. It supports search across terms, symbols, formulas, evidence, and implementation entries; selecting an entry does not reset the active page or Grand Animation state.
- Hub/page/state links use openReference; page components do not maintain competing navigation mechanisms.
- Keyboard focus, Escape-to-close, focus restoration, visible focus, touch access, reduced motion, and non-color-only meaning are required. Hover is never the only path to required content.
- Hover stays brief recall; Expandable Detail carries optional depth; the mainline page remains responsible for first teaching.

### Runtime Object IDs

IDs are stable kebab-case values shared by the page inspectors, formula mappings, Reference Registry, and Grand Animation. These are teaching/runtime objects; mathematical objects that are not explicitly stored by the procedure remain in Mathematical View and are not drawn as runtime state.

| Runtime ID | Role | Canonical reference |
| --- | --- | --- |
| task-a-data | Current Task-A data source | task_a_data |
| task-a-batch | Current sampled batch | task_a_data |
| neural-network | Same model used across tasks | ewc |
| model-logits | Network output before normalization | p_theta_y_given_x |
| prediction-probabilities | Current conditional output distribution | p_theta_y_given_x |
| task-a-loss | Ordinary Task-A loss | task_a_loss |
| task-a-gradient | Gradient in normal training | task_a_gradient |
| optimizer | Applies updates only in training mode | optimizer_step |
| current-parameters | Trainable parameters of the same model | theta |
| task-a-anchor | Frozen Task-A solution | theta_a_star |
| task-a-fisher | Stored Task-A diagonal Fisher estimate | fisher_a |
| fisher-estimator | Selected Page-5 estimation computation | empirical_fisher_estimator_background |
| persistent-memory | Teaching representation of stored old-task state | task_state_mapping |
| task-state-a | Teaching record S_A = (theta_A*, F_A) | task_state_mapping |
| task-b-data | Current Task-B data source | task_b_data |
| task-b-loss | Ordinary Task-B loss | task_b_loss |
| ewc-penalty | Task-A constraint added during Task B | ewc_penalty |
| task-b-gradient | Gradient from the Task-B loss | task_b_gradient |
| ewc-gradient | Restoring gradient from the EWC term | ewc_gradient |
| total-gradient | Combined gradient passed to the optimizer | total_gradient |
| replay-buffer | Short-timescale Atari replay mechanism | replay |
| task-recognition | Atari task/context identification mechanism | task_recognition |
| task-specific-modulation | Atari task-specific gain/bias mechanism | task_specific_modulation |

The persistent-memory record is an implementation mapping for teaching; the paper does not prescribe a software checkpoint schema. The Fisher-estimation pass computes the selected gradient statistic with the model fixed and does not perform optimizer.step. Mathematical View objects such as a full posterior, Laplace Gaussian, or full Hessian are not misrepresented as explicit runtime allocations.

### Formula-symbol mapping

Formula symbol clicks, Reference entries, and runtime highlights use this one mapping:

| Displayed symbol/object | Canonical Reference ID | Runtime / mathematical target |
| --- | --- | --- |
| p_theta(y \| x) | p_theta_y_given_x | prediction-probabilities |
| p(D \| theta) | p_D_given_theta | Mathematical View: dataset likelihood |
| p(theta) | p_theta | Mathematical View: parameter prior |
| p(theta \| D_A) | task_a_posterior | Mathematical View: Task-A posterior |
| theta | theta | current-parameters |
| theta_A* | theta_a_star | task-a-anchor |
| F_A | fisher_a | task-a-fisher |
| F_A,i | fisher_a_i | task-a-fisher / selected parameter block |
| lambda | lambda_ewc | EWC global constraint scale |
| L_B | task_b_loss | task-b-loss |
| Omega_A | ewc_penalty | ewc-penalty |
| grad L_B | task_b_gradient | task-b-gradient |
| grad Omega_A | ewc_gradient | ewc-gradient |
| grad L_total | total_gradient | total-gradient |

The Page-5 score gradient and squared-score terms link to empirical_fisher_estimator_background and the selected estimation computation; they do not receive paper-fact wording. F_A and theta_A* retain the same IDs on Pages 5–7 and in Grand Animation states 12–17.

### Grand Animation state IDs

The following 18 stable IDs follow the approved five phases. They identify cognitive states, not individual tweens or particle effects.

| Phase | State | Frozen ID |
| --- | --- | --- |
| Task A ordinary training | Global overview | overview |
| Task A ordinary training | Task-A data arrives | task-a-data |
| Task A ordinary training | First forward | first-forward |
| Task A ordinary training | Probability and task loss | probability-loss |
| Task A ordinary training | Backward | backward |
| Task A ordinary training | Optimizer update | optimizer-update |
| Task A ordinary training | Training compression | task-a-compression |
| Task boundary and mathematical view | Task A ends | task-a-boundary |
| Task boundary and mathematical view | Posterior mathematical view | posterior-view |
| Task boundary and mathematical view | Laplace local view | laplace-view |
| Task boundary and mathematical view | Return to runtime | return-runtime |
| Consolidation | Save anchor | save-anchor |
| Consolidation | Fisher estimation | fisher-estimation |
| Consolidation | Consolidated Task-A state | task-a-consolidated |
| Task B and EWC | Task-B data arrives | task-b-arrives |
| Task B and EWC | EWC objective assembly | ewc-objective |
| Task B and EWC | Combined gradient update | combined-gradient |
| Continual loop | Task-B boundary and next task | continual-loop |

Runtime entities reference the same Reference IDs and object IDs listed above. Formula-symbol activation highlights the matching parameter/Fisher/gradient entity. Page or Hub navigation into the animation resolves through these IDs, never an array index.

### Accessibility and motion constraints

All page interactions must work without hover and without relying on color alone. Figures include descriptive alt text. Reference triggers and controls are keyboard reachable, announce expanded state, close with Escape, and restore focus. Mobile uses tap and a sheet when a popover is too large. Page 10 supports keyboard playback and reduced-motion transitions without losing state meaning or formula/object links. These are W6/W8 implementation requirements; W5 does not build them.

## Human Acceptance Record

W4 was approved by 甘文杰 before this W5 plan was prepared. W7 remains pending and must be recorded only after a human has reviewed the implemented vertical slice.
