# PaperSkillWork

PaperSkillWork is a reusable workspace for building source-grounded paper tutorials that help a first-time reader reconstruct a paper's architecture, objects, state, information flow, mathematics, updates, evidence, and limits.

## Workflow v2

```text
G0 Learning Contract → G1 Paper Model → G2 Evidence Registry
→ G3 Canonical Compatibility Baseline → G4 Learning Architecture
→ G5 Scene Specifications → G6 Incremental Enhanced Implementation
→ G7 Learning + Evidence + Engineering Audit
```

Each paper lives at `papers/<paper-id>/`. Its `paper.yaml` records metadata and gate state. `tools/paper.py` handles workspace mechanics; Skills guide source reading, learning design, and audits. Structural checks never claim that a person learned the material.

## Common commands

```powershell
python3 tools/paper.py new <paper-id> --title "..." --url "..." --arxiv-id "..."
python3 tools/paper.py status <paper-id>
python3 tools/paper.py check <paper-id>
python3 tools/paper.py learning-check <paper-id>
python3 tools/paper.py gate <paper-id>
python3 tools/paper.py gate <paper-id> G1 complete
python3 tools/paper.py paths <paper-id>
python3 tools/paper.py release-check <paper-id>
python3 tools/paper.py migrate-v2 <paper-id>
```

`new` creates a v2 workspace. `migrate-v2` scaffolds v2 artifacts for an existing v1 paper, records old gate states, leaves every v2 gate pending, and preserves old files plus Canonical and Enhanced. `check` validates structure and registry references. `learning-check` validates scene structure and references; human learning acceptance is still required.

Run `python3 tools/paper.py --help` for options. Install development tools with `python3 -m pip install -r requirements-dev.txt`.

On Windows PowerShell, use `python` in place of `python3` when the launcher is unavailable.

## Repo-local Skills

Use `.agents/skills/` at the matching gate:

```text
$paper-review
$evidence-audit
$learning-architecture
$scene-spec
$enhanced-implementation
$final-audit
```

`$narrative-design` and `$interaction-design` remain deprecated aliases to their v2 replacements.

## Release boundary

PaperSkillWork keeps research, evidence registries, Canonical compatibility baselines, Enhanced development, and release preparation. PaperSkill remains a separate repository. Release uses its official import, validation, build, and PR flow; never merge or cherry-pick PaperSkillWork Git history into PaperSkill. `paper.py` never calls Codex, invokes models, publishes, or creates PRs.
