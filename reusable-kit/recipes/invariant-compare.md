# Invariant Comparison

## Purpose
Compare two methods while naming both the change and the properties that remain fixed.

## Use When
The paper changes one part of a baseline while preserving the rest of the setup.

## Do Not Use When
The variants differ in many uncontrolled dimensions and cannot be compared fairly.

## Minimum Interaction
Place variants side by side and list the changed and invariant properties.

## Recommended Components
`CompareView`, `CompatibilityChecker`, and `EvidenceViewer` if results are compared.

## Teaching Goal
Attribute observed differences to the right method change and conditions.

## Anti-patterns
Do not call unmatched protocols a controlled comparison.

## Example from Existing Paper
Fine-tuning and LwF can be contrasted around the added old-response distillation objective.
