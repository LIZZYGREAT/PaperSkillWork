# Learning Architecture: Overcoming catastrophic forgetting in neural networks

Paper ID: `ewc`

## Concept Dependency Graph

```text
Sequential tasks share mutable θ
  → changing θ for B can interfere with A
  → previous-task posterior can act as B's prior
  → exact posterior is intractable
  → local Gaussian + diagonal Fisher compresses it
  → quadratic penalty adds a restoring gradient to L_B
  → optimizer changes current θ while anchor/Fisher remain references
  → Permuted MNIST and Atari test the method in bounded protocols
  → approximation, finite capacity, and system components define the claim boundary
```

Readers first need the mutable shared-parameter problem before Bayesian state transfer makes sense. The Fisher scene follows the old posterior because it explains the source of the parameter-wise weights; the objective and update scene then combines the new gradient with that state. Experiments come after the mechanism so the learner can identify what each evaluation does and does not establish.

## Persistent Workspace

Keep one compact “EWC training state” visible and updated across mechanism scenes: current task; current parameters `θ`; saved anchor `θ*`; diagonal importance `F`; current-task loss/gradient; `λ`; and the next optimizer result. Each field shows whether it is trainable, reference state, or a scalar setting. The example values are Teaching Toy state only. Evidence cards are kept separately and never inherit toy values. The workspace needs a reset action and a read-only mode for paper facts.

## Scenes

### Scene 01 — Why does task B overwrite task A?

- **Entry knowledge:** A neural network minimizes a loss by changing shared parameters.
- **Unresolved question:** Why does optimizing B alone damage A, and why can one uniform constraint also fail?
- **New mental model:** B-only updates ignore A; a uniform anchor protects every parameter equally, whereas EWC later weights displacement by old-task importance.
- **Persistent objects used:** `θ`, `L_B`, `θ*`, `F`, `λ` (initially only `θ`, `L_A/L_B` exist).
- **Exit capability:** Explain the stability/plasticity tension and distinguish a soft constraint from freezing all parameters.
- **Next question:** How can information about A be carried into the B objective?
- **Consumes:** C01, Figure 1 schematic, reader gradient-descent prerequisite.
- **Produces:** Recognition that a parameter-specific old-task signal is needed.
- **Used later by:** Scenes 02–04.

### Scene 02 — What is transferred when task A ends?

- **Entry knowledge:** Old examples may not be available during B, but their influence must be represented.
- **Unresolved question:** What compact object can carry A's constraints into B?
- **New mental model:** Sequential Bayes makes `p(θ|D_A)` a prior factor when adding `D_B`; EWC approximates rather than stores the exact posterior.
- **Persistent objects used:** `D_A`, `D_B`, posterior/prior labels, `θ*`.
- **Exit capability:** Reconstruct the posterior handoff and explain why the old posterior is useful but too complex to retain exactly.
- **Next question:** What local representation gives the posterior a computable shape?
- **Consumes:** C03, F01, helpful Bayes/MAP terms.
- **Produces:** Need for a local mean and precision.
- **Used later by:** Scene 03.

### Scene 03 — How does Fisher assign unequal protection?

- **Entry knowledge:** The previous posterior is approximated around `θ*`; precision controls how quickly probability falls away from its center.
- **Unresolved question:** How are different parameter directions assigned different stiffness, and what information is discarded?
- **New mental model:** Diagonal Fisher supplies one precision-like importance per parameter; a larger `F_i` makes the same displacement more costly. A full matrix could encode coupling, but the chosen approximation omits off-diagonal terms.
- **Persistent objects used:** `θ*`, `F`, per-parameter `Δ_i`, diagonal/full precision schematic.
- **Exit capability:** Distinguish importance from parameter magnitude and describe the diagonal approximation boundary.
- **Next question:** How does that importance enter the gradient that actually moves `θ`?
- **Consumes:** C03, C10, B02, F02; Fisher, Gaussian precision, and diagonal Fisher terms.
- **Produces:** Per-parameter importance values and a visible limitation.
- **Used later by:** Scene 04 and final limits.

### Scene 04 — What changes in one task-B step?

