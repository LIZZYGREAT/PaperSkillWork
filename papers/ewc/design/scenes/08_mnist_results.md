# Page: 08 — What do the MNIST results establish?

## Learning Goal

Analyze the reported Permuted MNIST comparisons and separate performance results from Fisher-overlap analysis.

## Knowledge Dependencies

Page 07; terms `permuted_mnist`, `fisher_overlap`, and `diagonal_fisher`. Evidence C05–C06, R01–R02.

## Persistent Objects

Evidence view `resultView ∈ {retention_comparison, task_scaling, fisher_overlap}`; methods SGD, uniform quadratic protection, EWC, and SGD + dropout; separate interpretation and boundary fields.

## System State

The selected panel explains what a figure compares, its qualitative result, and the claim limit. No numeric curve points are stored or calculated.

## Core User Actions

Switch between the reported method comparison, performance over increasing task count, and Fisher-overlap analysis. Expand evidence references to see paper locations and claim boundaries.

## State Transitions

Performance views describe the qualitative retention/new-task trade-off in the tested setting. The overlap view reports different Fisher-weighted parameter use for different input permutations, with possible reuse in later layers. Switching views must not imply overlap is a score.

## Architecture / Data Flow

Page 07's sequential fixed-permutation task protocol → compare method performance on task test sets; separately, compare normalized Fisher matrices with the paper's Fréchet-distance-derived overlap measure.

## Mathematical Model

Do not estimate plotted accuracy values. Explain only the paper's qualitative directions. For overlap, state that lower distance / greater similarity corresponds to more similar Fisher-weighted parameter use; it is not an accuracy metric.

## Implementation Mapping

Evidence tabs select static registry-linked records. The page does not load MNIST, train a network, calculate Fisher, or redraw measured curves.

## Paper Evidence

Registry C05–C06 and R01–R02; arXiv v2 Section 2.1, Figure 2A–C, Appendices 4.1 and 4.3.

## Teaching Toy Boundary

No Teaching Toy data points or invented accuracy chart. If using a schematic, mark it as conceptual and show no measured coordinates.

## Prerequisite Terms

`permuted_mnist`, `fisher_overlap`, `diagonal_fisher`.

## Reconstruction Test

Can the learner say what the method comparisons support and why the Fisher-overlap panel answers a different question?

## Implementation Trace Test

Interactions only change which evidence record is displayed; they never modify model or experiment state.

## Global Dependency Test

- **Consumes:** C05–C06, R01–R02, and page 07's protocol.
- **Produces:** A bounded performance claim plus a distinct parameter-use analysis.
- **Used later by:** Page 10's cross-experiment comparison.

## Deletion Test

Without separate evidence views, a reader could mistake parameter overlap for task accuracy or attribute a result to a different baseline panel.

## Acceptance Questions

1. Are qualitative results described without guessed curve values?
2. Is Fisher overlap explicitly not an accuracy measure?
3. Does every claim remain scoped to the tested network and protocol?

## Accessibility

Use native tabs/buttons with `aria-pressed`, selected text labels, expandable source records, and keyboard focus styling.

## Mobile

Stack comparison summaries and evidence cards; keep labels and source locations readable without horizontal scrolling.

## Non-goals

Do not infer hidden numeric points or generalize from MNIST to all continual-learning workloads.
