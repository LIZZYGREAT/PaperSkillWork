# Scene: 05 — What does Permuted MNIST establish?

## Learning Goal

Reconstruct the supervised continual-learning protocol and distinguish reported qualitative results from values not transcribed.

## Knowledge Dependencies

Scenes 01–04; terms `permuted_mnist` and `fisher_overlap`. Evidence C04–C06, R01–R02.

## Persistent Objects

Task permutation selector `mnistView ∈ {task_protocol, method_comparison, overlap}`; fixed experiment metadata; method labels SGD, uniform quadratic constraint, EWC, SGD+dropout.

## System State

Selecting one view updates the protocol card and the specific supported claim. Do not create a chart with fabricated points; if showing curves, use a text-only schematic explicitly marked as a conceptual redraw and do not assign measured coordinates.

## Core User Actions

Select one of three evidence cards: task construction, method comparison, or Fisher overlap. The selected card reveals dataset, model, protocol, reported qualitative pattern, and supported/unsupported inference.

## State Transitions

`task_protocol` shows the fixed-permutation rule and no further training on prior task data. `method_comparison` shows the paper's baseline conditions and qualitative result. `overlap` shows the 8×8 vs 26×26 central region setting and explains why digit output classes can still share later layers.

## Architecture / Data Flow

Each MNIST task applies one fixed input-pixel permutation to all its images → fully connected ReLU network trains sequentially → each task test set is evaluated. In overlap analysis, normalized Fisher matrices are compared by a Fréchet-distance-derived overlap. The method comparison and overlap analysis are distinct experiments.

## Mathematical Model

No synthetic accuracy values. For overlap, define only the qualitative meaning: larger overlap indicates more similar Fisher-weighted parameter use in the paper's metric. Do not substitute elementwise Jaccard overlap or infer accuracy from it.

## Implementation Mapping

Evidence cards are static, registry-linked paper facts/results. The UI makes no MNIST images, model, or curves run in the browser.

## Paper Evidence

Registry C04–C06 and R01–R02; arXiv v2 Section 2.1, Figure 2A–C, Appendix 4.1 and 4.3.

## Teaching Toy Boundary

No Teaching Toy values in this scene. A schematic panel, if used, must be labeled “概念示意；非论文曲线数据”.

## Prerequisite Terms

`permuted_mnist`, `fisher_overlap`, `diagonal_fisher`.

## Reconstruction Test

Can the learner describe one task's permutation, model family, test protocol, baselines, qualitative finding, and why Fisher overlap is not accuracy?

## Implementation Trace Test

This scene displays source records only. It does not instantiate or update a network, compute Fisher, or alter parameter state.

## Global Dependency Test

- **Consumes:** C04–C06, R01–R02, Scene 04's mechanism.
- **Produces:** Scoped benchmark evidence and a distinction between performance and parameter-use analysis.
- **Used later by:** Scene 06's evidence boundary.

## Deletion Test

Without selectable evidence cards, the protocol and supported-claim boundary would be buried in prose; the action lets learners inspect what each figure actually tests.

## Acceptance Questions

1. Does the page avoid claiming exact numeric values not shown in source tables?
2. Does it say each permutation is fixed within a task?
3. Does it distinguish Fisher overlap from benchmark performance?

## Accessibility

Use keyboard-accessible buttons, text-first evidence cards, visible selected state beyond color, and no hover-only notes.

## Mobile

Stack cards, metadata, and claim boundary; keep labels legible without horizontal scrolling.

## Non-goals

Do not reproduce or infer data points from a plot image; do not generalize to modern networks or all continual-learning benchmarks.