- **Entry knowledge:** `L_B`, `θ*`, `F`, and `λ` have separate roles.
- **Unresolved question:** Does EWC freeze parameters, alter the optimizer, or add a signal to the loss gradient?
- **New mental model:** The penalty is computed from current parameters and saved reference state; its derivative is added to the B gradient; the optimizer then updates current `θ`. Anchors and Fisher buffers are not themselves updated by that step.
- **Persistent objects used:** Complete EWC training state; prior toy parameter choices persist with explicit Teaching Toy label.
- **Exit capability:** Trace the lifecycle from task boundary through one update and explain what state remains after the step.
- **Next question:** What evidence shows the trade-off helps in tested sequences, and what remains unproven?
- **Consumes:** F02–F03, C02–C03, I01–I03, T01.
- **Produces:** A recomputable penalty, gradient decomposition, and next `θ` in a toy update.
- **Used later by:** Scenes 05–06 and end-to-end reconstruction.

### Scene 05 — What does Permuted MNIST establish?

- **Entry knowledge:** The learner can identify EWC's mechanism and what evidence would test forgetting.
- **Unresolved question:** Does parameter-specific protection outperform unprotected and equally protected baselines on a controlled task sequence?
- **New mental model:** Each task has one fixed pixel permutation; curves compare retention and learning. Fisher overlap is an additional analysis of shared parameter use, not an accuracy score.
- **Persistent objects used:** Evidence cards, task sequence, method comparison, protocol metadata.
- **Exit capability:** State the reported qualitative comparison and reconstruct the task/model/protocol without treating schematic plots as measured values.
- **Next question:** Does the Atari result isolate EWC, or evaluate it in a larger agent system?
- **Consumes:** C04–C06, R01–R02, source Figure 2/Appendix 4.1.
- **Produces:** Benchmark-specific evidence claim and its scope.
- **Used later by:** Scene 06.

### Scene 06 — Which part of Atari belongs to EWC?

- **Entry knowledge:** EWC's parameter penalty can be one part of a continual-learning system.
- **Unresolved question:** Which state and mechanisms contribute to the Atari result, and where does the approximation fail?
- **New mental model:** EWC protects long-timescale shared parameters inside an agent that also recognizes tasks, replays task-specific experiences, and has game-specific gains/biases. The reported score improves over plain training but remains below separate agents; perturbation evidence flags uncertainty misestimation.
- **Persistent objects used:** Agent component map, results protocol, limits and claim cards; optional EWC/LwF comparison.
- **Exit capability:** Reconstruct the whole evaluated system, classify the evidence as system-level, and name the Gaussian/diagonal and finite-capacity limits.
- **Next question:** Can the reader explain the full sequence without the page?
- **Consumes:** C07–C12, R03–R04, B03, Appendix 4.2–4.3.
- **Produces:** Final causal chain and claim boundary.
- **Used later by:** End-to-end recap.

## Optional Analogy

- Does an analogy reduce conceptual load? Yes, locally.
- **Mapping:** Draw a small spring between a current parameter and its old anchor; Fisher scales the spring stiffness, and `λ` scales the whole set of springs.
- **Boundary:** A spring is only a picture for the quadratic gradient. Neural parameters are not literal springs; Fisher is an approximate precision/importance signal, not a measured mechanical constant.
- **Removal condition:** If learners infer that high-Fisher parameters cannot move or that the analogy explains Fisher itself, remove the spring illustration and keep the equation/gradient view.

## Full Causal Chain

Task A examples update `θ` → the learned solution becomes `θ*` → diagonal Fisher summarizes the local importance estimate `F` → B arrives without using A examples in the supervised B penalty → `L_B` and the EWC quadratic produce a combined gradient → optimizer mutates current `θ` → tests measure prior-task retention and new-task learning → Permuted MNIST and Atari support claims only for their protocols → diagonal uncertainty, task conflict, limited capacity, and Atari's surrounding components bound interpretation.

## Architecture Acceptance

- [x] Scene order follows conceptual dependencies, not paper section order.
- [x] A first-time learner can identify the objects and their roles.
- [x] Every core scene states an entry point and exit capability.
- [x] The final path reconnects the full mechanism and evidence boundary.

Architecture content is prepared for review; these planning checks are not a human gate acceptance.
