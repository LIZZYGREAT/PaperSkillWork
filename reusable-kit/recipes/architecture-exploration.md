# Architecture Exploration

## Purpose
Make components, branches, shared modules, and parameter status inspectable.

## Use When
Understanding the method depends on where inputs travel or which modules are shared, frozen, or updated.

## Do Not Use When
The architecture is a simple sequence that needs no structural explanation.

## Minimum Interaction
Select a node, highlight one relevant path, and disclose collapsed groups on request.

## Recommended Components
`ArchitectureExplorer`, `PaperFigure`, and a short `FlowStepper` when order matters.

## Teaching Goal
Let a learner identify ownership and reconstruct the path through the architecture.

## Anti-patterns
Avoid a free-form graph editor, arbitrary node dragging, or unlabeled edges.

## Example from Existing Paper
LwF's network can distinguish a shared representation from task-specific output heads.
