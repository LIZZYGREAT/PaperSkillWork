# Diagram: Merge

## Purpose
Show two or more *complete* computations converging into one update object, so the reader can see what each objective contributes and what actually receives the gradient.

## Use When
Independent comparisons or penalties must be understandable on their own before they combine — for example a preservation loss and a task loss meeting at one parameter update.

## Do Not Use When
The losses are interchangeable, the paper's combination rule is unknown, or the merge is the only thing the figure shows (in that case explain each comparison first).

## Minimum Contract
- Each input chain is complete before the merge: its two operands, the comparison, and the resulting objective are all visible.
- One merge node states the combination it applies, in real math markup (`<var>`, `<sub>`, `<sup>`), not in a serif display face standing in for notation.
- Whatever the figure does not pin down — coefficients, temperature, per-term weights — is marked as taken from the paper, and is not invented to look finished.
- One explicit update target with a state cue; anything excluded from the update says so in text.

## Recommended Foundation Pieces
`DiagramFlow` with `role: "objective"` for the comparisons and `role: "update"` for the destination; `.rk-math` for notation; `createPortDiagramPath` with `mode: "smooth"` for the converging connectors.

## Layout Rules
- Give the merge its own row or column between the two chains, so the connectors visibly converge instead of turning into a stack of arrows.
- Keep the update target visually distinct but small: the dense dark block is the anchor, not the canvas.
- If space runs out, reflow to the ordered list and keep each comparison's operands in its input line.

## Anti-patterns
- Two big coloured posters with a caption claiming the gradients combine.
- Writing `∇L_old + ∇L_new` when the paper weights the objectives, or when the weights are simply unknown.
- Hiding one objective inside a collapsed panel so only the total remains visible.

## Seen In
LwF objective composition (`reusable-kit/demo/src/figures.tsx`), where both losses finish comparing before merging into one gradient step on the student parameters.

## Copyable DiagramFlow Example

The labels below show two complete comparisons before a single update target. The structural names are illustrative; use the actual operands, objectives, and combination rule from the paper.

```tsx
import { DiagramFlow } from "./shared/foundation/layout/DiagramFlow";
import type { DiagramSpec } from "./shared/foundation/layout/DiagramFlow";

const mergeSpec: DiagramSpec = {
  columns: 5,
  nodes: [
    { id: "old", title: "Reference parameters", role: "frozen", column: 1, row: 1 },
    { id: "current", title: "Current parameters", role: "trainable", column: 1, row: 3 },
    { id: "importance", title: "Importance weights", role: "target", column: 2, row: 2 },
    { id: "preserve", title: "Preservation comparison", role: "objective", column: 3, row: 2 },
    { id: "prediction", title: "Current prediction", role: "output", column: 1, row: 5 },
    { id: "label", title: "Current label", role: "label", column: 2, row: 5 },
    { id: "task", title: "Task comparison", role: "objective", column: 3, row: 5 },
    { id: "combined", title: "Combined objective", meta: "Write the paper's rule here", role: "objective", column: 4, row: 3 },
    { id: "update", title: "Current parameters", role: "update", column: 5, row: 3 },
  ],
  edges: [
    { id: "old-preserve", from: "old", to: "preserve", kind: "data", mode: "smooth" },
    { id: "current-preserve", from: "current", to: "preserve", kind: "data", mode: "smooth" },
    { id: "importance-preserve", from: "importance", to: "preserve", kind: "control", mode: "straight" },
    { id: "prediction-task", from: "prediction", to: "task", kind: "data", mode: "smooth" },
    { id: "label-task", from: "label", to: "task", kind: "data", mode: "straight" },
    { id: "preserve-combined", from: "preserve", to: "combined", kind: "gradient", mode: "smooth" },
    { id: "task-combined", from: "task", to: "combined", kind: "gradient", mode: "smooth" },
    { id: "combined-update", from: "combined", to: "update", kind: "gradient", mode: "smooth" },
  ],
};

export function MergeExample() {
  return <DiagramFlow spec={mergeSpec} label="Two complete objectives converge on one parameter update" />;
}
```

The connector geometry is measured from the rendered nodes. Change `mode` to `straight`, `smooth`, or `orthogonal` where it clarifies the route; pin `startPort` / `endPort` only when automatic port selection grazes another object. Narrow layouts reflow into an ordered list while retaining incoming-input names.
