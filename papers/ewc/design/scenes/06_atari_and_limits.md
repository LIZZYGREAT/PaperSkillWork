# Scene: 06 — Which part of Atari belongs to EWC?

## Learning Goal

Place EWC in the Atari agent architecture, understand the aggregate metric, and close with the method's evidence and approximation limits.

## Knowledge Dependencies

Scenes 01–05; optional DQN/replay background. Evidence C07–C12, R03–R04, B03.

## Persistent Objects

`selectedComponent ∈ {shared_q_network, task_recognition, per_task_replay, task_specific_gains_biases, ewc_state}`; Atari protocol and metric; limitation cards; optional EWC/LwF comparison.

## System State

One selected component expands its producer/consumer role and labels whether it belongs to EWC or the broader Atari agent. The claim selector chooses among `tested`, `overstated`, and `not-tested` examples; the EWC/LwF comparison is a static reference card.

## Core User Actions

Select component cards to inspect the Atari system and its state/data flow. Inspect result protocol (`10 games`, repeated randomized sequence, periodic evaluation, score cap) and claim cards to distinguish paper evidence from overclaim. Optionally compare parameter-space EWC with function/output-space LwF.

## State Transitions

Selecting a component updates its boundary description. Selecting a claim reveals evidence record and verdict. Reset returns to shared Q-network. No simulated score changes with these selections.

## Architecture / Data Flow

Atari observations → task-recognition model infers context → active game-specific gains/biases and per-task replay buffer support DQN learning; EWC separately adds a parameter penalty to shared network updates at eligible task boundaries. Periodic all-game evaluation measures system behavior. This scene must not draw EWC as the owner of replay, task recognition, or evaluation.

## Mathematical Model

Use only the reported metric definition: sum of per-game human-normalized scores, clipped at 1 per game, maximum 10. No fabricated Atari score values. Mention EWC activation after at least 20 million frames for a game.

## Implementation Mapping

Interactive component and claim cards are explanatory selectors. The tutorial does not run DQN, infer contexts, store replay transitions, or calculate experiment scores.

## Paper Evidence

Registry C07–C12, R03–R04, B03; arXiv v2 Section 2.2, Figure 3A–C, Appendix 4.2–4.3, and Discussion.

## Teaching Toy Boundary

No artificial results or score series. The architecture view is a source-grounded system map. EWC/LwF comparison is background orientation and not a paper baseline.

## Prerequisite Terms

`experience_replay`, `fisher_information`, `diagonal_fisher`, `function_regularization`.

## Reconstruction Test

Can the learner draw the Atari system and point to EWC's actual boundary, define the metric, name the result comparison, and state the factorized-Gaussian/diagonal-Fisher limit?

## Implementation Trace Test

`θ*` and Fisher state constrain shared trainable parameters. Replay buffers are separate RL state; context inference selects task; gains/biases are task-specific state; testing does not train. Tutorial controls mutate only selected card state.

## Global Dependency Test

- **Consumes:** C07–C12, R03–R04, Scenes 04–05.
- **Produces:** Final system-level evidence boundary and limits.
- **Used later by:** End-to-end reconstruction and audit.

## Deletion Test

Removing the component selector would hide the crucial evidence boundary and make it easy to attribute replay/task recognition to EWC; selecting components makes ownership inspectable.

## Acceptance Questions

1. Is Atari described as a combined system, not EWC alone?
2. Are replay and task recognition explicitly visible as separate mechanisms?
3. Are exact plotted values omitted unless transcribed from an authorized table?
4. Is LwF identified as a cross-paper background contrast, not an EWC baseline?

## Accessibility

Use native buttons and disclosures, accessible names, keyboard focus, text labels in addition to color, and reduced-motion-safe state changes.

## Mobile

Stack components into a list; place metric and protocol beneath the selected component; avoid a wide flow diagram.

## Non-goals

Do not imply zero forgetting, unlimited capacity, tested LLM capability, replay-free Atari, or that a browser toy reproduces the experiment.
