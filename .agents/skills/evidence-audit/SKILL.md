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
6. For selected public assets, verify the original in `source-cache/figures/`; record paper/version, figure/page, source locator, caption, teaching role, processing plan, evidence IDs, attribution, and approved reuse-rights basis. W3 does not generate or require a derivative.
7. Fill the registry `review` lists for unresolved source conflicts, evidence conflicts, or unsafe claim wording. W3 remains blocked until these lists are empty. Unclear/pending rights also block W3.
8. Save `research/evidence-registry.yaml` and `design/asset-plan.md`.

## Validation

- Registry parses, IDs are unique, and referenced evidence resolves.
- Results include their applicable protocol metadata.
- Every source figure/table is inventoried; every selected public asset has an existing original source, source metadata, a processing plan, and approved rights. Derivatives are generated during implementation and checked at W8/W10.
- Paper claims, our interpretations, implementation mappings, background, and teaching examples are not conflated.

## Forbidden Actions

- Do not conceal contradictions, upgrade evidence strength, or infer a reuse license from a public PDF.
- Do not duplicate the Paper Model as a prose audit.
- Do not mark W3 complete while review lists contain unresolved issues or an asset right is unclear. Otherwise W3 completes automatically after structural checks pass.

## Completion Criteria

W3 records only machine-resolvable outcomes. A source/evidence conflict, unsafe wording, or unclear reuse right must be resolved before W3 can complete; no reviewer is fabricated for W3.
