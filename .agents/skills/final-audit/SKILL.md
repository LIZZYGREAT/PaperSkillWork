---
name: final-audit
description: Audit learner reconstruction, source evidence, accessibility, and upstream export for Workflow v3 stages W9–W10.
---

# Final Audit — W9/W10

## Purpose

Decide whether the finished tutorial teaches the approved main line, respects evidence boundaries, and can be released as an independent upstream project. Build success alone is not a pass.

## Required Inputs

- Source cache, Paper Model, Evidence Registry, Learning Spine, Asset Plan, and Implementation Plan
- Full tutorial project and its metadata in `paper.yaml`
- `audit/final-check.md`
- A user-confirmed result from the official PaperSkill preflight, if W10 has been completed
- Declared build and audit commands

## W9 Procedure

Use docs/VISUAL_QA.md and record BUILD, GEOMETRY_QA, VISUAL_REVIEW, REGRESSION, and HUMAN_ACCEPTANCE separately in the existing final-check template. Include real commands, checked states and viewports, screenshot/report locations, and any NOT_RUN reason. VISUAL_REVIEW requires screenshots actually inspected; keep it NOT_RUN when that evidence is absent. Keep HUMAN_ACCEPTANCE PENDING until the user reviews the rendered result. A successful build or geometry check is not a visual or learning PASS.

1. Review learning: Can a first-time reader state the problem/idea, reconstruct architecture and flow, explain training/inference and design rationale, summarize key results, and state limitations?
2. Review evidence: Trace important facts, formulas, values, dataset/protocol statements, architecture, and limits through registry IDs to source locators.
3. Review assets: Check full inventory, selection rationale, source/derivative separation, attribution, reuse rights, explanatory placement, accessibility, relative paths, and README provenance.
4. Review implementation semantics: Check that the page's data/state flow matches the model and that teaching examples are distinct.
5. Review the real runtime mapping: compare `tutorial.ts` chapter/module metadata and any `componentId` registrations with the rendered pages and interactions. The official W10 validator checks the current upstream contract; it does not prove the runtime mapping or teaching quality.
6. Record actual build, accessibility, reduced-motion, mobile, and engineering check outcomes.
7. Save findings and verdict in `audit/final-check.md`. Complete W9 with `--reviewed-by` and `--note` only after a person accepts the learning and evidence audit.

Do not ask the reviewer to fill repeated upstream PASS rows. Record actual build and Visual QA results, runtime-mapping findings, and the person's learning/evidence verdict in the existing final-check. The user must review the rendered final page and explicitly accept W9.

## W10 Procedure

W10 is a user-triggered release gate and may begin only after the user accepts W9. Direct the user to the unique [W10 release guide](../../../docs/UPSTREAM_RELEASE.md), which uses the existing PaperSkill checkout for the official Import, validate, version commit, and preflight. Do not run PaperSkill release commands or perform push or PR actions. If the user explicitly asks for help, explain actual preflight output or repair the specific defect they identify.

After the user confirms that the official preflight passed, record W10 with `python tools/paper.py stage <paper-id> W10 complete`. The command only records progress; it does not read a machine report or inspect a PaperSkillWork export. If the result is recorded, add a short note to the existing `audit/final-check.md` with the actual official command, outcome, and PaperSkill target path. Do not create a parallel report.

## Forbidden Actions

- Do not infer learning from interaction completeness or build success.
- Do not claim checks passed when not run.
- Do not treat a public paper PDF as permission to publish its figures.
- Do not run PaperSkill release commands, push, publish, or create a PR on the user's behalf. Do not mark W9 complete without a person's review; W10 is recorded only after the user confirms the official preflight passed.

## Completion Criteria

A person records the W9 learning/evidence decision. The user performs the official PaperSkill release flow and records W10 after preflight passes. Overall status is FAIL if a core learning outcome, evidence boundary, or required asset right fails.
