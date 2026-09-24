---
name: paper-review
description: Build a source-grounded executable model of a paper for Gate G1.
---

# Paper Review

## Purpose

Establish what the paper's objects are, where they live, how they interact and change, what its evidence supports, and where the method stops. Do not summarize the paper chapter by chapter.

## Required Inputs

- `papers/<paper-id>/paper.yaml`
- The source paper at its declared path, or an explicitly supplied source
- `design/learning-contract.md`
- `templates/paper-model.md`

## Preconditions

- Confirm the paper id, title, and source version.
- If the source is unavailable, report what is missing; do not fill gaps from memory.
- Read the target reader and prerequisites in the Learning Contract.

## Procedure

1. Read the full paper and capture page, section, figure, table, and equation locations for important claims.
2. Explain the problem and why existing approaches are insufficient.
3. Build a prerequisite map with `Required`, `Helpful`, or `Optional` level and the depth needed.
4. Register core objects and variables before relying on them in equations or prose.
5. Trace architecture and ownership, state/lifecycle, data or tensor flow, transformations, gradients/control signals, optimizer membership, and actual updates where applicable.
6. Complete the Reconstruction Matrix for core objects; use `N/A` with a reason when a column does not apply.
7. Reconstruct end-to-end runtime, including feedback and failure paths.
8. Explain experiments by question, dataset/environment, model, split, metric, baseline, protocol, result, supported claim, and unsupported inference.
9. Separate author-stated limitations and future work from our analysis.
10. Save `research/01_paper_model.md`. Do not propose UI, animation, interactions, or page layouts.

## Validation

- A reader can follow Problem → Objects → Mechanism → Update → Experiment → Limit.
- Variables are defined before use and equations have named inputs, outputs, and roles.
- Core objects can be placed in an architecture and traced over time.
- Evidence locations are specific enough for the Evidence Registry.
- No claim, value, or capability is invented.

## Forbidden Actions

- Do not design web pages or interactions.
- Do not conflate implementation details with paper claims.
- Do not claim semantic or learning acceptance based on structure alone.
- Do not advance G1 automatically.

## Completion Criteria

Save the model and check it against the source. Ask a person to verify it before marking G1 complete.
