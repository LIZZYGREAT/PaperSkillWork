# Failure Injection

## Purpose
Localize failure by introducing a documented fault at a specific layer.

## Use When
The paper contains a real multi-layer failure handling or safety mechanism.

## Do Not Use When
Failure handling is not central or a fault would be invented for the lesson.

## Minimum Interaction
Choose one layer and show the affected path plus the documented response.

## Recommended Components
Future `FaultInjectionStack` P2 pattern and `StateMachineExplorer` for recovery states.

## Teaching Goal
Explain where the failure is detected and what state or output changes.

## Anti-patterns
Do not add dramatic failure animations or conflate a hypothetical fault with paper evidence.

## Example from Existing Paper
Use the pattern only when the source describes a concrete, layered failure response.
