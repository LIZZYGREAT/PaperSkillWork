# Scene: 03 — How does Fisher assign unequal protection?

## Learning Goal

Connect local posterior precision to the diagonal Fisher weights and identify the information lost by keeping only the diagonal.

## Knowledge Dependencies

Scene 02; helpful Gaussian precision and matrix-diagonal concepts. Evidence C03, C10, B02, F02.

## Persistent Objects

`θ*`, current `θ`, diagonal `F`, displacement `Δ=θ−θ*`, and a separate two-dimensional illustrative correlated Gaussian.

## System State

`selectedParameter ∈ {θ1,θ2,θ3}`; `delta ∈ [-1,1]`; fixed toy importance values `[1,4,9]`; optional `precisionView ∈ {diagonal, correlated}`. State is Teaching Toy, never paper measurement.

## Core User Actions

Choose a toy parameter and adjust its displacement with a range input. Compute `½F_iΔ_i²` and its restoring derivative `F_iΔ_i`. A second button switches a 2-D contour from correlated precision to its diagonal-only version to show what cross-parameter coupling is omitted.

## State Transitions

Parameter choice updates the selected toy `F_i`; changing `delta` recalculates penalty and derivative. Contour toggle changes only the explanatory matrix view. Reset restores `θ1`, `delta=0.4`, and diagonal view.

## Architecture / Data Flow

Saved `F_i` and `θ*_i` → compare with current toy `θ_i` → weighted quadratic → penalty derivative. The contour inset compares a toy full precision matrix and the diagonal approximation; it is independent of experiment data.

## Mathematical Model

Paper expression: diagonal entries of Fisher are used as local Gaussian precision. Teaching calculation: `P_i = ½F_iΔ_i²`; `∂P_i/∂θ_i = F_iΔ_i` before scaling by `λ`. No empirical Fisher estimate is calculated from training examples.

## Implementation Mapping

Range control is native DOM and all results are derived in a pure calculation from state. Parameter position, importance buffer, and penalty are distinct readouts. Contour values are illustrative fixed values.

## Paper Evidence

Registry C03 and C10, F02, R04, T02; arXiv v2 Section 2 and Figure 3C discussion.

## Teaching Toy Boundary

`F=[1,4,9]`, displacement, contour correlation, and displayed penalty are invented instructional values. They are not estimates from Permuted MNIST or Atari.

## Prerequisite Terms

`fisher_information`, `diagonal_fisher`, `laplace_approximation`, `anchor_parameters`, `teaching_toy`.

## Reconstruction Test

Can the learner explain why equal displacement has unequal penalty and what diagonalization omits?

## Implementation Trace Test

The selected displacement changes only toy current state. Fisher and anchor are fixed references. The UI computes a value but performs no backpropagation or optimizer update.

## Global Dependency Test

- **Consumes:** C03, C10, F02, Scene 02's local-Gaussian requirement.
- **Produces:** Parameter-wise penalty signal and an approximation boundary.
- **Used later by:** Scene 04's total-gradient calculation and Scene 06's limits.

## Deletion Test

Removing the parameter selector and displacement control would hide the defining relationship between `F_i`, displacement, and penalty; the diagonal/correlated toggle demonstrates the specific approximation cost.

## Acceptance Questions

1. Does the feedback say “important parameters are harder to move,” not “cannot move”?
2. Are illustrative values visibly separated from paper results?
3. Does the matrix inset identify omitted coupling without implying the toy is paper data?

## Accessibility

Use labeled range controls, keyboard increment/decrement, `output` values, visible focus, and a text explanation for both contour modes.

## Mobile

Stack controls and inset vertically; wrap formulas and avoid a required drag gesture.

## Non-goals

Do not implement model-based Fisher estimation or imply that diagonal entries encode all parameter interactions.
