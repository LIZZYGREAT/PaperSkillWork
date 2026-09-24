# Scene: 01 — Why does task B overwrite task A?

## Learning Goal

Reconstruct the shared-parameter interference problem and explain why unconstrained updates and equal-strength protection create different failure modes.

## Knowledge Dependencies

`continual_learning`, `catastrophic_forgetting`, and basic gradient descent. Evidence: C01; the comparison is the Figure 1 schematic, not measured data.

## Persistent Objects

Current shared parameters `θ`, old and new task objectives `L_A` and `L_B`, future anchor slot `θ*`, future importance slot `F`.

## System State

`comparisonMode ∈ {sgd, uniform, ewc}`. The view changes which learning signal is shown. It does not generate an accuracy curve or claim a numeric experimental outcome. `F` is marked “not yet constructed” until scene 03.

## Core User Actions

Select one method card: `B-only`, `uniform anchor`, or `EWC weighting`. The diagram updates active arrows and the explanatory sentence. EWC view previews a parameter-specific signal but leaves its derivation for later.

## State Transitions

`B-only` highlights only `∇L_B`; `uniform anchor` adds equal restoring arrows; `EWC weighting` labels unequal restoring arrows as a preview, with `F` still pending. Selection is reversible; Reset returns to B-only.

## Architecture / Data Flow

Task B batch → current network → `L_B` → gradient → optimizer → current `θ`. The old-task constraint is absent in B-only mode. Do not draw a replay edge from `D_A` into B.

## Mathematical Model

Conceptual only: plain objective `L_B`; uniform penalty `L_B + (κ/2)Σ_i(θ_i−θ*_i)^2`; EWC later replaces uniform `κ` with `λF_i`. No synthetic performance score.

## Implementation Mapping

Method selection is a UI state, not a runtime trainer. Diagram arrows correspond to objective terms; no parameters are mutated here.

## Paper Evidence

Registry C01 and C02; Figure 1 schematic in arXiv v2 Section 2.

## Teaching Toy Boundary

The illustration is a conceptual rendering of Figure 1. No data, loss surface, trajectory, or metric is simulated.

## Prerequisite Terms

`continual_learning`, `catastrophic_forgetting`, `parameter_vector`.

## Reconstruction Test

Can the learner explain why `L_B` alone may alter parameters useful for A, and why equal constraints may block B?

## Implementation Trace Test

`θ` is mutable model state. `L_B` is recomputed from B data. The optimizer changes `θ`; this scene has no stored anchor/Fisher and no parameter update.

## Global Dependency Test

- **Consumes:** C01, gradient descent prerequisite.
- **Produces:** Need for compact old-task state and nonuniform protection.
- **Used later by:** Scenes 02–04.

## Deletion Test

Removing the selector would leave the two failure modes as prose only; comparing the three objective paths helps establish why parameter-specific importance is needed.

## Acceptance Questions

1. Does the learner distinguish forgetting from old data deletion?
2. Does the scene avoid implying EWC freezes the important parameters?

## Accessibility

Use native buttons with visible focus and `aria-pressed`. All states are reachable by keyboard. No drag or motion-dependent information.

## Mobile

Stack method cards and render the diagram as a responsive SVG with minimum readable labels.

## Non-goals

Do not introduce Fisher derivation, exact benchmark curves, or a unifying analogy here.
