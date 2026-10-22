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

1. Review the causal learning path: Can a first-time reader explain why each key mechanism is needed, rather than only repeat definitions? Check that terms and mathematical tools follow cognitive dependencies, that later pages recover context lightly, and that concepts are not prematurely introduced or fully retaught.
2. Review mathematical explanation: Does each core formula receive explanation proportionate to its role and complexity, using concrete expansion, substitution, geometric intuition, or rigorous relationships where they help? Fail a design that hides required mathematics entirely in Reference or presents an unexplained formula wall.
3. Review the complete-algorithm integration scene as an independently designed system view, not as a concatenation of earlier components. Ask the learner to reconstruct W2's real execution: inputs/initialization, core object identities, one concrete operation, important branches, state updates, cross-round inheritance, and prediction/output.
4. Inspect representative initial, intermediate, commit/handoff, and final states. Verify that prose, graphics, formulas, animation, and data read the same computation, preserve identity/ownership, and use the planned update timing. Keyword presence, a final screenshot, or a build cannot establish semantic alignment.
5. Review evidence: Trace important facts, formulas, values, dataset/protocol statements, architecture, and limits through registry IDs to source locators.
6. Review assets: Check full inventory, selection rationale, source/derivative separation, attribution, reuse rights, explanatory placement, accessibility, relative paths, and README provenance.
7. Review implementation semantics: Check that the page's data/state flow matches the model, teaching examples remain distinct, and previously accepted W4/W5 teaching effects and protected visual semantics survived local fixes.
8. Review the real runtime mapping: compare `tutorial.ts` chapter/module metadata and any `componentId` registrations with the rendered pages and interactions. The official W10 validator checks the current upstream contract; it does not prove the runtime mapping or teaching quality.
9. Record actual build, accessibility, reduced-motion, mobile, and engineering check outcomes. Report algorithm assertions, Visual QA/machine screenshots, Agent visual review, and human learning acceptance separately.
10. Save findings and verdict in `audit/final-check.md`. Complete W9 with `--reviewed-by` and `--note` only after a person accepts the learning and evidence audit.

If a W9 finding has a verified root cause that applies across papers, use the history policy in `AGENTS.md` to merge or add a concise case. Keep paper-specific decisions in the existing implementation plan; unverified observations stay in the current audit and are not promoted as general guidance.

Do not ask the reviewer to fill repeated upstream PASS rows. Record actual build and Visual QA results, runtime-mapping findings, and the person's learning/evidence verdict in the existing final-check. The user must review the rendered final page and explicitly accept W9.

## W10 Procedure

W10 is a user-triggered release gate and may begin only after the user accepts W9. Direct the user to the unique [W10 release guide](../../../docs/UPSTREAM_RELEASE.md), which uses the existing PaperSkill checkout for the official Import, validate, version commit, and preflight. Do not run PaperSkill release commands or perform push or PR actions. If the user explicitly asks for help, explain actual preflight output or repair the specific defect they identify.

After the user confirms that the official preflight passed, record W10 with `python tools/paper.py stage <paper-id> W10 complete`. The command only records progress; it does not read a machine report or inspect a PaperSkillWork export. If the result is recorded, add a short note to the existing `audit/final-check.md` with the actual official command, outcome, and PaperSkill target path. Do not create a parallel report.

## Forbidden Actions

- Do not infer learning from interaction completeness or build success.
- Do not accept a mechanically concatenated integration page, a keyword-only semantic check, or an end-state screenshot as proof that the complete execution is taught correctly.
- Do not claim checks passed when not run.
- Do not treat a public paper PDF as permission to publish its figures.
- Do not run PaperSkill release commands, push, publish, or create a PR on the user's behalf. Do not mark W9 complete without a person's review; W10 is recorded only after the user confirms the official preflight passed.

## Completion Criteria

A person records the W9 learning/evidence decision. The user performs the official PaperSkill release flow and records W10 after preflight passes. Overall status is FAIL if a core learning outcome, evidence boundary, or required asset right fails.
