# Asset Plan: {{paper_title}}

Paper ID: `{{paper_id}}`

## Evaluation

For each paper visual, decide whether it explains the method or evidence more clearly than text or a new diagram. Consider whether it is a core figure, saves substantial prose, needs a crop, benefits from an overlay, or is only evidence. Include reasons for high-value candidates that are not selected.

## Inventory, Selection, and Provenance

The fenced YAML is machine-checked. Inventory all paper figures/tables here or link them by stable IDs to `source-cache/manifest.json`. Use `USE_DIRECTLY`, `CROP_AND_USE`, `REDRAW_FROM_PAPER`, `REFERENCE_ONLY`, or `DO_NOT_USE`.

W3 records the original under `source-cache/figures/`, confirms approved reuse rights, and chooses the processing strategy and destination paths. It does not require a derivative yet. W5 assigns each selected public asset to a Learning Spine stage and chooses `original`, `crop`, `redraw`, or `overlay` in the implementation plan. W6/W8 create the derivative under `assets/figures/web/` and copy the web asset into `web/enhanced/`; W8/W10 require both files and README provenance. `web_path` is the planned path inside the exported tutorial (for example, `public/images/figure-2.png`). Record source paper/version, figure/table, page, source locator, original caption, teaching role, evidence references, processing, attribution, and reuse-rights status. Do not submit a PDF or publish an asset with unclear rights.

```yaml
assets: []
```

An asset entry includes `id`, `paper_figure_id`, `page`, `caption`, `source_path`, `source_locator`, `type`, `teaching_role`, `decision`, `processing`, `derivative_path`, `web_path`, `evidence_refs`, `source_paper_version`, `source_location`, `attribution`, `reuse_rights`, and `explanation`. Add a `reason` for `REFERENCE_ONLY` and `DO_NOT_USE`.

## Scene Placement

For each selected asset, identify the spine stage that explains it, what the reader should notice, source content versus tutorial annotations, and accessible text/zoom behavior.
