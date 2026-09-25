# Page: 05 — What changes in one task-B step?

## Learning Goal

Trace the source of the EWC gradient and separate computed reference state from mutable network parameters.

## Knowledge Dependencies

Scenes 01–03; required gradient descent; terms `ewc_penalty` and `stability_plasticity`. Evidence C02–C03, F02–F03, I01–I03, T01.

## Persistent Objects

Toy vectors: anchor `θ*=[0.2,-0.1,0.4]`, current `θ=[0.5,0.2,0.1]`, diagonal `F=[1,4,9]`, new-task gradient `g_B=[-0.3,0.2,-0.1]`, `λ`, learning rate `η=0.1`, penalty, combined gradient, and next `θ`.

## System State

`lambda ∈ [0,4]` with default `2`. The displayed vectors and `η` are fixed Teaching Toy inputs. Compute:
`P=(λ/2)ΣF_i(θ_i−θ*_i)^2`,
`g_EWC=λF⊙(θ−θ*)`,
`g_total=g_B+g_EWC`,
`θ_next=θ−ηg_total` for plain SGD only.

## Core User Actions

Adjust `λ` using a labeled range control. The objective contribution, restoring gradient, combined gradient, and one-step toy parameter values update together. A “trace objects” button switches the same state between Paper / Runtime mapping / Teaching Toy labels.

## State Transitions

Increasing `λ` proportionally increases the EWC penalty and its gradient for the fixed toy state. `g_B` and saved references remain fixed. The resulting plain-SGD step is recomputed, not animated. Reset returns default `λ=2`.

## Architecture / Data Flow

Current task batch → `L_B` and `g_B`; retained `θ*`,`F` plus current `θ` → EWC penalty and gradient; summed gradient → optimizer step → current `θ` changes. `θ*`, `F`, and `λ` do not receive gradients in this example.

## Mathematical Model

Use Equation 3 and its derivative. Explain that in a generic optimizer the actual mutation can depend on optimizer state; the shown update is one plain SGD teaching calculation, not the exact optimizer used in either experiment.

## Implementation Mapping

Show shapes as three aligned scalar parameters for the toy, and explain that real parameter-shaped tensors would be stored per model parameter. The page is a deterministic calculator, not an autograd run.

## Paper Evidence

Registry C02–C03, F02–F03, I01–I03, T01; Equation 3, Section 2.

## Teaching Toy Boundary

All vectors, `λ`, `η`, and resulting values are invented for arithmetic. They are not paper Fisher values, measured gradients, or benchmark accuracy.

## Prerequisite Terms

`parameter_vector`, `anchor_parameters`, `diagonal_fisher`, `ewc_penalty`, `stability_plasticity`, `teaching_toy`.

## Reconstruction Test

Can the learner trace `g_B + λF⊙(θ−θ*)` and identify which object is changed by the optimizer?

## Implementation Trace Test

Current `θ` is mutable; `θ*` and `F` are retained and consumed; `L_B` is recalculated from B examples; penalty is derived per step; optimizer updates only the selected trainable set. Page state is not paper-model state.

## Global Dependency Test

- **Consumes:** C02–C03, F02–F03, I01–I03, T01, outputs of Scenes 02–03.
- **Produces:** One inspectable total gradient and next parameter vector.
- **Used later by:** Pages 06–10 and the end-to-end reconstruction.

## Deletion Test

Without changing `λ`, the learner could read the formula but not inspect how one coefficient scales the penalty and update while holding other sources fixed.

## Acceptance Questions

1. Does the page clearly label this as a plain-SGD toy step?
2. Are anchor/Fisher references visually distinct from current parameters?
3. Is “loss adds a gradient” separated from “optimizer mutates parameters”?

## Accessibility

Native range with min/max/current text, keyboard operation, selectable view tabs with `aria-pressed`, and focus indicators. No hover-only information.

## Mobile

Render each vector and gradient as stacked labeled rows; no horizontal table scrolling is required.

## Non-goals

Do not simulate many tasks or present the toy step as the authors' training implementation.
