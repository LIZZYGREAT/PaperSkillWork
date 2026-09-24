# Learning Architecture: Learning without Forgetting

Paper ID: `lwf`

## Concept Dependency Graph

```text
Classification logits / softmax / loss
→ task sequence: old data unavailable, new data visible
→ shared CNN + task-specific heads
→ fine-tuning / feature extraction / joint-training trade-offs
→ old model evaluates new input to create Y_o
→ expand with θ_n and distinguish teacher from current model
→ temperature and soft target
→ L_old + L_new + weight decay
→ freeze / unfreeze lifecycle, gradients, optimizer update
→ response preservation vs parameter constraint
→ input coverage gap and sequential drift
→ experiment protocol, numerical evidence, supported claims and limits
→ end-to-end reconstruction
```

The reader first needs to know what task/data setting the method addresses. Then the model must be decomposed into shared representation and task heads before teacher responses, losses, and parameter updates make sense. Evidence comes after the causal mechanism so results can be interpreted against the exact input and update constraints. This dependency order intentionally differs from the paper's section order.

## Prerequisite Gaps

Required concepts are softmax/cross-entropy, shared backbone versus task head, and the difference between gradient computation and optimizer updates. The main route explains only the parts needed for LwF. Knowledge distillation and continual-learning vocabulary are helpful and are introduced inline before use. Replay, EWC, Prompt, and LoRA remain optional comparison material.

## Persistent Workspace

Keep one system model visible across the first mechanism scenes. Reuse and focus these objects rather than drawing a fresh model each time:

```text
Old model: θ_s + θ_o
Current expanded model: θ_s + θ̂_o + θ̂_n
Visible input: X_n
Targets: Y_o from old model; Y_n from new-task labels
Current outputs: Ŷ_o and Ŷ_n
Objective: λ_o L_old + L_new + R
State: warm-up freezes θ_s, θ_o; joint-optimize trains all three parameter groups
```

This object list is not a fixed visualization requirement. It is the stable referent for architecture, data flow, equations, implementation mapping, and final reconstruction.

## Scenes

### Scene A — Why does adding a task threaten old behavior?

- **Entry knowledge:** A trained classifier can be adapted by changing parameters.
- **Unresolved question:** Why can learning a new task damage an old task, and what does the tutorial mean by "preserve"?
- **New mental model:** There are two objectives: adapt to new labels and retain useful old-task behavior. Fine-tuning and feature extraction give up different parts of that trade-off.
- **Persistent objects used:** Existing old model; shared parameters; old/new task outcomes.
- **Exit capability:** Explain the task-adding problem and distinguish new-task adaptation from old-task retention.
- **Next question:** If old training examples are unavailable, what information can the old model still provide?
- **Consumes:** Classification and parameter-update prerequisites.
- **Produces:** Problem statement and retention/adaptation distinction.
- **Used later by:** Scene B and every mechanism scene.

### Scene B — What can each training route use and change?

- **Entry knowledge:** Old and new objectives may conflict.
- **Unresolved question:** What are the data and parameter costs of feature extraction, fine-tuning, joint training, and LwF?
- **New mental model:** The methods differ by which data are available and which parameters can change; LwF's constraint is old-model response on new input.
- **Persistent objects used:** Shared network, old/new task heads, old/new data sources.
- **Exit capability:** State why joint training violates this setting and why freezing all shared features restricts adaptation.
- **Next question:** What exact target replaces old-task labels for LwF?
- **Consumes:** Scene A problem and shared/head distinction.
- **Produces:** Method/data/parameter comparison.
- **Used later by:** Scene C and the training-state trace.

### Scene C — Where does the old-task signal come from?

