# Template Contract

`templates/` contains the standard inputs used when `paper.py new` creates a paper workspace. It performs only explicit string replacement; there is no template language or conditional rendering.

## Allowed placeholders

```text
{{paper_id}}
{{paper_title}}
{{paper_url}}
{{arxiv_id}}
```

Every template may use only these four placeholders. An omitted arXiv id is rendered as an empty string.

## Mapping

| Template | Target |
| --- | --- |
| `paper.yaml` | `paper.yaml` |
| `research-review.md` | `research/01_review.md` |
| `evidence-audit.md` | `research/02_evidence_audit.md` |
| `storyboard.md` | `design/storyboard.md` |
| `interaction-plan.md` | `design/interaction-plan.md` |
| `content-check.md` | `audit/content-check.md` |
| `release-check.md` | `audit/release-check.md` |

Template structure changes are workflow changes and should be reviewed with `docs/WORKFLOW.md`. Template generation must not advance a gate or claim that an audit passed.
