---
name: interaction-design
description: Specify meaningful, evidence-linked tutorial interactions for Gate G5.
---

# Interaction Design

## Purpose

Decide which concepts benefit from user action and define the learning outcome and accessible behavior for each interaction.

## Required Inputs

- `design/storyboard.md`
- `research/02_evidence_audit.md`
- `templates/interaction-plan.md`

## Preconditions

- The chapter sequence is reviewed.
- Evidence references can be resolved to the audit.

## Procedure

1. Select only concepts where changing state, testing a decision, comparing mechanisms, or tracing causality improves understanding.
2. For every interaction, specify its ID, chapter, teaching goal, initial state, user action, system response, expected insight, paper evidence, implementation form, accessibility, and edge cases.
3. Run the deletion test: name what the user would understand less if the interaction were removed.
4. Mark interactions `REMOVE / OPTIONAL` when the deletion test has no concrete answer.
5. Prefer static prose, figures, equations, or tables when they explain the idea more clearly.
6. Include keyboard access, reduced-motion behavior, mobile constraints, reset states, and a non-drag alternative where applicable.

## Output

`papers/<paper-id>/design/interaction-plan.md`

## Validation

- Every core interaction maps to a storyboard chapter and evidence audit item.
- User action, system response, and expected insight form a causal sequence.
- Decorative interactions are not presented as core learning mechanisms.
- Accessibility and edge cases are addressed.

## Forbidden Actions

- Do not write implementation code.
- Do not make an interaction core when its deletion has no learning cost.
- Do not use interactions to imply unsupported paper claims.
- Do not mark G5 complete automatically.

## Completion Criteria

The plan is specific enough to implement and review without deciding the interaction's purpose during coding.
