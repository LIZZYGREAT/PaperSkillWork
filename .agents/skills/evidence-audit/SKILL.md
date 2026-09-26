---
name: evidence-audit
description: Curate claim-level evidence and source visuals for Workflow v3 stage W3.
---

# Evidence and Asset Audit — W3

## Purpose

Make sure each important tutorial statement has a defensible source boundary and each visual asset has a clear use, provenance, and rights status.

## Required Inputs

- Complete source and `source-cache/manifest.json` / `source-cache/evidence.json`
- `research/paper-model.md`
- `templates/evidence-registry-v3.yaml`
- `templates/asset-plan.md`

## Procedure

1. Audit important paper claims, equations, architecture, results, limitations, and interpretations.
2. Give each claim a unique ID, exact claim, type, source locator, conditions, and allowed wording.
3. Keep `PAPER_FACT`, `PAPER_RESULT`, `AUTHOR_INTERPRETATION`, `OUR_INTERPRETATION`, `IMPLEMENTATION_MAPPING`, `GENERAL_BACKGROUND`, and `TEACHING_EXAMPLE` distinct.
4. Tie each number to the applicable dataset/environment, model, split, metric, protocol, and source.
5. Review the full W1 figure/table inventory. For each item decide `USE_DIRECTLY`, `CROP_AND_USE`, `REDRAW_FROM_PAPER`, `REFERENCE_ONLY`, or `DO_NOT_USE`, with rationale where it is excluded.
6. For selected assets, preserve original and derivative separately; record paper/version, figure/page, caption, evidence IDs, processing, attribution, and reuse-rights status. Do not publish when rights are unclear.
7. Save `research/evidence-registry.yaml` and `design/asset-plan.md`.

## Validation

- Registry parses, IDs are unique, and referenced evidence resolves.
- Results include their applicable protocol metadata.
- Every source figure/table is inventoried; every selected public image exists and has source metadata.
- Paper claims, our interpretations, implementation mappings, background, and teaching examples are not conflated.

## Forbidden Actions

- Do not conceal contradictions, upgrade evidence strength, or infer a reuse license from a public PDF.
- Do not duplicate the Paper Model as a prose audit.
- Do not advance W3 automatically.

## Completion Criteria

A person reviews source conflicts and rights status before marking W3 complete.
