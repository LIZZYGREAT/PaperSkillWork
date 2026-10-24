# Mini Network Glyph

## Purpose

Show a small node-and-connection topology when the teaching point is structure, selected representative connections, or frozen/trainable identity. The glyph never computes a paper algorithm.

## Use When

- Two or more compact layers need stable identities and readable connections.
- A few representative nodes or edges need emphasis.
- The same structural vocabulary must compare frozen and trainable roles or different output widths.

## Do Not Use When

- The figure needs exact large-scale architecture fidelity, convolutional feature maps, probabilities, Fisher estimation, optimization, or class-incremental business logic.
- A block diagram communicates the architecture more honestly than circles and dense edges.
- A displayed subset could be mistaken for the paper's real node count and the caller cannot state that it is representative.

## Source and Contract

Import `MiniNetworkGlyph` from `foundation/neural-network/MiniNetworkGlyph`. The component imports its paired `mini-network-glyph.css`; scaffold the whole registered directory. Supply at least two layers with unique IDs, short labels, positive `nodeCount` values, and an accessible `label` plus `description`.

`displayNodeCount` is capped at seven. Whenever fewer nodes are drawn than `nodeCount`, the component prints the original and representative counts. Explicit connection indices address displayed nodes. `connectAdjacent` creates a full connection only when the caller opts in; it is never implied.

```tsx
import { MiniNetworkGlyph } from "./shared/foundation/neural-network/MiniNetworkGlyph";

export function StructureExample() {
  return <MiniNetworkGlyph
    label="Frozen reference and trainable output"
    description="A structural illustration; displayed nodes are representatives."
    layers={[
      { id: "input", label: "Shared input", nodeCount: 3 },
      { id: "reference", label: "Frozen reference", nodeCount: 4, identity: "frozen" },
      { id: "output", label: "Trainable output", nodeCount: 12, displayNodeCount: 6, identity: "trainable" },
    ]}
    connectAdjacent
  />;
}
```

Identity is never colour-only: frozen uses a dashed treatment; trainable uses a stronger rule. Labels remain HTML text and stack on narrow screens instead of shrinking with the SVG. The implementation has no EWC, iCaRL, LwF, class, loss, or gradient field.

## Provenance

The reusable responsibility was extracted from the fixed 3–5–3 node mark in `papers/ewc/web/enhanced/src/shared/teaching/EWCNetworkDiagram.tsx`. `papers/icarl/web/enhanced/src/components/SharedTrainingHead.tsx` was used only to test output-width composition and to preserve the distinction between a fully connected node glyph and a CNN feature-block diagram. Frozen/trainable identity was checked against LwF's Teacher/Student language; no paper scene or business state was copied.
