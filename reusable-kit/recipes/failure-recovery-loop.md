# Failure and Recovery Loop

## Purpose
Show how a failed attempt changes state, preserves evidence, and enters recovery.

## Use When
Failure handling or retry behavior is part of the source method.

## Do Not Use When
The paper only reports a final score and says nothing about failure or recovery.

## Minimum Interaction
Trace one failure state into the documented recovery or next attempt.

## Recommended Components
`StateMachineExplorer`, `ProcessLoopExplorer`, and `EvidenceViewer`.

## Teaching Goal
Explain whether recovery reuses, changes, or discards prior state.

## Anti-patterns
Do not invent retries or present an implementation convenience as an author claim.

## Example from Existing Paper
Use only where a continual-learning method specifies what state survives a failed task update.
