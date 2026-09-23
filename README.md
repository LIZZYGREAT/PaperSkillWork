# PaperSkillWork

PaperSkillWork is a reusable workspace for researching papers, auditing evidence, designing and implementing interactive tutorials, and preparing verified outputs for the separate PaperSkill release repository.

## Standard workflow

```text
G0 Workspace → G1 Research → G2 Evidence Audit → G3 Canonical
→ G4 Narrative Design → G5 Interaction Design → G6 Enhanced
→ G7 Final Audit & Release
```

Each paper lives at `papers/<paper-id>/`. Its `paper.yaml` records metadata and gate state. `tools/paper.py` handles workspace mechanics; repo-local Skills guide work that requires AI judgment. Every gate remains a deliberate human or agent decision.

## Common commands

```powershell
python3 tools/paper.py new <paper-id> --title "..." --url "..." --arxiv-id "..."
python3 tools/paper.py status <paper-id>
python3 tools/paper.py check <paper-id>
python3 tools/paper.py gate <paper-id>
python3 tools/paper.py gate <paper-id> G1 complete
python3 tools/paper.py paths <paper-id>
python3 tools/paper.py release-check <paper-id>
```

Run `python3 tools/paper.py --help` for options. Install the development tools with `python3 -m pip install -r requirements-dev.txt`.

On Windows PowerShell, use `python` in place of `python3` when the `python3` launcher is not installed; Linux environments typically provide `python3`.

## AI workflow

Use the repo-local Skills in `.agents/skills/` at the matching gates:

```text
$paper-review
$evidence-audit
$narrative-design
$interaction-design
$enhanced-implementation
$final-audit
```

## Release boundary

PaperSkillWork keeps research, evidence audits, canonical working copies, Enhanced development, and release preparation. PaperSkill remains a separate repository. Release uses its official import, validation, build, and PR flow; never merge or cherry-pick PaperSkillWork Git history into PaperSkill. `paper.py` never calls Codex, invokes models, publishes, or creates PRs.
