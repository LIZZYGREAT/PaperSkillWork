import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
import yaml


REPO_ROOT = Path(__file__).resolve().parents[1]
PAPER_SCRIPT = REPO_ROOT / "tools" / "paper.py"
TEMPLATES = REPO_ROOT / "templates"


def make_project(tmp_path):
    shutil.copytree(REPO_ROOT / "tools", tmp_path / "tools")
    shutil.copytree(TEMPLATES, tmp_path / "templates")
    shutil.copytree(REPO_ROOT / "reusable-kit", tmp_path / "reusable-kit", ignore=shutil.ignore_patterns("node_modules", "dist"))
    shutil.copy2(REPO_ROOT / ".gitignore", tmp_path / ".gitignore")
    (tmp_path / "papers").mkdir()
    return tmp_path


def invoke(root, *args):
    return subprocess.run(
        [sys.executable, str(root / "tools" / "paper.py"), *args],
        cwd=Path(__file__).resolve().parent,
        text=True,
        capture_output=True,
        check=False,
    )


def create_paper(root, paper_id="demo-paper", title="A Sample Paper"):
    result = invoke(root, "new", paper_id, "--title", title, "--url", "https://example.org/paper", "--arxiv-id", "1234.56789")
    if result.returncode != 0:
        return result
    path = root / "papers" / paper_id / "paper.yaml"
    config = yaml.safe_load(path.read_text(encoding="utf-8"))
    config["schema_version"] = 2
    config["workflow"] = {
        "version": 2,
        "current_gate": "G0",
        "gates": {
            key: {"status": "pending"}
            for key in (
                "G0_workspace", "G1_research", "G2_evidence_audit", "G3_canonical",
                "G4_narrative_design", "G5_interaction_design", "G6_enhanced", "G7_release",
            )
        },
    }
    config["artifacts"] = {
        "learning_contract": "design/learning-contract.md",
        "paper_model": "research/01_paper_model.md",
        "evidence_registry": "research/02_evidence_registry.yaml",
        "learning_architecture": "design/learning-architecture.md",
        "scenes_dir": "design/scenes",
        "terms": "knowledge/terms.yaml",
        "final_check": "audit/final-check.md",
        "release_check": "audit/release-check.md",
    }
    config["web"] = {"canonical": "web/canonical", "enhanced": "web/enhanced"}
    config.pop("release", None)
    config.pop("paperskill", None)
    path.write_text(yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")
    paper = path.parent
    artifacts = {
        "research/01_paper_model.md": "# Paper Model\n\nStarter model.\n",
        "research/02_evidence_registry.yaml": "claims: {}\nresults: {}\nimplementation: {}\nbackground: {}\nteaching_toys: {}\n",
        "knowledge/terms.yaml": "{}\n",
        "design/learning-contract.md": "# Learning Contract\n\nStarter contract.\n",
        "design/learning-architecture.md": "# Learning Architecture\n\nStarter architecture.\n",
        "audit/final-check.md": "Overall: PENDING\n",
        "audit/release-check.md": "Release Check Status: PENDING\n",
    }
    for relative, content in artifacts.items():
        target = paper / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
    (paper / "design/scenes").mkdir(parents=True, exist_ok=True)
    return result


def load_paper(root, paper_id="demo-paper"):
    path = root / "papers" / paper_id / "paper.yaml"
    return path, yaml.safe_load(path.read_text(encoding="utf-8"))


def save_paper(path, config):
    path.write_text(yaml.safe_dump(config, sort_keys=False, allow_unicode=True), encoding="utf-8")


def init_git_repo(root):
    subprocess.run(["git", "init", "-q", str(root)], check=True)


def write_scene(paper, evidence="C01", term="softmax"):
    scene = paper / "design/scenes/01_mechanism.md"
    scene.parent.mkdir(parents=True, exist_ok=True)
    scene.write_text(
        f"""# Scene 01 — Trace the mechanism

## Learning Goal
Rebuild the path from input to output.

## Knowledge Dependencies
Basic classification.

## Persistent Objects
Model and batch.

## System State
The model is fixed for this trace.

## Core User Actions
Select a signal and follow it.

## State Transitions
Input becomes logits and probabilities.

## Architecture / Data Flow
Batch → model → logits.

## Mathematical Model
Softmax maps logits to probabilities.

## Implementation Mapping
The runtime tensor is a vector of logits.

## Paper Evidence
`{evidence}`

## Teaching Toy Boundary
The numeric values are illustrative.

## Prerequisite Terms
`{term}`

## Reconstruction Test
The learner can draw the input, model, logits, and output.

## Implementation Trace Test
The learner can identify the producer, consumer, tensor, and transformation.

## Global Dependency Test
- **Consumes:** input batch
- **Produces:** probability vector
- **Used later by:** loss calculation

## Deletion Test
Removing the trace hides where the output comes from.

## Acceptance Questions
1. Which object produces the logits?

## Accessibility
Keyboard selection and visible focus.

## Mobile
The trace wraps to one column.

## Non-goals
No model training in this scene.
""",
        encoding="utf-8",
    )
    return scene


def test_new_creates_v3_workspace(tmp_path):
    root = make_project(tmp_path)
    result = invoke(root, "new", "demo-paper", "--title", 'A "Quoted" Paper', "--url", "https://example.org/paper", "--arxiv-id", "1234.56789")
    assert result.returncode == 0, result.stderr
    paper = root / "papers/demo-paper"
    config = yaml.safe_load((paper / "paper.yaml").read_text(encoding="utf-8"))
    assert config["schema_version"] == 3
    assert config["workflow"]["version"] == 3
    for relative in (
        "paper.yaml",
        "source/paper.url",
        "source-cache/content.md",
        "source-cache/manifest.json",
        "source-cache/evidence.json",
        "research/paper-model.md",
        "research/evidence-registry.yaml",
        "design/learning-spine.md",
        "design/asset-plan.md",
        "design/implementation-plan.md",
        "audit/final-check.md",
    ):
        assert (paper / relative).is_file(), relative
    assert (paper / "web/enhanced").is_dir()
    assert not (paper / "design/scenes").exists()
    assert not (paper / "research/01_paper_model.md").exists()
    assert '"Quoted"' in config["title"]
    assert "{{" not in (paper / "research/paper-model.md").read_text(encoding="utf-8")


def test_new_rejects_duplicate_without_overwriting(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path = root / "papers/demo-paper/research/01_paper_model.md"
    path.write_text("user notes", encoding="utf-8")
    result = create_paper(root)
    assert result.returncode != 0
    assert "already exists" in result.stderr
    assert path.read_text(encoding="utf-8") == "user notes"


@pytest.mark.parametrize("paper_id", ["../abc", "ABC", "paper test"])
def test_invalid_paper_id(tmp_path, paper_id):
    root = make_project(tmp_path)
    result = create_paper(root, paper_id)
    assert result.returncode != 0
    assert "Invalid paper id" in result.stderr


def test_status_is_read_only(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path = root / "papers/demo-paper/paper.yaml"
    before = path.read_bytes()
    result = invoke(root, "status", "demo-paper")
    assert result.returncode == 0
    assert "Current Gate: G0" in result.stdout
    assert "Next Recommended Gate: G0 Workspace + Learning Contract" in result.stdout
    assert "[PRESENT] research/01_paper_model.md" in result.stdout
    assert path.read_bytes() == before


def test_check_separates_artifact_presence_from_gate_state(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "check", "demo-paper")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[GATE] G1 Paper Model: PENDING" in result.stdout
    assert "[PRESENT] G1 artifact: research/01_paper_model.md" in result.stdout
    assert "no scene specifications yet" in result.stdout


def test_learning_check_requires_scene_specs_and_human_acceptance(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "learning-check", "demo-paper")
    assert result.returncode != 0
    assert "no scene specifications" in result.stdout
    paper = root / "papers/demo-paper"
    registry = paper / "research/02_evidence_registry.yaml"
    registry.write_text("claims:\n  C01:\n    text: model output\n    type: PAPER_FACT\n", encoding="utf-8")
    terms = paper / "knowledge/terms.yaml"
    terms.write_text("softmax:\n  label: Softmax\n  definition: Normalize logits.\n", encoding="utf-8")
    write_scene(paper)
    result = invoke(root, "learning-check", "demo-paper")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "STRUCTURAL LEARNING CHECK PASS" in result.stdout
    assert "Human learning acceptance still required." in result.stdout


def test_learning_check_resolves_evidence_terms_and_duplicate_ids(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / "papers/demo-paper"
    registry = paper / "research/02_evidence_registry.yaml"
    registry.write_text("claims:\n  C01: {text: claim, type: PAPER_FACT}\n", encoding="utf-8")
    (paper / "knowledge/terms.yaml").write_text("softmax: {label: Softmax}\n", encoding="utf-8")
    write_scene(paper, evidence="C99", term="unknown-term")
    result = invoke(root, "learning-check", "demo-paper")
    assert result.returncode != 0
    assert "unknown evidence id 'C99'" in result.stdout
    assert "unknown prerequisite term 'unknown-term'" in result.stdout

    registry.write_text("claims:\n  C01: {text: claim}\nresults:\n  C01: {text: result}\n", encoding="utf-8")
    write_scene(paper)
    result = invoke(root, "learning-check", "demo-paper")
    assert "duplicate canonical knowledge id 'C01'" in result.stdout


def test_duplicate_yaml_keys_are_rejected_by_check(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    registry = root / "papers/demo-paper/research/02_evidence_registry.yaml"
    registry.write_text("claims: {}\nclaims: {}\n", encoding="utf-8")
    result = invoke(root, "check", "demo-paper")
    assert result.returncode != 0
    assert "duplicate key" in result.stdout


def test_check_resolves_term_prerequisites_and_evidence_sources(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / "papers/demo-paper"
    (paper / "research/02_evidence_registry.yaml").write_text(
        "claims:\n  C01: {text: claim, type: PAPER_FACT}\n", encoding="utf-8"
    )
    (paper / "knowledge/terms.yaml").write_text(
        "term_a:\n  prerequisites: [missing_term]\n  source_ref: C99\n", encoding="utf-8"
    )
    result = invoke(root, "check", "demo-paper")
    assert result.returncode != 0
    assert "unknown prerequisite 'missing_term'" in result.stdout
    assert "unknown evidence id 'C99'" in result.stdout


def test_status_marks_legacy_artifacts():
    result = invoke(REPO_ROOT, "status", "phyagentos")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[LEGACY] research/02_evidence_audit.md" in result.stdout
    assert "[LEGACY] design/storyboard.md" in result.stdout


def test_new_v2_paper_rejects_legacy_gate_status(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    config["workflow"]["gates"]["G2_evidence_audit"]["status"] = "legacy"
    save_paper(path, config)
    result = invoke(root, "status", "demo-paper")
    assert result.returncode != 0
    assert "Workflow v2 gates cannot use legacy status" in result.stderr


def test_gate_complete_requires_artifact(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    assert invoke(root, "gate", "demo-paper", "G0", "complete").returncode == 0
    model = root / "papers/demo-paper/research/01_paper_model.md"
    model.unlink()
    result = invoke(root, "gate", "demo-paper", "G1", "complete")
    assert result.returncode != 0
    assert "01_paper_model.md" in result.stderr


def test_gate_g5_requires_structural_scene_acceptance(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / "papers/demo-paper"
    for gate in ("G0", "G1", "G2", "G3", "G4"):
        if gate == "G3":
            canonical = paper / "web/canonical"
            canonical.mkdir(parents=True)
            (canonical / "index.html").write_text("canonical", encoding="utf-8")
        result = invoke(root, "gate", "demo-paper", gate, "complete")
        assert result.returncode == 0, result.stderr
    result = invoke(root, "gate", "demo-paper", "G5", "complete")
    assert result.returncode != 0
    assert "required artifact missing or empty: design/scenes" in result.stderr


def test_cannot_complete_gate_out_of_order(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "gate", "demo-paper", "G5", "complete")
    assert result.returncode != 0
    assert "G0 Workspace + Learning Contract is pending" in result.stderr


def test_gate_rejects_legacy_for_new_paper(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path = root / "papers/demo-paper/paper.yaml"
    before = path.read_bytes()
    result = invoke(root, "gate", "demo-paper", "G2", "legacy")
    assert result.returncode != 0
    assert "Workflow v2 gates cannot use legacy status" in result.stderr
    assert path.read_bytes() == before


def test_legacy_predecessor_is_allowed_for_migration():
    result = invoke(REPO_ROOT, "gate", "phyagentos")
    assert result.returncode == 0, result.stderr


def test_g7_cannot_complete_before_gates(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "gate", "demo-paper", "G7", "complete")
    assert result.returncode != 0
    assert "G0 Workspace + Learning Contract is pending" in result.stderr


def test_schema_rejects_unsafe_artifact_path(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    config["artifacts"]["paper_model"] = r"C:\Users\foo\a.md"
    save_paper(path, config)
    result = invoke(root, "check", "demo-paper")
    assert result.returncode != 0
    assert "artifacts.paper_model" in result.stdout


def test_release_check_reports_blockers(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "release-check", "demo-paper")
    assert result.returncode != 0
    assert "NOT READY" in result.stdout
    assert "G2 Evidence Registry not complete" in result.stdout
    assert "final-check.md is not Overall: PASS" in result.stdout


def test_v2_migration_is_non_destructive_and_resets_gate_state(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / "papers/demo-paper"
    for relative, body in (
        ("research/01_review.md", "legacy model"),
        ("research/02_evidence_audit.md", "legacy evidence"),
        ("design/storyboard.md", "legacy storyboard"),
        ("design/interaction-plan.md", "legacy interactions"),
        ("web/canonical/index.html", "canonical bytes"),
        ("web/enhanced/README.md", "enhanced bytes"),
    ):
        path = paper / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")
    (paper / "design/learning-contract.md").write_text("user-owned v2 notes", encoding="utf-8")
    old_paths = {
        relative: (paper / relative).read_bytes()
        for relative in ("research/01_review.md", "research/02_evidence_audit.md", "design/storyboard.md", "design/interaction-plan.md", "web/canonical/index.html", "web/enhanced/README.md", "design/learning-contract.md")
    }
    path, config = load_paper(root)
    config["schema_version"] = 1
    config["workflow"].pop("version")
    for key, entry in config["workflow"]["gates"].items():
        entry["status"] = "complete" if key in ("G0_workspace", "G1_research") else "pending"
    config["artifacts"] = {
        "review": "research/01_review.md", "evidence_audit": "research/02_evidence_audit.md",
        "storyboard": "design/storyboard.md", "interaction_plan": "design/interaction-plan.md",
    }
    save_paper(path, config)
    v1_paper_yaml = path.read_bytes()
    v1_release_check = (paper / "audit/release-check.md").read_bytes()
    result = invoke(root, "migrate-v2", "demo-paper")
    assert result.returncode == 0, result.stdout + result.stderr
    migrated_path, migrated = load_paper(root)
    assert migrated["schema_version"] == 2
    assert migrated["migration_v2"]["legacy_gate_states"]["G0"] == "complete"
    assert all(entry["status"] == "pending" for entry in migrated["workflow"]["gates"].values())
    assert migrated["legacy_artifacts"]["research/01_review.md"] == "research/01_review.md"
    assert migrated["legacy_artifacts"]["paper.yaml"] == "migration/legacy-paper-v1.yaml"
    assert migrated["legacy_artifacts"]["audit/release-check.md"] == "audit/legacy/release-check-v1.md"
    assert (paper / "audit/migration-v2.md").is_file()
    assert (paper / "migration/legacy-paper-v1.yaml").read_bytes() == v1_paper_yaml
    assert (paper / "audit/legacy/release-check-v1.md").read_bytes() == v1_release_check
    for relative, original in old_paths.items():
        assert (paper / relative).read_bytes() == original
    assert "LEGACY" in (paper / "research/01_review.md").read_text(encoding="utf-8") or "legacy model" in (paper / "research/01_review.md").read_text(encoding="utf-8")
    assert invoke(root, "check", "demo-paper").returncode == 0
    assert invoke(root, "migrate-v2", "demo-paper").returncode != 0


def test_phyagentos_legacy_check():
    result = invoke(REPO_ROOT, "check", "phyagentos")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[WARN]" in result.stdout
    assert "[FAIL]" not in result.stdout
    assert "CHECK PASS" in result.stdout


def test_check_detects_tracked_nested_build_artifact(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    init_git_repo(root)
    paper = root / "papers/demo-paper"
    dist_file = paper / "web/enhanced/dist/assets/app.js"
    env_file = paper / "web/enhanced/.env.production"
    dist_file.parent.mkdir(parents=True)
    env_file.parent.mkdir(parents=True, exist_ok=True)
    dist_file.write_text("built", encoding="utf-8")
    env_file.write_text("SECRET=value", encoding="utf-8")
    subprocess.run(
        ["git", "-C", str(root), "add", "-f", "papers/demo-paper/web/enhanced/dist/assets/app.js", "papers/demo-paper/web/enhanced/.env.production"],
        check=True,
    )
    result = invoke(root, "check", "demo-paper")
    assert result.returncode != 0
    assert "[FAIL] tracked generated path: papers/demo-paper/web/enhanced/dist/assets/app.js" in result.stdout
    assert "[FAIL] tracked environment path: papers/demo-paper/web/enhanced/.env.production" in result.stdout


def test_check_ignores_untracked_nested_node_modules(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    init_git_repo(root)
    modules = root / "papers/demo-paper/web/enhanced/node_modules/react/index.js"
    modules.parent.mkdir(parents=True)
    modules.write_text("local dependency", encoding="utf-8")
    result = invoke(root, "check", "demo-paper")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "node_modules" not in result.stdout
    assert "CHECK PASS" in result.stdout


def test_scaffold_kit_copies_default_continual_learning_components_once(tmp_path):
    root = make_project(tmp_path)
    created = invoke(root, "new", "demo-paper", "--title", "A Sample Paper", "--url", "https://example.org/paper")
    assert created.returncode == 0, created.stderr
    src = root / "papers/demo-paper/web/enhanced/src"
    src.mkdir(parents=True, exist_ok=True)

    result = invoke(root, "scaffold-kit", "demo-paper", "--preset", "continual-learning")

    shared = src / "shared"
    assert result.returncode == 0, result.stdout + result.stderr
    assert (shared / "KIT_VERSION").read_text(encoding="utf-8").strip() == "1.0.0"
    assert (shared / "foundation/styles/kit.css").is_file()
    assert (shared / "core/process-loop/ProcessLoopExplorer.tsx").is_file()
    assert (shared / "core/reference/ReferenceHub.tsx").is_file()
    assert not (shared / "optional/evidence-viewer/EvidenceViewer.tsx").exists()

    duplicate = invoke(root, "scaffold-kit", "demo-paper")
    assert duplicate.returncode != 0
    assert "destination already exists" in duplicate.stderr
    assert (shared / "KIT_VERSION").is_file()


def test_scaffold_kit_adds_only_selected_optional_components(tmp_path):
    root = make_project(tmp_path)
    created = invoke(root, "new", "demo-paper", "--title", "A Sample Paper", "--url", "https://example.org/paper")
    assert created.returncode == 0, created.stderr
    src = root / "papers/demo-paper/web/enhanced/src"
    src.mkdir(parents=True, exist_ok=True)

    result = invoke(root, "scaffold-kit", "demo-paper", "--add", "EvidenceViewer,BenchmarkExplorer,CompareView")

    shared = src / "shared"
    assert result.returncode == 0, result.stdout + result.stderr
    assert (shared / "optional/evidence-viewer/EvidenceViewer.tsx").is_file()
    assert (shared / "optional/benchmark-explorer/BenchmarkExplorer.tsx").is_file()
    assert (shared / "optional/compare-view/CompareView.tsx").is_file()
    assert not (shared / "optional/formula/FormulaBlock.tsx").exists()


def test_scaffold_kit_rejects_unknown_or_non_optional_component_without_writing(tmp_path):
    root = make_project(tmp_path)
    created = invoke(root, "new", "demo-paper", "--title", "A Sample Paper", "--url", "https://example.org/paper")
    assert created.returncode == 0, created.stderr
    src = root / "papers/demo-paper/web/enhanced/src"
    src.mkdir(parents=True, exist_ok=True)

    unknown = invoke(root, "scaffold-kit", "demo-paper", "--add", "ImaginaryExplorer")
    core = invoke(root, "scaffold-kit", "demo-paper", "--add", "ProcessLoopExplorer")

    assert unknown.returncode != 0 and "Unknown reusable component" in unknown.stderr
    assert core.returncode != 0 and "P1 components only" in core.stderr
    assert not (src / "shared").exists()
