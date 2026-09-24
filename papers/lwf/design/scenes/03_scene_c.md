# Scene C — Where does the old-task signal come from?

## Learning Goal

Reconstruct the old-model response path and distinguish it from old-example replay and new-task ground truth.

## Knowledge Dependencies

- Required: `softmax_probability`, `knowledge_distillation`.
- Helpful: `replay`, Scene B.

## Persistent Objects

Keep both old and expanded models visible with one `X_n`, old response `Y_o`, new label `Y_n`, and current outputs `Ŷ_o`, `Ŷ_n`.

## System State

The old model is fixed while generating its target for the current new-task input. The current model is expanded with a new head. This scene traces target creation and does not yet change parameters.

## Core User Actions

Trace `X_n` through the old model and the expanded model; identify which output is the old-task target and which label comes from the new dataset.

## State Transitions

```text
new input X_n → old model (θ_s, θ_o) → old response Y_o
new input X_n → expanded model (θ_s, θ̂_o, θ̂_n) → Ŷ_o and Ŷ_n
new-task data → ground-truth Y_n
```

## Architecture / Data Flow

`Y_o` and `Ŷ_o` form the old-task response comparison. `Y_n` and `Ŷ_n` form the new-task supervised comparison. The paper does not require old images to produce `Y_o`; it forwards the currently visible `X_n` through the old model.

## Mathematical Model

`L_old(Y_o, Ŷ_o)` compares old-model and current-model responses; `L_new(Y_n, Ŷ_n)` compares current new-task output with new-task ground truth. Full formula details follow in Scene F.

## Implementation Mapping

Conceptually, one batch tensor is evaluated by the old model for target responses and by the expanded model for current outputs. The paper does not specify a persistent cache lifetime or exact framework tensor names; avoid inventing either. `Y_o` is a target in the loss graph, not an optimizer parameter.

## Paper Evidence

`C02` `A04` `A07` `F01` `F03`

## Teaching Toy Boundary

Do not invent logits, probabilities, or old labels. Any numeric softmax sample belongs to a later teaching toy and must be marked as such.

## Prerequisite Terms

`softmax_probability` `knowledge_distillation` `replay`

## Reconstruction Test

Without the page, the learner can draw `X_n → old model → Y_o` and `X_n → expanded model → (Ŷ_o, Ŷ_n)`, plus `Y_n` from the new-task dataset.

## Implementation Trace Test

The learner can state where each target/output is produced, what consumes it, that `Y_o` does not change through optimizer updates, and which later loss path uses it.

## Global Dependency Test

- **Consumes:** Scene B's data constraint and route comparison.
- **Produces:** teacher/current-model relation and separate old/new target paths.
- **Used later by:** Scene D's training lifecycle and Scenes E–G's loss mechanics.

## Deletion Test

Removing this trace would let learners mistake the response for stored examples or assume the teacher is run on old-task data.

## Acceptance Questions

1. What input creates `Y_o`, and which model processes it?
2. Why is `Y_o` neither an old example nor `Y_n`?

## Accessibility

Represent paths with text labels and distinct line styles; provide a reading-order list equivalent.

## Mobile

Present the old-model path first, expanded-model path second, and target comparison third.

## Non-goals

Do not specify Canvas coordinates, animation timing, or cache implementation.
