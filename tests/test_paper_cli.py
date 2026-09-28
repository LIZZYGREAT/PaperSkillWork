import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
import yaml


REPO_ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = REPO_ROOT / "templates"


def make_project(tmp_path):
    shutil.copytree(REPO_ROOT / "tools", tmp_path / "tools")
    shutil.copytree(TEMPLATES, tmp_path / "templates")
    shutil.copytree(
        REPO_ROOT / "reusable-kit",
        tmp_path / "reusable-kit",
        ignore=shutil.ignore_patterns("node_modules", "dist", ".playwright"),
    )
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
    return invoke(
        root,
        "new", paper_id,
        "--title", title,
        "--url", "https://example.org/paper",
        "--arxiv-id", "1234.56789",
        "--author", "A. Author",
        "--venue", "Example Conference",
        "--year", "2026",
        "--source-type", "arXiv PDF",
        "--source-location", "https://example.org/paper",
    )


def load_paper(root, paper_id="demo-paper"):
    path = root / "papers" / paper_id / "paper.yaml"
    return path, yaml.safe_load(path.read_text(encoding="utf-8"))


def save_paper(path, config):
    path.write_text(yaml.safe_dump(config, sort_keys=False, allow_unicode=True), encoding="utf-8")


def init_git_repo(root):
    subprocess.run(["git", "init", "-q", str(root)], check=True)


def test_new_creates_v3_workspace_without_legacy_scaffolds(tmp_path):
    root = make_project(tmp_path)
    result = create_paper(root, title='A "Quoted" Paper')
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
    path = root / "papers/demo-paper/research/paper-model.md"
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


def test_status_is_read_only_and_reports_v3_stages(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path = root / "papers/demo-paper/paper.yaml"
    before = path.read_bytes()
    result = invoke(root, "status", "demo-paper")
    assert result.returncode == 0
    assert "Current Stage: W0" in result.stdout
    assert "Next Recommended Stage: W0 Source Intake" in result.stdout
    assert "[PRESENT] research/paper-model.md" in result.stdout
    assert "Current Gate" not in result.stdout
    assert "LEGACY" not in result.stdout
    assert path.read_bytes() == before


def test_check_separates_artifact_presence_from_stage_state(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "check", "demo-paper")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[STAGE] W2 Paper Understanding Model: PENDING" in result.stdout
    assert "[PRESENT] W2 artifact: research/paper-model.md" in result.stdout
    assert "[PRESENT] W4 artifact: design/learning-spine.md" in result.stdout
    assert "CHECK PASS" in result.stdout


@pytest.mark.parametrize("schema_version", [1, 2])
def test_historical_schemas_fail_with_clear_unsupported_message(tmp_path, schema_version):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    config["schema_version"] = schema_version
    save_paper(path, config)
    result = invoke(root, "status", "demo-paper")
    assert result.returncode != 0
    assert "Unsupported schema_version {}".format(schema_version) in result.stderr
    assert "supports schema_version 3 only" in result.stderr
    assert "KeyError" not in result.stderr
    assert "AttributeError" not in result.stderr


def test_duplicate_yaml_keys_are_rejected_from_paper_config(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path = root / "papers/demo-paper/paper.yaml"
    path.write_text(path.read_text(encoding="utf-8") + "title: Duplicate Title\n", encoding="utf-8")
    result = invoke(root, "check", "demo-paper")
    assert result.returncode != 0
    assert "duplicate key" in result.stderr


def test_schema_rejects_unsafe_v3_artifact_path(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    config["artifacts"]["paper_model"] = r"C:\Users\foo\a.md"
    save_paper(path, config)
    result = invoke(root, "check", "demo-paper")
    assert result.returncode != 0
    assert "artifacts.paper_model absolute paths" in result.stdout


def test_release_check_reports_v3_stage_blockers(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "release-check", "demo-paper")
    assert result.returncode != 0
    assert "NOT READY" in result.stdout
    assert "W0 Source Intake not complete" in result.stdout
    assert "W1 Source Cache + Asset Inventory not complete" in result.stdout
    assert "W9 Learning + Evidence Audit not complete" in result.stdout
    assert "audit/final-check.md must contain Overall: PASS" in result.stdout
    assert "G2 Evidence Registry" not in result.stdout


def test_paths_emits_only_configured_v3_paths(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "paths", "demo-paper", "--json")
    assert result.returncode == 0, result.stderr
    values = json.loads(result.stdout)
    assert values["source_cache"] == "papers/demo-paper/source-cache"
    assert values["learning_spine"] == "papers/demo-paper/design/learning-spine.md"
    assert values["enhanced"] == "papers/demo-paper/web/enhanced"
    assert "final" not in values
    assert "release_output" not in values
    assert "canonical" not in values
    assert "scenes" not in values


def test_paths_adds_configured_final_and_release_output(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    config["web"]["final"] = "web/final"
    config["release"] = {
        "upstream_paper_name": "demo_paper",
        "upstream_version": "ada0926",
        "output": "html_output/demo_paper/ada0926",
    }
    save_paper(path, config)
    result = invoke(root, "paths", "demo-paper", "--json")
    assert result.returncode == 0, result.stderr
    values = json.loads(result.stdout)
    assert values["final"] == "papers/demo-paper/web/final"
    assert values["release_output"] == "html_output/demo_paper/ada0926"


def test_open_final_requires_web_final_configuration(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "open", "demo-paper", "--edition", "final")
    assert result.returncode != 0
    assert "has not configured web.final" in result.stderr


def test_cli_help_exposes_only_current_commands():
    result = invoke(REPO_ROOT, "--help")
    assert result.returncode == 0
    for command in ("new", "status", "check", "stage", "scaffold-kit", "release-check", "upstream-check", "paths", "open"):
        assert command in result.stdout
    assert "Workflow v3" in result.stdout


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
    assert create_paper(root).returncode == 0
    src = root / "papers/demo-paper/web/enhanced/src"
    assert not src.exists()

    result = invoke(root, "scaffold-kit", "demo-paper", "--preset", "continual-learning")

    shared = src / "shared"
    assert result.returncode == 0, result.stdout + result.stderr
    assert src.is_dir()
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
    assert create_paper(root).returncode == 0
    src = root / "papers/demo-paper/web/enhanced/src"
    assert not src.exists()

    result = invoke(root, "scaffold-kit", "demo-paper", "--add", "EvidenceViewer,BenchmarkExplorer,CompareView")

    shared = src / "shared"
    assert result.returncode == 0, result.stdout + result.stderr
    assert (shared / "optional/evidence-viewer/EvidenceViewer.tsx").is_file()
    assert (shared / "optional/benchmark-explorer/BenchmarkExplorer.tsx").is_file()
    assert (shared / "optional/compare-view/CompareView.tsx").is_file()
    assert not (shared / "optional/formula/FormulaBlock.tsx").exists()


def test_scaffold_kit_rejects_unknown_or_non_optional_component_without_writing(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    src = root / "papers/demo-paper/web/enhanced/src"
    assert not src.exists()

    unknown = invoke(root, "scaffold-kit", "demo-paper", "--add", "ImaginaryExplorer")
    core = invoke(root, "scaffold-kit", "demo-paper", "--add", "ProcessLoopExplorer")

    assert unknown.returncode != 0 and "Unknown reusable component" in unknown.stderr
    assert core.returncode != 0 and "P1 components only" in core.stderr
    assert not src.exists()
