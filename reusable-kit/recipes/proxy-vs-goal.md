# Proxy versus Goal

## Purpose
Show why a convenient proxy measurement can disagree with the real objective.

## Use When
The paper distinguishes a parameter-, loss-, or metric-level proxy from functional behavior.

## Do Not Use When
The paper gives no basis for the proposed counterexample.

## Minimum Interaction
Present one minimal counterexample and identify the proxy and true goal separately.

## Recommended Components
`CompareView`, `EvidenceViewer`, and `InlineCallout`.

## Teaching Goal
Prevent readers from interpreting proxy success as proof of goal success.

## Anti-patterns
Do not claim that small parameter distance always produces large function drift, or the reverse.

## Example from Existing Paper
For continual learning, parameter distance and function drift are distinct quantities and must be tied to the paper's conditions.
