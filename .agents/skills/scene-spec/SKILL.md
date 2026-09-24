---
name: scene-spec
description: Specify only the scenes needed to teach and reconstruct the paper mechanisms for Gate G5.
---

# Scene Specification

## Purpose

Make each core scene implementable and reviewable as part of one connected mental model.

## Required Inputs

- `design/learning-contract.md`
- `design/learning-architecture.md`
- `research/01_paper_model.md`
- `research/02_evidence_registry.yaml`
- `templates/scene-spec.md`

## Procedure

1. Create scene files only for scenes identified by the Learning Architecture.
2. Fill the complete scene template: goal, dependencies, persistent objects, state, actions, transitions, data flow, math, implementation mapping, evidence, teaching-toy boundary, terms, tests, accessibility, mobile, and non-goals.
3. Run the Reconstruction Test: name what the learner will draw or explain without the page.
4. Run the Implementation Trace Test: identify object, location, lifecycle, producer, consumer, mutation, non-mutation, and applicable shape/gradient/optimizer details.
5. Run the Global Dependency Test: record `Consumes`, `Produces`, and `Used later by` so outputs connect across scenes.
6. Run the Deletion Test for each interaction. If deletion has no specific learning cost, remove or mark the interaction optional. Passing deletion does not excuse a failed reconstruction test.
7. Link evidence and prerequisite IDs and check that they resolve.
8. Choose an interaction category only when an action contributes to learning: `RECONSTRUCTION`, `TRACE`, `COUNTERFACTUAL`, `PARAMETER_EXPLORATION`, `EVIDENCE_INSPECTION`, `DIAGNOSTIC`, or `REFERENCE`.

## Validation

- All core scenes pass all three reconstruction/trace/dependency tests.
- Any interaction has an explicit deletion benefit.
- No main-path knowledge is hidden only in hover.
- Keyboard, focus, reduced-motion, reset, non-drag alternative, and mobile constraints are addressed where applicable.

## Forbidden Actions

- Do not add interaction-pattern quotas, animation quotas, or Canvas requirements.
- Do not implement the scene here.
- Do not use an interaction to imply unsupported paper evidence.
- Do not advance G5 automatically.

## Completion Criteria

Scene specifications are connected, evidence-linked, and precise enough for implementation without inventing their learning purpose.
