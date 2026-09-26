# Template Contract

`tools/paper.py new` creates a Workflow v3 workspace from fixed templates. Placeholder replacement is literal; there is no template language or conditional behavior.

## Allowed placeholders

```text
{{paper_id}}
{{paper_title}}
{{paper_url}}
{{arxiv_id}}
```

All new-workflow templates may use only these placeholders. An omitted arXiv ID renders as an empty string.

## Workflow v3 output mapping

| Template | Target |
| --- | --- |
| `paper.yaml` | `paper.yaml` |
| `source-content.md` | `source-cache/content.md` |
| `source-manifest.json` | `source-cache/manifest.json` |
| `source-evidence.json` | `source-cache/evidence.json` |
| `paper-model-v3.md` | `research/paper-model.md` |
| `evidence-registry-v3.yaml` | `research/evidence-registry.yaml` |
| `learning-spine.md` | `design/learning-spine.md` |
| `asset-plan.md` | `design/asset-plan.md` |
| `implementation-plan.md` | `design/implementation-plan.md` |
| `implementation-manifest.json` | `web/enhanced/implementation-manifest.json` |
| `final-check-v3.md` | `audit/final-check.md` |

`source/paper.url` is created from `--url` when supplied. The source-cache templates are pending scaffolds; W1 replaces their placeholder content from a complete source read and inventories every figure/table. `source-cache/figures/` holds captured source visuals. W3 records original sources and a processing plan; it does not require a derivative. W5 records selected asset placement/rendering, and implementation creates derivatives. `web/enhanced/` is created with an empty implementation manifest, but the tutorial itself is not scaffolded before W6.

`release.upstream_paper_name`, `release.upstream_version`, and `release.output` start empty. Set the two upstream identifiers explicitly; `release.output` must be exactly `html_output/<upstream_paper_name>/<upstream_version>`. It is not derived from the internal `paper_id`.

Template generation creates no source analysis, assigns no priority, and advances no workflow stage. Human review is required only for W2, W4, W7, and W9. W0, W1, W3, W5, W6, W8, and W10 record `completed_by: automation` after their checks pass; W3 blocks on unresolved source/evidence conflicts, unsafe wording, or unclear reuse rights.

## Legacy templates

`learning-contract.md`, `terms.yaml`, `learning-architecture.md`, `scene-spec.md`, and `release-check.md` remain only for the explicit schema v1→v2 migration path. They are not part of new v3 work and must not be used to generate parallel design documents. Files in `templates/legacy/` are historical v1 references.
