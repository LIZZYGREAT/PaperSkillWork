# PaperSkillWork

PaperSkillWork creates source-grounded, interactive tutorials that help first-time readers reconstruct a paper's problem, core mechanism, data or state flow, evidence, and limitations.

## Quick start

Read [`AGENTS.md`](AGENTS.md) for repository boundaries and task routing, then follow the relevant stage in [`docs/WORKFLOW.md`](docs/WORKFLOW.md). Use the matching skill under `.agents/skills/` for stage procedures.

```powershell
python tools/paper.py new <paper-id> --title "..." --url "..." --author "..." --source-type arXiv
python tools/paper.py status <paper-id>
python tools/paper.py check <paper-id>
```

`new` records known paper metadata once and creates a Workflow v3 workspace. The source cache, templates, generated paths, and workspace documents are listed in [`docs/TEMPLATE_CONTRACT.md`](docs/TEMPLATE_CONTRACT.md).

## Workflow v3

```text
W0 source → W1 cache → W2 paper model → W3 evidence/assets → W4 learning spine
→ W5 implementation plan → W6 vertical slice → W7 human review → W8 implementation
→ W9 human audit → W10 official PaperSkill preflight
```

W7 acceptance is required before full implementation. Human review gates are W2, W4, W7, and W9. The official W10 release flow is user-triggered after W9; see [`docs/UPSTREAM_RELEASE.md`](docs/UPSTREAM_RELEASE.md).

## Standards and references

- [`docs/TEACHING_DESIGN_STANDARD.md`](docs/TEACHING_DESIGN_STANDARD.md): common rules for teaching logic, examples, visuals, and interactions.
- [`docs/VISUAL_QA.md`](docs/VISUAL_QA.md): browser-based rendering, interaction, and regression checks.
- [`docs/reusable-kit.md`](docs/reusable-kit.md): how to find and copy reusable patterns.
- [`docs/TEMPLATE_CONTRACT.md`](docs/TEMPLATE_CONTRACT.md): template names and generated workspace paths.
- [`docs/PAPERSKILL_SETUP.md`](docs/PAPERSKILL_SETUP.md): initial PaperSkill sibling checkout and sparse setup.

PaperSkillWork supports Workflow v3 only. Historical workflow versions remain available through Git history, not as runtime compatibility targets.
