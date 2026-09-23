---
name: evidence-audit
description: Audit paper claims, results, explanations, analogies, and future work for Gate G2.
---

# Evidence Audit

## Purpose

Set clear evidence boundaries for every important statement that may appear in the tutorial.

## Required Inputs

- The source paper PDF or other explicitly supplied source
- `papers/<paper-id>/research/01_review.md`
- `templates/evidence-audit.md`

## Preconditions

- The review exists and the paper version is identified.
- If the source and review conflict, preserve the conflict and report it.

## Procedure

1. Audit claims, architecture, equations, figures, benchmarks, numbers, conclusions, limitations, and future work.
2. Assign each statement one category: `PAPER_FACT`, `PAPER_RESULT`, `AUTHOR_INTERPRETATION`, `OUR_INTERPRETATION`, `TEACHING_ANALOGY`, or `FUTURE_WORK`.
3. Record source locations and distinguish architecture design, current implementation, experimental validation, and planned capability.
4. Recheck numerical values with their metric, baseline, protocol, and table or figure location.
5. Record paper-internal contradictions or uncertainty without silently choosing a version.
6. State what the tutorial may claim directly, what needs qualification, and what cannot be inferred.
7. Save the completed audit in the paper workspace.

## Output

`papers/<paper-id>/research/02_evidence_audit.md`

## Validation

- Every high-impact claim has a category and source location.
- Experimental values are tied to the right metric and protocol.
- Analogies and our interpretation are visibly distinct from paper facts.
- Contradictions and unverified capabilities remain visible.

## Forbidden Actions

- Do not conceal conflicts in the paper.
- Do not "correct" the paper using general knowledge without recording a separate interpretation.
- Do not treat planned work as implemented or validated.
- Do not advance G3 or alter gate status.

## Completion Criteria

The audit is saved, all requested claim classes are checked, and unresolved items are documented for human review.
