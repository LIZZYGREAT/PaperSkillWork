# Page: 06 — What state moves at a task boundary?

## Learning Goal

Trace how EWC's task-specific anchors and Fisher estimates are produced, retained, and consumed across tasks.

## Knowledge Dependencies

Pages 03–05; terms `anchor_parameters`, `diagonal_fisher`, `ewc_penalty`, and `experience_replay`. Evidence C02–C03, I01–I02.

## Persistent Objects

Current parameters `θ`; per-task reference pairs `(θ*_k,F_k)`; current-task data `D_k`; current loss `L_k`; coefficient `λ`; optimizer state; and an explicitly empty/available old-example store indicator.

## System State

`lifecycleStage ∈ {train_a, estimate_fisher, save_reference, train_b, evaluate, add_b_reference}`. Selected stage controls a state ownership table and the flow diagram highlight.

## Core User Actions

Advance or jump among task-boundary stages. Inspect each object's owner, whether it is read or written, whether it is trainable, and whether prior raw examples participate in the current EWC loss.

## State Transitions

Training A mutates `θ_A`; after the task, store `θ*_A` and `F_A`; B reads those references and current `D_B`; its optimizer mutates current `θ`; after B, add `(θ*_B,F_B)` for later tasks. Existing per-task references remain represented in original EWC. Do not imply they are overwritten by B.

## Architecture / Data Flow

`D_A → train θ_A → estimate F_A → save θ*_A,F_A → D_B and current θ → L_B + Σ_k EWC_k → backward → optimizer → θ_B → evaluate → append B reference pair`.

## Mathematical Model

For multiple prior tasks, show the conceptual sum of task-wise quadratic terms `L_B + (λ/2)Σ_{k∈past}Σ_i F_{k,i}(θ_i−θ*_{k,i})²`. Identify it as the paper's task-wise extension, not the separate later online-EWC approximation.

## Implementation Mapping

Table rows distinguish trainable parameter tensors, detached anchor snapshots, non-trainable Fisher buffers, current batches, derived loss/gradient, and optimizer state. The browser walkthrough is instructional state selection; it does not train or estimate Fisher from data.

## Paper Evidence

Registry C02–C03, I01–I02; arXiv v2 Section 2, Equation (3), plus implementation mapping labels.

## Teaching Toy Boundary

No synthetic training result is shown. If a vector state is reused from other pages, label every value as a Teaching Toy and separate it from paper state.

## Prerequisite Terms

`anchor_parameters`, `diagonal_fisher`, `ewc_penalty`, `experience_replay`, `teaching_toy`.

## Reconstruction Test

Can the learner identify what A writes, what B reads, what the optimizer mutates, and how B's reference state is retained for a later task?

## Implementation Trace Test

Stage selection changes explanatory highlights only. Anchor/Fisher references are not mutated by a B optimizer step; raw A examples are not an input to the EWC penalty.

## Global Dependency Test

- **Consumes:** C02–C03, I01–I02, and pages 03–05.
- **Produces:** A task-boundary state model.
- **Used later by:** Pages 07–10 and the final flow animation.

## Deletion Test

Without a task-boundary view, a reader could understand the equation but confuse current parameters, saved reference state, raw old examples, and optimizer state.

## Acceptance Questions

1. Are trainable `θ` and read-only reference state visually distinct?
2. Does B's loss avoid a replay edge from raw `D_A`?
3. Does the page preserve per-task EWC terms rather than silently changing to online EWC?

## Accessibility

Provide keyboard-operable stage controls, text descriptions for the ownership map, and no information conveyed by color alone.

## Mobile

Stack the state table and stage diagram; allow labels to wrap and keep the full object name visible.

## Non-goals

Do not implement a training loop, Fisher estimator, replay buffer, or claim the tutorial is original paper code.
