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


def create_paper(root, paper_id="demo-paper"):
    return invoke(root, "new", paper_id, "--title", "A Sample Paper", "--url", "https://example.org/paper", "--arxiv-id", "1234.56789")


def init_git_repo(root):
    subprocess.run(["git", "init", "-q", str(root)], check=True)


def load_paper(root, paper_id="demo-paper"):
    path = root / "papers" / paper_id / "paper.yaml"
    return path, yaml.safe_load(path.read_text(encoding="utf-8"))


def save_paper(path, config):
    path.write_text(yaml.safe_dump(config, sort_keys=False, allow_unicode=True), encoding="utf-8")


def test_new_creates_workspace(tmp_path):
    root = make_project(tmp_path)
    result = create_paper(root)
    assert result.returncode == 0, result.stderr
    paper = root / "papers/demo-paper"
    for relative in (
        "paper.yaml",
        "source/paper.url",
        "research/01_review.md",
        "research/02_evidence_audit.md",
        "design/storyboard.md",
        "design/interaction-plan.md",
        "audit/content-check.md",
        "audit/release-check.md",
    ):
        assert (paper / relative).is_file(), relative
    assert not (paper / "web").exists()
    assert "{{" not in (paper / "research/01_review.md").read_text(encoding="utf-8")


def test_new_rejects_duplicate_without_overwriting(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path = root / "papers/demo-paper/research/01_review.md"
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
    assert "Next Recommended Gate: G0 Workspace" in result.stdout
    assert "[PRESENT] research/01_review.md" in result.stdout
    assert path.read_bytes() == before


def test_check_separates_artifact_presence_from_gate_state(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "check", "demo-paper")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[GATE] G1 Research: PENDING" in result.stdout
    assert "[PRESENT] G1 artifact: research/01_review.md" in result.stdout


def test_status_marks_missing_legacy_artifacts():
    result = invoke(REPO_ROOT, "status", "phyagentos")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[LEGACY] research/02_evidence_audit.md" in result.stdout
    assert "[LEGACY] design/storyboard.md" in result.stdout


def test_new_paper_cannot_claim_legacy(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    config["workflow"]["gates"]["G2_evidence_audit"]["status"] = "legacy"
    save_paper(path, config)
    result = invoke(root, "status", "demo-paper")
    assert result.returncode != 0
    assert "reserved for the PhyAgentOS" in result.stderr


def test_gate_complete_requires_artifact(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    assert invoke(root, "gate", "demo-paper", "G0", "complete").returncode == 0
    (root / "papers/demo-paper/research/01_review.md").unlink()
    result = invoke(root, "gate", "demo-paper", "G1", "complete")
    assert result.returncode != 0
    assert "01_review.md" in result.stderr


def test_can_complete_after_previous_gate_complete(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    assert invoke(root, "gate", "demo-paper", "G0", "complete").returncode == 0
    (root / "papers/demo-paper/research/01_review.md").write_text("reviewed", encoding="utf-8")
    result = invoke(root, "gate", "demo-paper", "G1", "complete")
    assert result.returncode == 0, result.stderr
    _path, config = load_paper(root)
    assert config["workflow"]["gates"]["G1_research"]["status"] == "complete"
    assert config["workflow"]["current_gate"] == "G2"


def test_cannot_complete_gate_out_of_order(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "gate", "demo-paper", "G5", "complete")
    assert result.returncode != 0
    assert "G0 Workspace is pending" in result.stderr
    _path, config = load_paper(root)
    assert config["workflow"]["gates"]["G5_interaction_design"]["status"] == "pending"


def test_gate_rejects_legacy_for_new_paper(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path = root / "papers/demo-paper/paper.yaml"
    before = path.read_bytes()
    result = invoke(root, "gate", "demo-paper", "G2", "legacy")
    assert result.returncode != 0
    assert "reserved for the PhyAgentOS" in result.stderr
    assert path.read_bytes() == before


def test_legacy_predecessor_is_allowed_for_migration(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root, "phyagentos").returncode == 0
    paper = root / "papers/phyagentos"
    (paper / "web/canonical").mkdir(parents=True)
    (paper / "web/canonical/index.html").write_text("canonical", encoding="utf-8")
    path, config = load_paper(root, "phyagentos")
    config["workflow"]["gates"]["G0_workspace"]["status"] = "complete"
    config["workflow"]["gates"]["G1_research"]["status"] = "complete"
    config["workflow"]["gates"]["G2_evidence_audit"]["status"] = "legacy"
    save_paper(path, config)
    result = invoke(root, "gate", "phyagentos", "G3", "complete")
    assert result.returncode == 0, result.stderr


def test_g7_cannot_complete_before_gates(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / "papers/demo-paper"
    (paper / "audit/content-check.md").write_text("Content Check Status: PASS", encoding="utf-8")
    (paper / "audit/release-check.md").write_text("Release Check Status: READY", encoding="utf-8")
    result = invoke(root, "gate", "demo-paper", "G7", "complete")
    assert result.returncode != 0
    assert "G0 Workspace is pending" in result.stderr


@pytest.mark.parametrize("bad_path", [r"C:\Users\foo\a.md", "../../foo.md"])
def test_schema_rejects_unsafe_artifact_path(tmp_path, bad_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    config["artifacts"]["review"] = bad_path
    save_paper(path, config)
    result = invoke(root, "check", "demo-paper")
    assert result.returncode != 0
    assert "artifacts.review" in result.stdout


def test_release_check_reports_blockers(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "release-check", "demo-paper")
    assert result.returncode != 0
    assert "NOT READY" in result.stdout
    assert "G2 Evidence Audit not complete" in result.stdout
    assert "content-check.md is not PASS" in result.stdout


def test_release_ready(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / "papers/demo-paper"
    for relative in (
        "research/01_review.md",
        "research/02_evidence_audit.md",
        "design/storyboard.md",
        "design/interaction-plan.md",
    ):
        (paper / relative).write_text("verified artifact", encoding="utf-8")
    (paper / "web/canonical").mkdir(parents=True)
    (paper / "web/canonical/index.html").write_text("canonical", encoding="utf-8")
    (paper / "web/enhanced").mkdir(parents=True)
    (paper / "web/enhanced/package.json").write_text(json.dumps({"scripts": {"build": "vite build"}}), encoding="utf-8")
    (paper / "audit/content-check.md").write_text("Content Check Status: PASS", encoding="utf-8")
    (paper / "audit/release-check.md").write_text("Release Check Status: READY", encoding="utf-8")
    path, config = load_paper(root)
    for key in (
        "G0_workspace", "G1_research", "G2_evidence_audit", "G3_canonical",
        "G4_narrative_design", "G5_interaction_design", "G6_enhanced",
    ):
        config["workflow"]["gates"][key]["status"] = "complete"
    save_paper(path, config)
    result = invoke(root, "release-check", "demo-paper")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "RELEASE READY" in result.stdout


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
