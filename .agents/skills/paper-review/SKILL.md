---
name: paper-review
description: Read a research paper and produce a source-grounded structured review for Gate G1.
---

# Paper Review

## Purpose

Understand the paper's problem, motivation, idea, mechanism, experiments, and limitations before designing a tutorial.

## Required Inputs

- `papers/<paper-id>/paper.yaml`
- The source paper PDF at the declared local path, or an explicitly provided paper source
- `templates/research-review.md`

## Preconditions

- Confirm the paper id and title from `paper.yaml`.
- If the paper source is unavailable, stop and report what is missing; do not fill gaps from memory.
- Preserve the paper's own terminology and version.

## Procedure

1. Read the full paper, noting section, page, figure, table, and equation references for key claims.
2. Explain the problem and why prior approaches are insufficient.
3. State the paper's idea and distinguish system engineering from algorithmic contribution.
4. Define important prerequisites and terms before relying on them.
5. Explain variables before equations; identify whether each equation is a model, loss, system abstraction, or descriptive expression.
6. Trace the architecture and end-to-end state or information flow, including failure and feedback paths.
7. Describe experiment questions, datasets, baselines, metrics, protocols, and what results do and do not support.
8. Separate author-stated limitations and future work from your own analysis.
9. Fill the review template in the paper workspace.

## Output

`papers/<paper-id>/research/01_review.md`

## Validation

- The review can reconstruct Problem → Motivation → Idea → Mechanism → Experiment → Limitation.
- Key factual claims have traceable source locations.
- Variables are defined before use and formula types are named.
- No result or conclusion has been invented.

## Forbidden Actions

- Do not design web pages or write React.
- Do not invent claims, numbers, or capabilities absent from the source.
- Do not conflate a system implementation with an algorithmic contribution.
- Do not mark G1 complete automatically.

## Completion Criteria

The review is saved and checked against the source. Ask the user to inspect it, then explain that G1 may be marked complete with `python3 tools/paper.py gate <paper-id> G1 complete` after verification.
