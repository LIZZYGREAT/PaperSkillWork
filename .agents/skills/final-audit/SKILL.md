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

1. Review learning: Can a first-time reader state the problem/idea, reconstruct architecture and flow, explain training/inference and design rationale, summarize key results, and state limitations?
2. Review evidence: Trace important facts, formulas, values, dataset/protocol statements, architecture, and limits through registry IDs to source locators.
3. Review assets: Check full inventory, selection rationale, source/derivative separation, attribution, reuse rights, explanatory placement, accessibility, relative paths, and README provenance.
4. Review implementation semantics: Check that the page's data/state flow matches the model and that teaching examples are distinct.
5. Record actual build, accessibility, reduced-motion, mobile, and engineering check outcomes.
6. Save findings and verdict in `audit/final-check.md`. Complete W9 with `--reviewed-by` and `--note` only after a person accepts the learning and evidence audit.

## W10 Procedure

1. Set `release.upstream_paper_name`, `release.upstream_version`, and matching `release.output`; these are separate from the internal `paper_id`.
2. Update the clean PaperSkill checkout to the intended commit, then run `python tools/paper.py upstream-check <paper-id> --paperskill-repo <path> --participant <name>`. Supply `--pinyin` for a non-ASCII participant and `--github` when applicable. The command imports into an isolated clone, rejects changed paths outside `release.output`, commits only the tutorial on a local-only branch, then runs official validation, build, and preflight against that temporary commit. It does not write into the supplied PaperSkill checkout or its Git configuration.
3. Inspect `audit/upstream-preflight.json`. W10 requires distinct upstream and temporary commit SHAs, changed paths confined to `release.output`, no unexpected paths, successful exit codes for all commands, and an export SHA-256 matching the copied output. Do not enter a manual PASS marker.
4. If a generated export already exists, rerun with `--replace-output` to replace it. Confirm the export matches the configured upstream paperName/version and exact required files.
5. Keep any future workflow/skill contribution in a separate PR. Do not claim that passing CI guarantees merge.

## Forbidden Actions

- Do not infer learning from interaction completeness or build success.
- Do not claim checks passed when not run.
- Do not treat a public paper PDF as permission to publish its figures.
- Do not push, publish, or create a PR. Do not mark W9 complete without a person's review; W10 is automatic only after the machine report and export checks pass.

## Completion Criteria

A person records the W9 learning/evidence decision. W10 reads the generated preflight report. Overall status is FAIL if a core learning outcome, evidence boundary, or required asset right fails.
