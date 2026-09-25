# Page: 10 — Compare, conclude, and reconstruct the full flow

## Learning Goal

Compare the experiments, state a bounded conclusion, and reconstruct EWC's full task-level state flow.

## Knowledge Dependencies

Pages 01–09; terms `stability_plasticity`, `anchor_parameters`, and `diagonal_fisher`. Evidence C04–C12, R01–R04, F02–F03.

## Persistent Objects

Experiment comparison table; claim boundary; ordered flow stages for `D_A`, `θ*_A`, `F_A`, `D_B`, `L_B`, EWC gradient, optimizer-updated `θ`, evaluation, and later reference retention.

## System State

`flowStage ∈ 0..8`; `playing ∈ {true,false}`; `reducedMotion` from the browser preference. Current step determines active node, transition edge, caption, and read/write summary.

## Core User Actions

Play or pause the sequence, step backward or forward, jump to any stage, and reset. Compare MNIST and Atari evidence in a table before seeing the final claim.

## State Transitions

The flow moves A data → train solution → estimate Fisher → retain A reference → receive B batch → compute combined objective/gradient → optimizer changes current parameters → evaluate tasks → add B reference and continue. Pause freezes the marker; manual step remains available under reduced motion.

## Architecture / Data Flow

The animation diagram uses an explicit ordered graph with arrows between state nodes. Each caption reports the stage's input, read objects, written objects, and retained references. Atari's task recognition, replay, and task-specific gain/bias sit in a separate system note and are not drawn as EWC-owned transitions.

## Mathematical Model

Show `L_B + (λ/2)Σ_{k∈past}Σ_i F_{k,i}(θ_i−θ*_{k,i})²` and the corresponding combined gradient. Identify this as a schematic task-wise objective, not a newly measured quantity.

## Implementation Mapping

The UI advances a deterministic teaching storyboard. It does not execute EWC, load experiment data, update weights, or animate the paper's original network.

## Paper Evidence

Registry C04–C12, R01–R04, F02–F03. Compare MNIST's controlled supervised sequence with the larger system-level Atari result; cite each result with its own protocol.

## Teaching Toy Boundary

No animated curve or score is fabricated. The moving marker denotes causal order only; all values on earlier calculator pages remain separately labeled Teaching Toy.

## Prerequisite Terms

`stability_plasticity`, `anchor_parameters`, `diagonal_fisher`, `ewc_penalty`, `permuted_mnist`, `experience_replay`.

## Reconstruction Test

Can the learner explain the A→B information path, identify what the optimizer changes, compare what MNIST and Atari establish, and name at least two limits?

## Implementation Trace Test

Only `flowStage` and playback state change. The diagram does not mutate the shared toy parameter vector or evidence registry.

## Global Dependency Test

- **Consumes:** C04–C12, R01–R04, F02–F03, and pages 01–09.
- **Produces:** A full causal reconstruction and bounded conclusion.
- **Used later by:** No later page; this is the tutorial exit.

## Deletion Test

Without the comparison and flow animation, learners would need to assemble the final causal chain across separate pages and could confuse method evidence with system-level evidence.

## Acceptance Questions

1. Does the comparison keep MNIST and Atari protocols separate?
2. Does the conclusion avoid claiming zero forgetting, unlimited capacity, or LLM evidence?
3. Can the learner pause, step, jump, and reset the flow without relying on motion alone?
4. Does the flow distinguish mutable `θ` from retained anchors and Fisher state?

## Accessibility

All timeline stages and playback controls are keyboard-operable; announce the current stage; offer reduced-motion behavior and a static textual sequence.

## Mobile

Provide a stacked or horizontally scrollable flow map with readable node descriptions; controls stay visible and operable.

## Non-goals

Do not animate numeric benchmark scores or conflate task-recognition/replay components with the EWC penalty.
