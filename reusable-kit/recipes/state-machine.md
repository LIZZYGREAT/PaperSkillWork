# State Machine

## Purpose
Explain legal process states, transitions, and the consequences of skipping a phase.

## Use When
The method stores state across tasks or requires ordered training, estimation, or verification phases.

## Do Not Use When
The process has no meaningful state boundary or ordering constraint.

## Minimum Interaction
Show the current state, allow a legal transition, and explain rejected transitions.

## Recommended Components
`StateMachineExplorer` with a concise `FlowStepper` if the state graph is linear.

## Teaching Goal
Show what becomes available or is lost at each state boundary.

## Anti-patterns
Do not present an arbitrary sequence as a formal state machine or invent illegal transitions.

## Example from Existing Paper
EWC separates task training, Fisher estimation, stored importance, and later penalized training.
