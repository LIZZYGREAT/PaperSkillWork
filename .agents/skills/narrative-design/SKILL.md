---
name: narrative-design
description: Turn reviewed paper evidence into a coherent teaching sequence for Gate G4.
---

# Narrative Design

## Purpose

Design a learning path that answers the reader's questions in a deliberate order rather than mirroring paper sections.

## Required Inputs

- `research/01_review.md`
- `research/02_evidence_audit.md`
- `templates/storyboard.md`

## Preconditions

- G1 and G2 inputs exist and have been reviewed.
- Teaching claims can be traced to the evidence audit.

## Procedure

1. Define the knowledge a reader brings in and the central idea they should leave with.
2. Build a chain of questions: what problem appears, why current approaches fail, what the paper changes, how the mechanism works, and what the experiments establish.
3. For every chapter, state what the user knows beforehand, the chapter question, its learning goal, its evidence, the resulting understanding, and why the next chapter follows.
4. Choose which concepts need prose, figures, formulas, tables, or a candidate interaction.
5. If a teaching analogy is useful, map its elements to paper concepts and state where the analogy stops applying.
6. Identify material to keep, simplify, omit, or leave as supplemental.
7. Save and self-review the storyboard.

## Output

`papers/<paper-id>/design/storyboard.md`

## Validation

- Each chapter solves one cognitive problem and has a clear transition.
- The story is not a mechanical retelling of the paper's table of contents.
- Core claims remain within the evidence audit.
- Analogy boundaries are explicit.

## Forbidden Actions

- Do not write React or specify animation micro-details.
- Do not alter the paper's facts or evidence strength.
- Do not make every section interactive by default.
- Do not mark G4 complete automatically.

## Completion Criteria

The storyboard communicates the full teaching sequence without reading application code and is ready for human review.
