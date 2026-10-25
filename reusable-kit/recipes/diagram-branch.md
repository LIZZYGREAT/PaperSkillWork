# Diagram: Branch

## Purpose
Show one source that really splits into labelled branches, each with its own destination, so a reader can tell *which* path produced *which* object.

## Use When
A single input, state, or parameter feeds two or more roles with different meanings — for example one input entering a frozen reference path and a trainable path, or one stored state feeding two different penalties.

## Do Not Use When
The branches have no distinct identities, the split is only a list of examples, or a plain paragraph already says which object came from where.

## Minimum Contract
- One visible source node with its own label and identity.
- One node per branch, each carrying an explicit state cue (frozen / trainable / target) as text, not colour alone.
- A connector per branch that starts at the source boundary and ends at the branch boundary.
- A resolvable answer to "which branch receives updates and which does not".

## Recommended Foundation Pieces
`DiagramFlow` (`foundation/layout/DiagramFlow`) with `role: "input" | "frozen" | "trainable" | "target"`, plus `createPortDiagramPath` when the geometry is authored by hand.

## Layout Rules
- Reflow, never scale to fit. When the figure would need columns narrower than ~124px, `DiagramFlow` switches to an ordered list that names each node's inputs.
- Keep in-figure titles at 14px or larger; secondary notes may go down to 12px.
- Put identity inside the node. Use connector labels only when the identity cannot live in a node, and never let a label cover a connector.

## Anti-patterns
- Two equally weighted coloured blocks with a decorative arrow between them and no visible source.
- Text arrows (`→`) standing in for a real branch, so the reader cannot tell where a path starts or ends.
- Encoding the frozen/trainable difference only in hue.

## Seen In
LwF (frozen teacher lane versus trainable student backbone) and the EWC task-A chain, both in `reusable-kit/demo/src/figures.tsx`.

## Copyable DiagramFlow Example

This is a complete, runnable structural illustration. It distinguishes the frozen reference from the trainable path, supplies the current label used by the task comparison, and combines objective contributions before the update edge. Replace the labels and relationships with facts from the paper; the component does not supply algorithm semantics.

```tsx
import { DiagramFlow } from "./shared/foundation/layout/DiagramFlow";
import type { DiagramSpec } from "./shared/foundation/layout/DiagramFlow";

const branchSpec: DiagramSpec = {
  columns: 5,
  nodes: [
    { id: "sample", title: "输入样本 xₜ", role: "input", column: 1, row: 2 },
    { id: "task", title: "当前任务 t", role: "label", column: 1, row: 4 },
    { id: "teacher", title: "冻结参考模型", role: "frozen", column: 2, row: 1 },
    { id: "student", title: "可训练模型", role: "trainable", column: 2, row: 3 },
    { id: "target", title: "旧类响应目标", role: "target", column: 3, row: 1 },
    { id: "prediction", title: "当前预测", role: "output", column: 3, row: 3 },
    { id: "label", title: "当前真实标签 y", role: "label", column: 3, row: 5 },
    { id: "old-loss", title: "响应比较", role: "objective", column: 4, row: 1 },
    { id: "new-loss", title: "标签比较", role: "objective", column: 4, row: 4 },
    { id: "combined", title: "组合目标", role: "objective", column: 5, row: 2 },
    { id: "update", title: "student 参数", role: "update", column: 5, row: 4 },
  ],
  edges: [
    { id: "input-teacher", from: "sample", to: "teacher", kind: "data", mode: "smooth" },
    { id: "input-student", from: "sample", to: "student", kind: "data", mode: "smooth" },
    { id: "teacher-target", from: "teacher", to: "target", kind: "data", mode: "straight" },
    { id: "student-prediction", from: "student", to: "prediction", kind: "data", mode: "straight" },
    { id: "task-control", from: "task", to: "student", kind: "control", mode: "orthogonal" },
    { id: "target-old-loss", from: "target", to: "old-loss", kind: "data", mode: "smooth" },
    { id: "prediction-old-loss", from: "prediction", to: "old-loss", kind: "data", mode: "smooth" },
    { id: "prediction-new-loss", from: "prediction", to: "new-loss", kind: "data", mode: "smooth" },
    { id: "label-new-loss", from: "label", to: "new-loss", kind: "data", mode: "straight" },
    { id: "old-loss-combined", from: "old-loss", to: "combined", kind: "data", mode: "smooth" },
    { id: "new-loss-combined", from: "new-loss", to: "combined", kind: "data", mode: "smooth" },
    { id: "combined-update", from: "combined", to: "update", kind: "gradient", mode: "smooth" },
  ],
  note: "Solid = inputs and objective contributions; dotted = task control; dashed = gradient from the combined objective to the update target.",
};

export function BranchExample() {
  return <DiagramFlow spec={branchSpec} label="One input follows frozen and trainable paths before objective comparison and update" />;
}
```

Solid connectors mean input data or objective-term contribution, dotted connectors mean task control, and the dashed connector means the combined objective's gradient reaches the update target. The sample and task marker are distinct; the task marker is not a label for the loss. Use `focus={{ nodes, edges }}` to emphasize one path while keeping the surrounding structure visible. Changing `mode` only changes connector geometry, not this edge meaning. At narrow widths, `DiagramFlow` reflows the same spec into an ordered list; do not scale the diagram down or replace connectors with text arrows.
