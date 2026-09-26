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
| `final-check-v3.md` | `audit/final-check.md` |

`source/paper.url` is created from `--url` when supplied. The source-cache templates are pending scaffolds; W1 replaces their placeholder content from a complete source read and inventories every figure/table. `source-cache/figures/` holds captured source visuals. `web/enhanced/` is created as the implementation location but the tutorial is not scaffolded before W6. `html_output/<paper-id>/v1/` is the default export target recorded in `paper.yaml`; W10 populates it.

Template generation creates no source analysis, assigns no priority, and advances no workflow stage. A person must review and explicitly accept each stage.

## Legacy templates

`learning-contract.md`, `terms.yaml`, `learning-architecture.md`, `scene-spec.md`, and `release-check.md` remain only for the explicit schema v1→v2 migration path. They are not part of new v3 work and must not be used to generate parallel design documents. Files in `templates/legacy/` are historical v1 references.
