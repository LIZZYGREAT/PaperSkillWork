# Shared Workspace — LwF model and signal registry

## Learning Goal

Keep one stable set of paper objects available across scenes so later explanations modify or inspect the same model rather than introduce disconnected diagrams.

## Knowledge Dependencies

- Required: `shared_parameters`, `task_head`, `softmax_probability`.
- Helpful: `knowledge_distillation`.

## Persistent Objects

| Object | Role | Origin |
| --- | --- | --- |
| Old model `(θ_s, θ_o)` | Generates old-task response for the current new input | Previously trained model |
| Expanded model `(θ_s, θ̂_o, θ̂_n)` | Learns new and old-task objectives | Shared parameters plus new-task head |
| `X_n` | The only current training image source in the LwF setting | New-task data |
| `Y_o` / `Y_n` | Old model response / new-task ground truth | Old forward / dataset labels |
| `Ŷ_o` / `Ŷ_n` | Current expanded model outputs | Current forward |
| `L_old`, `L_new`, `R` | Objective terms | Current outputs, targets, regularization |

## System State

Track whether the old model is producing targets, whether the current expanded model is in warm-up or joint-optimize, and which parameter groups are frozen or trainable. Do not imply the teacher is fixed forever across all sequential task additions.

## Core User Actions

Inspect an object or follow one data/loss path. Actions are optional if static labels communicate the relation more clearly.

## State Transitions

`old model → target generation → expanded model warm-up → joint-optimize → predictions for old and new tasks`.

## Architecture / Data Flow

```text
X_n → old model (θ_s, θ_o) → Y_o
X_n → expanded model (θ_s, θ̂_o, θ̂_n) → Ŷ_o, Ŷ_n
Y_o + Ŷ_o → L_old; Y_n + Ŷ_n → L_new; θ values → R
```

## Mathematical Model

`L_total = λ_o L_old + L_new + R(θ̂_s, θ̂_o, θ̂_n)`.

## Implementation Mapping

The paper uses parameter groups; module names, tensors, optimizer containers, and transient target-storage lifetimes are implementation choices. Do not assert an exact storage or framework API.

## Paper Evidence

`C02` `C03` `C05` `A01` `A02` `A03` `A04` `A05` `F04` `I01` `I02` `I03`

## Teaching Toy Boundary

No invented probabilities, shapes beyond generic batch-by-label dimensions, or accuracy results are stored in this workspace.

## Prerequisite Terms

`shared_parameters` `task_head` `softmax_probability` `knowledge_distillation` `warm_up` `joint_optimize`

## Reconstruction Test

Without the page, a learner can redraw the old model, expanded model, shared input, old/new target paths, and phase-dependent trainable parameters.

## Implementation Trace Test

A learner can name what creates each target and output, where it flows, which parameter group receives gradients, and which phase permits the optimizer to update it.

## Global Dependency Test

- **Consumes:** prerequisite classifier, task/parameter, and probability concepts.
- **Produces:** a stable object map and vocabulary for all scenes.
- **Used later by:** Scenes A–J and the final end-to-end reconstruction.

## Deletion Test

Removing the shared workspace would make each scene redefine the models and targets, obscuring that all scenes inspect one method state.

## Acceptance Questions

1. Can the learner identify the teacher, current model, shared input, targets, outputs, and phase state?

## Accessibility

Use text labels and a semantic object list; do not rely on color or hover.

## Mobile

Present the object table before the data-flow trace and allow line wrapping.

## Non-goals

This file does not prescribe a Canvas, a fixed visual metaphor, or an exact code architecture.
