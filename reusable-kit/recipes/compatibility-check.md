# Compatibility Check

## Purpose
Compare a method's requirements with the capabilities available in a system.

## Use When
Interface shape, data type, head dimensions, or runtime support constrains whether modules can work together.

## Do Not Use When
Compatibility is not part of the method or can be stated as a short note.

## Minimum Interaction
Mark each requirement as pass, fail, or needing an adapter and explain the result.

## Recommended Components
`CompatibilityChecker` and `ArchitectureExplorer` for affected modules.

## Teaching Goal
Expose assumptions and show the exact boundary that needs an adapter.

## Anti-patterns
Do not turn unsupported assumptions into a green check without evidence.

## Example from Existing Paper
PhyAgentOS Preflight checks whether a requested execution protocol matches available runtime capabilities.
