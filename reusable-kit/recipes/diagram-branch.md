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
