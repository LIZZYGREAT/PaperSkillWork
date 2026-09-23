---
name: enhanced-implementation
description: Implement the Enhanced tutorial from the accepted research, evidence, narrative, interaction, and canonical inputs for Gate G6.
---

# Enhanced Implementation

## Purpose

Build the Enhanced tutorial while preserving factual boundaries and making each core interaction traceable to an approved plan.

## Required Inputs

- `web/canonical/` as the baseline, when available
- `research/01_review.md`
- `research/02_evidence_audit.md`
- `design/storyboard.md`
- `design/interaction-plan.md`
- The existing Enhanced project, if this is an iteration

## Preconditions

- G1 and G2 are complete or explicitly treated as legacy migration inputs.
- Narrative and interaction decisions have been reviewed.
- Confirm the exact paper workspace and permitted files before editing.

## Procedure

1. Use the evidence audit for facts, storyboard for narrative, interaction plan for behavior, and canonical for baseline structure.
2. Inspect project scripts and existing conventions before changing code.
3. Implement core interactions with keyboard access, visible focus, reset behavior, and non-drag controls when dragging is offered.
4. Respect `prefers-reduced-motion` and verify basic mobile layout.
5. Keep every interaction linked to an interaction-plan entry; use static explanation where interaction adds no insight.
6. Run the project's existing build and audit commands, without silently installing or updating dependencies.
7. Review the changed-file scope and keep dependencies and build output out of Git.

## Output

An Enhanced application under `papers/<paper-id>/web/enhanced/`.

## Validation

- Production build and project-defined audit pass.
- Major interaction states and reset behavior work.
- Keyboard, reduced-motion, and mobile behavior are checked.
- Core facts match the evidence audit and the canonical baseline remains separate.

## Forbidden Actions

- Do not redefine the paper's central story or evidence strength in code.
- Do not overwrite or modify the canonical artifact.
- Do not make hover the only access to a core action.
- Do not commit `node_modules/` or build output.
- Do not commit to or publish from the separate PaperSkill repository.
- Do not mark G6 complete automatically.

## Completion Criteria

The implementation passes its declared checks and is ready for human interaction, mobile, and fact acceptance.
