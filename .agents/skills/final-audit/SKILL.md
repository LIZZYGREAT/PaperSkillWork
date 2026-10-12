---
name: final-audit
description: Audit learner reconstruction, source evidence, accessibility, and upstream export for Workflow v3 stages W9–W10.
---

# Final Audit — W9/W10

## Purpose

Decide whether the finished tutorial teaches the approved main line, respects evidence boundaries, and can be released as an independent upstream project. Build success alone is not a pass.

## Required Inputs

- Source cache, Paper Model, Evidence Registry, Learning Spine, Asset Plan, and Implementation Plan
- Full tutorial project, release identifiers in `paper.yaml`, and export under `html_output/<paper-name>/<version>/`
- `audit/final-check.md`
- `audit/upstream-preflight.json` after running upstream-check
- Declared build and audit commands

## W9 Procedure

Use docs/VISUAL_QA.md and record BUILD, GEOMETRY_QA, VISUAL_REVIEW, REGRESSION, and HUMAN_ACCEPTANCE separately in the existing final-check template. Include real commands, checked states and viewports, screenshot/report locations, and any NOT_RUN reason. VISUAL_REVIEW requires screenshots actually inspected; keep it NOT_RUN when that evidence is absent. Keep HUMAN_ACCEPTANCE PENDING until the user reviews the rendered result. A successful build or geometry check is not a visual or learning PASS.

1. Review learning: Can a first-time reader state the problem/idea, reconstruct architecture and flow, explain training/inference and design rationale, summarize key results, and state limitations?
2. Review evidence: Trace important facts, formulas, values, dataset/protocol statements, architecture, and limits through registry IDs to source locators.
3. Review assets: Check full inventory, selection rationale, source/derivative separation, attribution, reuse rights, explanatory placement, accessibility, relative paths, and README provenance.
4. Review implementation semantics: Check that the page's data/state flow matches the model and that teaching examples are distinct.
5. Review the real runtime mapping: compare `tutorial.ts` chapter/module metadata and any `componentId` registrations with the rendered pages and interactions. The official validator checks the current upstream contract; it does not prove the runtime mapping or teaching quality.
6. Record actual build, accessibility, reduced-motion, mobile, and engineering check outcomes.
7. Save findings and verdict in `audit/final-check.md`. Complete W9 with `--reviewed-by` and `--note` only after a person accepts the learning and evidence audit.

Do not ask the reviewer to fill repeated upstream PASS rows. Record actual build and Visual QA results, runtime-mapping findings, and the person's learning/evidence verdict in the existing final-check. The user must review the rendered final page and explicitly accept W9.

## W10 Procedure

1. Read paper title, authors, URL, venue, and year from `paper.yaml`. Derive the upstream paper name from its English title and the version from the contributor pinyin and submission date. Read shared contributor defaults from global Git config (`paperskillwork.participant`, `paperskillwork.pinyin`, `paperskillwork.github`); explicit CLI values override them. Do not reuse paper-author names as contributor identity.
2. Run `python tools/paper.py upstream-check <paper-id> --paperskill-repo <path>`. The command prepares release names, imports into an isolated clone, rejects changed paths outside `release.output`, commits only the tutorial on a local-only branch, then runs official validation, build, and preflight against that temporary commit. It does not write into the supplied PaperSkill checkout or its Git configuration.
3. Inspect `audit/upstream-preflight.json`. W10 requires distinct upstream and temporary commit SHAs, changed paths confined to `release.output`, no unexpected paths, successful exit codes for all commands, and an export SHA-256 matching the copied output.
4. Auto-generated versions check the target paper directory and select the next free `_2`, `_3`, etc. suffix when needed. An explicitly configured version that already exists fails without overwriting upstream content. `--replace-output` applies only to the local generated export. Do not push, publish, or create a PR from this skill.

## Forbidden Actions

- Do not infer learning from interaction completeness or build success.
- Do not claim checks passed when not run.
- Do not treat a public paper PDF as permission to publish its figures.
- Do not push, publish, or create a PR. Do not mark W9 complete without a person's review; W10 is automatic only after the machine preflight and export checks pass.

## Completion Criteria

A person records the W9 learning/evidence decision. W10 reads the generated preflight report. Overall status is FAIL if a core learning outcome, evidence boundary, or required asset right fails.