- **Entry knowledge:** Old examples are unavailable; an old model and new input remain available.
- **Unresolved question:** Is the teacher target replay, a ground-truth label, or an output generated on current data?
- **New mental model:** `X_n` goes through the old model to produce `Y_o`; the expanded model sees that same `X_n` and learns to match the old response while predicting the new label.
- **Persistent objects used:** Old model, expanded model, `X_n`, `Y_o`, `Y_n`, `Ŷ_o`, `Ŷ_n`.
- **Exit capability:** Reconstruct `X_n → old model → Y_o` and explain why `Y_o` is not replay.
- **Next question:** How are new parameters added and which model state is frozen first?
- **Consumes:** Scene B method/data comparison.
- **Produces:** Teacher/current-model relation and two target paths.
- **Used later by:** Scenes D–J.

### Scene D — How is the expanded network trained?

Trace creation of `θ_n`, warm-up, and joint-optimize; show that freezing changes per-parameter trainability over time. Ask where backward sends each loss and what actually changes parameters.

### Scene E — What information does temperature preserve?

Use a clearly labeled fixed-logit teaching toy to compare the distribution before and after temperature. Distinguish smoothing and class relations from any paper-reported accuracy.

### Scene F — How do the loss terms meet?

Map `L_old`, `L_new`, and `R` to their target objects and gradient paths. Contrast output response preservation with parameter L2 as a separate baseline.

### Scene G — What does `λ_o` control?

Explain relative objective weight and the adaptation/retention trade-off without fabricating an accuracy curve or guarantee.

### Scene H — Which parameters belong to which task?

Inspect the persistent shared/head graph, then connect architecture alternatives to Table 2. Treat added task-specific layers and network expansion as evaluated alternatives, not core architecture.

### Scene I — Where can response coverage fail?

Connect the fact that matching occurs only on `X_n` with input-distribution differences and repeated sequential expansion. Mark qualitative toys as non-measurements.

### Scene J — What do the experiments establish?

Reconstruct one evidence-complete task-pair comparison, distinguish printed values from values derived from deltas, and finish with limits and an end-to-end mechanism trace.

## Dependency Summary

| Scene | Consumes | Produces | Used later by |
| --- | --- | --- | --- |
| A | Classification and update prerequisites | Problem and two-objective framing | B–J |
| B | A; shared model/head concepts | Data and parameter route comparison | C–J |
| C | B; teacher/student distinction | `X_n → Y_o`, old/new target paths | D–J |
| D | C; parameter lifecycle | State, loss, gradient, and update trace | E–J |
| E | C/D; softmax | Temperature-shaped target | F, J |
| F | D/E; target paths | Objective and gradient responsibilities | G–J |
| G | F; weighted objective | Relative weight interpretation | H–J |
| H | D/F; persistent architecture | Main model versus architecture alternatives | I, J |
| I | C/F; target coverage | Applicability and sequential-drift boundary | J |
| J | A–I; evidence registry | Evidence-backed complete mental model | Final acceptance |

## Optional Analogy

- Does an analogy reduce conceptual load? No for the core path.
- Mapping: a dictionary analogy may be used as an optional, removable illustration for old/new entries.
- Boundary: class probabilities are not definite dictionary meanings; an input's domain position has no numeric similarity scale; dictionary editing is not the algorithm.
- Removal condition: if the analogy takes more words to qualify than the mechanism needs, remove it without losing any required concept.

## Full Causal Chain

Old training examples are unavailable → the shared network must adapt from new examples → unconstrained updates can hurt old-task output → the old model supplies `Y_o` on each new image → the current model is trained toward both `Y_o` and `Y_n` → gradients flow through the current computation graph → the optimizer updates parameters allowed by the current phase → tests measure specific old/new tasks and metrics → the observed trade-off depends on task pair, split, distribution coverage, hyperparameters, and task sequence.

## Architecture Acceptance

- [x] The scene order follows conceptual dependencies rather than paper section order.
- [x] The persistent model and its object relationships are named.
- [x] Scenes A–C provide entry knowledge, unresolved questions, exit capabilities, and dependencies.
- [x] D–J reconnect the training process, evidence, and method limits.
- [x] No single analogy or interaction form is required.

The checked boxes describe the written architecture only. G4 remains pending until a person reviews it.
