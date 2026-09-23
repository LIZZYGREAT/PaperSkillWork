# PaperSkillWork Workflow v1

PaperSkillWork is a reusable workspace for paper research, evidence auditing, a canonical working copy, Enhanced tutorial development, human acceptance, and release preparation. PaperSkill is a separate upstream/fork release repository.

## Gate sequence

```text
G0 Workspace
→ G1 Research
→ G2 Evidence Audit
→ G3 Canonical
→ G4 Narrative Design
→ G5 Interaction Design
→ G6 Enhanced
→ G7 Final Audit & Release
```

Each paper has one workspace under `papers/<paper-id>/` and one status file, `paper.yaml`. Gates are deliberately advanced by a person after verification; scripts and Skills must not mark work complete on their own.

| Gate | Purpose | Required artifact or acceptance |
| --- | --- | --- |
| G0 Workspace | Register metadata and standard paths | Valid `paper.yaml`; non-empty `source/paper.url` |
| G1 Research | Understand problem, idea, mechanism, experiments, limits | `research/01_review.md` |
| G2 Evidence Audit | Separate facts, results, interpretations, analogies, and future work | `research/02_evidence_audit.md` |
| G3 Canonical | Preserve and validate the strict PaperSkill baseline | Non-empty `web/canonical/`; build, validator, and human browse accepted |
| G4 Narrative Design | Turn the research into a learning path | `design/storyboard.md` |
| G5 Interaction Design | Specify purposeful interactions and expected insight | `design/interaction-plan.md` |
| G6 Enhanced | Implement the reviewed and designed tutorial | `web/enhanced/package.json`; production build, project audit, human interaction, mobile, and fact checks |
| G7 Final Audit & Release | Check content, engineering, and release scope | `audit/content-check.md` with `PASS`; `audit/release-check.md` with `READY` |

### Gate status values

Only `pending`, `in_progress`, `complete`, `skipped`, and `legacy` are valid. `legacy` is only for projects created before Workflow v1. A completed gate must meet its artifact requirements. `skipped` must have a recorded reason. New papers must not use `legacy`.

`paper.py gate <paper-id>` reads state. To change state, explicitly name both gate and new status. The command checks prerequisites before accepting `complete`; it does not perform AI work or infer completion. `--reason` is required for `skipped`.

Gates can only be completed in sequence: every earlier gate must be `complete` or `skipped`. For the PhyAgentOS migration only, an earlier `legacy` gate also counts as historically passed.

## Standard workspace

```text
papers/<paper-id>/
├─ paper.yaml
├─ source/paper.url
├─ research/01_review.md
├─ research/02_evidence_audit.md
├─ design/storyboard.md
├─ design/interaction-plan.md
├─ web/canonical/          # added when the canonical result exists
├─ web/enhanced/           # added when the Enhanced project exists
├─ audit/content-check.md
├─ audit/release-check.md
└─ assets/
   ├─ figures/
   └─ screenshots/
```

`source/paper.pdf` is optional local material and is gitignored. No empty web project is created by `paper.py new`. Presentation scripts are optional and are not workflow gates.

## Artifact ownership and evidence

- The paper is the source of paper claims. `research/02_evidence_audit.md` records whether a statement is a paper fact, paper result, author interpretation, our interpretation, teaching analogy, or future work.
- `design/storyboard.md` defines the learning sequence; it should not mechanically mirror paper section order.
- `design/interaction-plan.md` defines each interaction through user action, system response, expected insight, paper evidence, accessibility, and edge cases.
- Enhanced implementations follow those reviewed inputs and keep every interaction traceable to the plan.
- Canonical is a frozen baseline separate from Enhanced.

## Repository and release boundary

`tools/paper.py` is a local file, state, path, and validation tool. It does not invoke Codex or model APIs, download papers, install dependencies, push Git changes, import into PaperSkill, publish packages, or create PRs.

Never merge PaperSkillWork history into PaperSkill or cherry-pick its commits. Release always follows:

```text
PaperSkillWork output → PaperSkill official import → validate → PR
```

## Skills

Repo-local Skills under `.agents/skills/` guide judgment-heavy work: `paper-review`, `evidence-audit`, `narrative-design`, `interaction-design`, `enhanced-implementation`, and `final-audit`. They describe inputs, procedures, validation, prohibited actions, and completion criteria. They must not advance gates automatically.
