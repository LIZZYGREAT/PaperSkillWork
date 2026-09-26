---
name: final-audit
description: Audit learner reconstruction, source evidence, accessibility, and upstream export for Workflow v3 stages W9–W10.
---

# Final Audit — W9/W10

## Purpose

Decide whether the finished tutorial teaches the approved main line, respects evidence boundaries, and can be released as an independent upstream project. Build success alone is not a pass.

## Required Inputs

- Source cache, Paper Model, Evidence Registry, Learning Spine, Asset Plan, and Implementation Plan
- Full tutorial project and export under `html_output/<paper-name>/<version>/`
- `audit/final-check.md`
- Declared build and audit commands

## W9 Procedure

1. Review learning: Can a first-time reader state the problem/idea, reconstruct architecture and flow, explain training/inference and design rationale, summarize key results, and state limitations?
2. Review evidence: Trace important facts, formulas, values, dataset/protocol statements, architecture, and limits through registry IDs to source locators.
3. Review assets: Check full inventory, selection rationale, source/derivative separation, attribution, reuse rights, explanatory placement, accessibility, relative paths, and README provenance.
4. Review implementation semantics: Check that the page's data/state flow matches the model and that teaching examples are distinct.
5. Record actual build, accessibility, reduced-motion, mobile, and engineering check outcomes.
6. Save findings and verdict in `audit/final-check.md`.

## W10 Procedure

1. Check required upstream files, independent build/dependencies, relative image paths, README asset provenance, and absence of the paper PDF.
2. Confirm the tutorial-only PR scope is exactly `html_output/<paper-name>/<version>/`.
3. Run the official latest-upstream validator/preflight and record its command, upstream revision, and actual output. Do not claim that passing CI guarantees merge.
4. Keep any future workflow/skill contribution in a separate PR.

## Forbidden Actions

- Do not infer learning from interaction completeness or build success.
- Do not claim checks passed when not run.
- Do not treat a public paper PDF as permission to publish its figures.
- Do not push, import, publish, create a PR, or mark stages complete automatically.

## Completion Criteria

A person records the W9 learning/evidence decision and W10 preflight result. Overall status is FAIL if a core learning outcome, evidence boundary, or required asset right fails.
