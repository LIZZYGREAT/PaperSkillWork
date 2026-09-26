# Asset Plan: {{paper_title}}

Paper ID: `{{paper_id}}`

## Evaluation

For each paper visual, decide whether it explains the method or evidence more clearly than text or a new diagram. Consider whether it is a core figure, saves substantial prose, needs a crop, benefits from an overlay, or is only evidence. Include reasons for high-value candidates that are not selected.

## Inventory, Selection, and Provenance

The fenced YAML is machine-checked. Inventory all paper figures/tables here or link them by stable IDs to `source-cache/manifest.json`. Use `USE_DIRECTLY`, `CROP_AND_USE`, `REDRAW_FROM_PAPER`, `REFERENCE_ONLY`, or `DO_NOT_USE`.

For selected public assets, stage the faithful original under `assets/figures/original/`; store a separate approved web derivative under `assets/figures/web/`. `web_path` is the derivative's path in the final export (for example, `public/images/figure-2.png`). Record source paper/version, figure/table, page, original caption, evidence references, processing, attribution, and reuse-rights status. Do not submit a PDF or publish an asset with unclear rights.

```yaml
assets: []
```

An asset entry includes `id`, `paper_figure_id`, `page`, `caption`, `source_path`, `type`, `teaching_role`, `decision`, `processing`, `derivative_path`, `web_path`, `evidence_refs`, `source_paper_version`, `source_location`, `attribution`, `reuse_rights`, and `explanation`. Add a `reason` for `REFERENCE_ONLY` and `DO_NOT_USE`.

## Scene Placement

For each selected asset, identify the spine stage that explains it, what the reader should notice, source content versus tutorial annotations, and accessible text/zoom behavior.
