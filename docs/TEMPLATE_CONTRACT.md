# Template Contract

`templates/` contains inputs that `paper.py new` renders into a v2 workspace. Rendering is explicit placeholder substitution; there is no template language or conditional behavior.

## Allowed placeholders

```text
{{paper_id}}
{{paper_title}}
{{paper_url}}
{{arxiv_id}}
```

All templates may use only these placeholders. An omitted arXiv id renders as an empty string.

## v2 output mapping

| Template | Target |
| --- | --- |
| `paper.yaml` | `paper.yaml` |
| `learning-contract.md` | `design/learning-contract.md` |
| `paper-model.md` | `research/01_paper_model.md` |
| `evidence-registry.yaml` | `research/02_evidence_registry.yaml` |
| `learning-architecture.md` | `design/learning-architecture.md` |
| `scene-spec.md` | `design/scenes/00_scene.md` |
| `final-check.md` | `audit/final-check.md` |
| `release-check.md` | `audit/release-check.md` |

The v1 templates remain under `templates/legacy/` for reading and migration reference; new workspaces never use them. Template generation does not advance gates or claim review acceptance.
