# Process Loop

## Purpose
Keep the complete algorithm or system visible while explaining one step at a time.

## Use When
The reader needs to connect data, state, losses, updates, or control signals across a whole process.

## Do Not Use When
A short list or static paper figure already explains the sequence.

## Minimum Interaction
Previous/next and step selection; highlight only the nodes and edges involved in the current step.

## Recommended Components
`ProcessLoopExplorer`, optionally `FlowStepper` and `StickySystemView`.

## Teaching Goal
Let a learner trace one complete causal path without losing the global system.

## Anti-patterns
Do not animate unrelated decoration, hide inactive system parts, or put the paper's conclusions inside the component.

## Example from Existing Paper
LwF can trace a new task through shared features, old/new heads, losses, and the next teacher state.
