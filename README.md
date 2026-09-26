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
python tools/paper.py stage <paper-id> W0 complete
python tools/paper.py stage <paper-id> W4 complete --reviewed-by "Name" --note "Main learning spine accepted"
python tools/paper.py release-check <paper-id>
python tools/paper.py paths <paper-id>
python tools/paper.py open <paper-id>
python tools/paper.py upstream-check <paper-id> --paperskill-repo "C:\path\to\PaperSkill" --participant "Public name" [--pinyin "romanized-name"] [--github "username"]
```

`new` records the paper identity and creates a v3 workspace. `--url` is optional when using `--source-location "user-provided PDF"`; use `--source-type`, repeat `--author` for all authors, and supply `--venue`/`--year` when known. No paper content is inferred from a URL. Only W2, W4, W7, and W9 require `--reviewed-by` and `--note`. W0, W1, W3, W5, W6, W8, and W10 record `completed_by: automation` after machine checks pass; W3 stops on unresolved evidence/source conflicts, unsafe wording, or unclear asset rights. `check` validates structure, paths, references, and implementation coverage. It cannot evaluate teaching quality.

Set `release.upstream_paper_name` and `release.upstream_version` independently of `paper_id`, and set `release.output` to the matching `html_output/<paper-name>/<version>`. `upstream-check` records the clean PaperSkill checkout's commit, imports in an isolated clone, rejects changes outside the configured tutorial directory, then commits only that tutorial on a local-only test branch. Official validation, build, and preflight run against the temporary commit. The supplied PaperSkill checkout and its Git configuration remain untouched. The command writes both commit IDs, scoped changed paths, command results, and the export SHA-256 to `audit/upstream-preflight.json`; W10 checks the recorded hash against `release.output`. If that generated export already exists, use `--replace-output` to replace it. W10 completion reads the JSON report; do not type a Markdown PASS.

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

`PaperSkillWork` keeps the research and implementation workspace; `PaperSkill` is a separate repository. Export a complete independent React + TypeScript project to `html_output/<paper-name>/<version>/`. Tutorial PRs contain that export only. Workflow/skill improvements use a separate PR. Passing CI does not guarantee merge. Never merge or cherry-pick PaperSkillWork Git history into PaperSkill.
