# Page: 03 — What is transferred when task A ends?

## Learning Goal

Explain the sequential Bayesian handoff and why EWC compresses the old-task posterior rather than keeping its full distribution.

## Knowledge Dependencies

Page 02; helpful terms `bayesian_posterior` and Bayes rule. Evidence C03 and F01.

## Persistent Objects

`D_A`, `D_B`, current parameter `θ`, posterior `p(θ|D_A)`, prior factor for B, and anchor slot `θ*`.

## System State

`handoffStage ∈ {learn_a, consolidate, learn_b}`. Selecting a stage updates which data likelihood and parameter distribution are active.

## Core User Actions

Choose the next stage using three native buttons. Reveal a compact dependency view for `p(θ|D_A,D_B) ∝ p(D_B|θ)p(θ|D_A)` and identify which term contains new data and which carries old-task information.

## State Transitions

`learn_a` shows `D_A → p(θ|D_A)`; `consolidate` keeps the posterior factor but removes the `D_A` input; `learn_b` adds `D_B` likelihood and keeps the old posterior factor as prior. A “show exact state” disclosure notes that the actual posterior is intractable and EWC will approximate it.

## Architecture / Data Flow

Old task data updates the parameter posterior. At B time, the old posterior is combined with the B likelihood; EWC's approximation is produced in scene 03. This flow does not claim that the actual network stores a normalized exact distribution.

## Mathematical Model

Use the source's Equation 2. Treat `−log p(D_B)` as constant with respect to `θ` during MAP optimization. Introduce the negative-log-likelihood/loss relationship only as orientation.

## Implementation Mapping

The posterior handoff is a mathematical account, not a data structure shipped by the tutorial. The future `θ*` and `F` entries are labeled “approximation to build,” not exact posterior contents.

## Paper Evidence

Registry C03 and F01; arXiv v2 Section 2, Equations (1)–(2).

## Teaching Toy Boundary

The flow view only shows factor relationships; no posterior values or probabilities are calculated.

## Prerequisite Terms

`bayesian_posterior`, `parameter_vector`, `continual_learning`.

## Reconstruction Test

Can the learner state why `p(θ|D_A)` appears in the B objective and why the paper still needs an approximation?

## Implementation Trace Test

`D_A` trains A and informs the retained approximation. The B step consumes the approximation, not `D_A`. Neither the page nor this scene mutates a model.

## Global Dependency Test

- **Consumes:** C03, F01, Scene 01's need for old-task state.
- **Produces:** A requirement for a tractable local representation.
- **Used later by:** Page 04.

## Deletion Test

Without the stage selector, “old posterior becomes new prior” is a static equation; selecting stages exposes which task data is present at each point.

## Acceptance Questions

1. Is the old posterior clearly distinguished from raw old-task data?
2. Is the approximation marked as approximation, not exact Bayesian storage?

## Accessibility

Native buttons, keyboard operation, visible focus, and persistent text labels; no hover-only definitions.

## Mobile

Render the flow vertically at narrow widths; keep the equation horizontally scroll-free by breaking at operators.

## Non-goals

Do not teach Bayesian inference generally or display invented posterior distributions.
