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
- `audit/upstream-source-check.json` for W8 source validation evidence
- `audit/upstream-preflight.json` after running upstream-check
- Declared build and audit commands

## W9 Procedure

Use docs/VISUAL_QA.md and record BUILD, GEOMETRY_QA, VISUAL_REVIEW, REGRESSION, and HUMAN_ACCEPTANCE separately in the existing final-check template. Include real commands, checked states and viewports, screenshot/report locations, and any NOT_RUN reason. VISUAL_REVIEW requires screenshots actually inspected; keep it NOT_RUN when that evidence is absent. Keep HUMAN_ACCEPTANCE PENDING until the user reviews the rendered result. A successful build or geometry check is not a visual or learning PASS.

1. Review learning: Can a first-time reader state the problem/idea, reconstruct architecture and flow, explain training/inference and design rationale, summarize key results, and state limitations?
2. Review evidence: Trace important facts, formulas, values, dataset/protocol statements, architecture, and limits through registry IDs to source locators.
3. Review assets: Check full inventory, selection rationale, source/derivative separation, attribution, reuse rights, explanatory placement, accessibility, relative paths, and README provenance.
4. Review implementation semantics: Check that the page's data/state flow matches the model and that teaching examples are distinct.
5. Review upstream release compatibility: verify the checked source path matches the configured Final (if present) or Enhanced source; inspect the full official validator result and upstream commit/script/contract fingerprints; confirm source and build evidence are current; and compare `tutorial.ts` chapter/module metadata and any `componentId` registrations with the real runtime pages. Official structure PASS does not prove the runtime mapping or teaching quality.
6. Record actual build, accessibility, reduced-motion, mobile, and engineering check outcomes.
7. Save findings and verdict in `audit/final-check.md`. Complete W9 with `--reviewed-by` and `--note` only after a person accepts the learning and evidence audit.

The W9 record must distinguish these release checks:

| Check | Requirement |
| --- | --- |
| `UPSTREAM_SOURCE_STRUCTURE` | Current configured publish-source path and required structure were checked. |
| `UPSTREAM_OFFICIAL_VALIDATE_OUTPUT` | The official source validator returned `RESULT: PASS`; its PaperSkill commit, validator/contract hashes, and matching source fingerprint are recorded. |
| `UPSTREAM_RELEASE_SOURCE_BUILD` | `npm ci` and `npm run build` passed in that same publish source. |
| `RUNTIME_MAPPING_REVIEW` | Chapter/module metadata and any component registrations map to real rendered pages/interactions; no quota filler is used. |

Use NOT_RUN when evidence is absent. A build, Visual QA, TypeScript check, or structure-only report cannot replace the official validator result.

## W10 Procedure

1. Set `release.upstream_paper_name`, `release.upstream_version`, and matching `release.output`; these are separate from the internal `paper_id`.
2. Update the clean PaperSkill checkout to the intended commit, then run `python tools/paper.py upstream-check <paper-id> --paperskill-repo <path> --participant <name>`. Supply `--pinyin` for a non-ASCII participant and `--github` when applicable. The command imports into an isolated clone, rejects changed paths outside `release.output`, commits only the tutorial on a local-only branch, then runs official validation, build, and preflight against that temporary commit. It does not write into the supplied PaperSkill checkout or its Git configuration.
3. Before import, verify that `audit/upstream-source-check.json` still describes the configured publish source and that its full validation fingerprint is current. If the source changed after W8 or the upstream target changed, rerun `upstream-source-check --level full` and repeat W9's mapping review before proceeding.
4. Inspect `audit/upstream-preflight.json`. W10 requires distinct upstream and temporary commit SHAs, changed paths confined to `release.output`, no unexpected paths, successful exit codes for all commands, and an export SHA-256 matching the copied output. Do not enter a manual PASS marker.
5. If a generated export already exists, rerun with `--replace-output` to replace it. Confirm the export matches the configured upstream paperName/version and exact required files.
6. Keep any future workflow/skill contribution in a separate PR. Do not claim that passing CI guarantees merge.

## Forbidden Actions

- Do not infer learning from interaction completeness or build success.
- Do not claim checks passed when not run.
- Do not treat a public paper PDF as permission to publish its figures.
- Do not push, publish, or create a PR. Do not mark W9 complete without a person's review; W10 is automatic only after the machine report and export checks pass.

## Completion Criteria

A person records the W9 learning/evidence decision. W10 reads the generated preflight report. Overall status is FAIL if a core learning outcome, evidence boundary, or required asset right fails.
