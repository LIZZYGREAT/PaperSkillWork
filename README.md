# PaperSkillWork

PaperSkillWork produces source-grounded, interactive paper tutorials that help a first-time reader reconstruct the paper's problem, main idea, architecture, information flow, evidence, and limits.

## Workflow v3

```text
W0 Source Intake → W1 Source Cache + Asset Inventory → W2 Paper Model
→ W3 Evidence + Asset Curation → W4 Learning Spine + Priorities
→ W5 Visual / Interaction Plan → W6 First Vertical Slice
→ W7 Human Learning Review → W8 Full Implementation
→ W9 Learning + Evidence Audit → W10 Upstream Packaging & Preflight
```

Read [docs/WORKFLOW.md](docs/WORKFLOW.md) before starting. The main production rule is to establish the paper's primary learning spine and content priority before planning interaction or writing tutorial UI. W7 human learning review must pass before full implementation.

New papers have only six design/audit documents: `research/paper-model.md`, `research/evidence-registry.yaml`, `design/learning-spine.md`, `design/asset-plan.md`, `design/implementation-plan.md`, and `audit/final-check.md`. Source extraction lives in `source-cache/`; the export goes to `html_output/<paper-name>/<version>/`.

## Common commands

```powershell
python tools/paper.py new <paper-id> --title "..." --url "..." --author "..." --venue "..." --year 2026 --source-type arXiv
python tools/paper.py status <paper-id>
python tools/paper.py check <paper-id>
python tools/paper.py stage <paper-id>
python tools/paper.py stage <paper-id> W0 in_progress
python tools/paper.py stage <paper-id> W0 complete --reviewed-by "Name" --note "Source identity confirmed"
python tools/paper.py release-check <paper-id>
python tools/paper.py paths <paper-id>
python tools/paper.py open <paper-id>
```

`new` records the paper identity and creates a v3 workspace. `--url` is optional when using `--source-location "user-provided PDF"`; use `--source-type`, repeat `--author` for all authors, and supply `--venue`/`--year` when known. Complete W0 metadata and W1's full-source cache by hand; no paper content is inferred from a URL. `check` validates structure and machine-resolvable references. It cannot evaluate teaching quality. `stage ... complete` always requires a human reviewer and note; no command auto-advances a stage.

Workflow v1/v2 workspaces already in `papers/` remain readable by their existing checks and are not rewritten by this change. `migrate-v2` remains available for explicit v1 migrations.

## Repo-local Skills

Use `.agents/skills/` at the matching stage:

```text
$paper-review            # W2
$evidence-audit          # W3
$learning-architecture   # W4
$implementation-plan     # W5–W7
$scene-spec              # legacy only; new work uses the implementation plan
$enhanced-implementation # W6–W8
$final-audit              # W9–W10
```

`$narrative-design` and `$interaction-design` remain deprecated aliases; they do not create a separate storyboard or interaction-plan document.

## Release boundary

`PaperSkillWork` keeps the research and implementation workspace; `PaperSkill` is a separate repository. Export a complete independent React + TypeScript project to `html_output/<paper-name>/<version>/`. Tutorial PRs contain that export only. Workflow/skill improvements use a separate PR. Run the current official upstream preflight before release; passing CI does not guarantee merge. Never merge or cherry-pick PaperSkillWork Git history into PaperSkill.
