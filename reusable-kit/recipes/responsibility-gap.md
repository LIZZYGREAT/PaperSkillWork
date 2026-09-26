# Responsibility Gap

## Purpose
Show which actor owns each process step and where responsibility is missing or shared.

## Use When
The paper's contribution changes module roles, ownership, or a missing capability.

## Do Not Use When
There is only one actor or responsibility is already obvious from a small table.

## Minimum Interaction
Select a process step to highlight its owners; select an actor to reveal covered steps.

## Recommended Components
`ResponsibilityMap`, with `InlineCallout` for a concise conclusion.

## Teaching Goal
Explain why each actor or constraint exists in the method.

## Anti-patterns
Do not invent a missing owner to make the map look complete or conflate a module with a paper claim.

## Example from Existing Paper
PhyAgentOS's Role Map motivates its system layer by identifying process duties that current actors do not cover.
