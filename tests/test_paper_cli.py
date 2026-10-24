import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

from workflow_helpers import write_fake_kit


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


def invoke(root, *args, env=None):
    return subprocess.run(
        [sys.executable, str(root / "tools" / "paper.py"), *args],
        cwd=Path(__file__).resolve().parent,
        text=True,
        capture_output=True,
        check=False,
        env=env,
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


def snapshot_files(root):
    return {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in root.rglob("*")
        if path.is_file()
    }


def load_paper_module(root):
    module_path = root / "tools" / "paper.py"
    name = "paper_cli_{}".format(abs(hash(str(root))))
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


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
    web_source = paper / "web/enhanced"
    for relative in (
        "package.json", "package-lock.json", "README.md", "index.html", "vite.config.ts", "tsconfig.json",
        "src/App.tsx", "src/main.tsx", "src/types.ts", "src/data/tutorial.ts",
        "src/modules/registry.tsx", "src/styles/tokens.css", "src/styles/components.css", "src/styles/paper.css",
    ):
        assert (web_source / relative).is_file(), relative
    tutorial = (web_source / "src/data/tutorial.ts").read_text(encoding="utf-8")
    assert "chapters: []" in tutorial
    assert 'kind: "chapter"' not in tutorial
    assert "widgetRegistry: Record<string, ComponentType<WidgetProps>> = {}" in (
        web_source / "src/modules/registry.tsx"
    ).read_text(encoding="utf-8")
    assert not (web_source / "src/modules/exampleSlider.tsx").exists()
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
    env = dict(os.environ)
    env.update({"GIT_CONFIG_GLOBAL": str(tmp_path / "missing.gitconfig"), "GIT_CONFIG_NOSYSTEM": "1"})
    result = invoke(root, "paths", "demo-paper", "--json", env=env)
    assert result.returncode == 0, result.stderr
    values = json.loads(result.stdout)
    assert values["source_cache"] == "papers/demo-paper/source-cache"
    assert values["learning_spine"] == "papers/demo-paper/design/learning-spine.md"
    assert values["enhanced"] == "papers/demo-paper/web/enhanced"
    assert values["publish_source"] == str((root / "papers/demo-paper/web/enhanced").resolve())
    assert "final" not in values
    assert "release_output" not in values
    assert "canonical" not in values
    assert "scenes" not in values


def test_paths_adds_configured_final_and_release_output(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    path, config = load_paper(root)
    final_source = root / "papers/demo-paper/web/final"
    final_source.mkdir(parents=True)
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
    assert values["publish_source"] == str(final_source.resolve())
    assert values["release_output"] == "html_output/demo_paper/ada0926"


def test_paths_reports_missing_configured_final_instead_of_falling_back(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    config_path, config = load_paper(root)
    config["web"]["final"] = "web/final"
    save_paper(config_path, config)

    result = invoke(root, "paths", "demo-paper", "--json")

    assert result.returncode != 0
    assert result.stdout == ""
    assert "configured web.final source is missing: web/final" in result.stderr


def test_release_info_reads_metadata_and_contributor_profile_without_side_effects(tmp_path):
    root = make_project(tmp_path / "project")
    assert create_paper(root, title="A Dynamic Paper Title").returncode == 0
    config_path, config = load_paper(root)
    final_source = root / "papers/demo-paper/web/final"
    final_source.mkdir(parents=True)
    config["web"]["final"] = "web/final"
    config["release"]["upstream_paper_name"] = "configured_paper_name"
    config["release"]["upstream_version"] = "ada1012"
    config["release"]["output"] = "html_output/configured_paper_name/ada1012"
    save_paper(config_path, config)

    global_config = tmp_path / "isolated.gitconfig"
    for key, value in (
        ("paperskillwork.participant", "Ada Example"),
        ("paperskillwork.pinyin", "adaexample"),
        ("paperskillwork.github", "ada-gh"),
    ):
        subprocess.run(["git", "config", "--file", str(global_config), key, value], check=True)
    env = dict(os.environ)
    env.update({"GIT_CONFIG_GLOBAL": str(global_config), "GIT_CONFIG_NOSYSTEM": "1"})

    before_status = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "status", "--short"],
        text=True, capture_output=True, check=True,
    ).stdout
    before_files = snapshot_files(root / "papers/demo-paper")

    result = invoke(root, "release-info", "demo-paper", "--json", env=env)

    assert result.returncode == 0, result.stderr
    assert result.stderr == ""
    values = json.loads(result.stdout)
    assert values == {
        "paper_id": "demo-paper",
        "paper_name": "configured_paper_name",
        "title": "A Dynamic Paper Title",
        "paper_url": "https://example.org/paper",
        "source": str(final_source.resolve()),
        "participant": "Ada Example",
        "pinyin": "adaexample",
        "github": "ada-gh",
        "year": 2026,
        "venue": "Example Conference",
    }
    assert snapshot_files(root / "papers/demo-paper") == before_files
    after_status = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "status", "--short"],
        text=True, capture_output=True, check=True,
    ).stdout
    assert after_status == before_status
    assert not (root / "html_output").exists()


def test_release_info_derives_paper_name_and_reports_missing_paper_url(tmp_path):
    root = make_project(tmp_path / "project")
    assert create_paper(root, title="A Dynamic Paper Title").returncode == 0
    config_path, config = load_paper(root)
    config["release"]["upstream_paper_name"] = ""
    config["paper"]["url"] = ""
    save_paper(config_path, config)

    result = invoke(root, "release-info", "demo-paper", "--json")

    assert result.returncode != 0
    assert result.stdout == ""
    assert "paper.url must be an https:// URL" in result.stderr


def test_open_final_requires_web_final_configuration(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    result = invoke(root, "open", "demo-paper", "--edition", "final")
    assert result.returncode != 0
    assert "has not configured web.final" in result.stderr


def test_cli_help_exposes_only_current_commands():
    result = invoke(REPO_ROOT, "--help")
    assert result.returncode == 0
    for command in ("new", "status", "check", "stage", "scaffold-kit", "release-check", "release-info", "paths", "open"):
        assert command in result.stdout
    assert "upstream-check" not in result.stdout
    assert "--replace-output" not in result.stdout
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
    base_files = snapshot_files(src)
    assert "App.tsx" in base_files
    assert "data/tutorial.ts" in base_files

    result = invoke(root, "scaffold-kit", "demo-paper", "--preset", "continual-learning", "--allow-unapproved")

    shared = src / "shared"
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[WARN] Button is candidate, not approved; copied because --allow-unapproved was passed" in result.stdout
    assert src.is_dir()
    assert all((src / relative).read_bytes() == content for relative, content in base_files.items())
    assert (shared / "KIT_VERSION").read_text(encoding="utf-8").strip() == "2.0.0"
    assert (shared / "foundation/styles/kit.css").is_file()
    assert (shared / "core/process-loop/ProcessLoopExplorer.tsx").is_file()
    assert (shared / "core/reference/ReferenceHub.tsx").is_file()
    assert not (shared / "optional/evidence-viewer/EvidenceViewer.tsx").exists()
    assert not (shared / "foundation/neural-network/MiniNetworkGlyph.tsx").exists()
    assert not (shared / "foundation/animation/useAnimationTimeline.ts").exists()
    after_scaffold = snapshot_files(src)

    duplicate = invoke(root, "scaffold-kit", "demo-paper", "--allow-unapproved")
    assert duplicate.returncode != 0
    assert "destination already exists" in duplicate.stderr
    assert (shared / "KIT_VERSION").is_file()
    assert snapshot_files(src) == after_scaffold


def test_scaffold_kit_adds_only_selected_optional_components(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    src = root / "papers/demo-paper/web/enhanced/src"
    base_files = snapshot_files(src)

    result = invoke(
        root, "scaffold-kit", "demo-paper",
        "--add", "EvidenceViewer,BenchmarkExplorer,CompareView,MiniNetworkGlyph,useAnimationTimeline",
        "--allow-unapproved",
    )

    shared = src / "shared"
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[WARN] CompareView is candidate, not approved; copied because --allow-unapproved was passed" in result.stdout
    assert "Optional components: EvidenceViewer, BenchmarkExplorer, CompareView" in result.stdout
    assert all((src / relative).read_bytes() == content for relative, content in base_files.items())
    assert (shared / "optional/evidence-viewer/EvidenceViewer.tsx").is_file()
    assert (shared / "optional/benchmark-explorer/BenchmarkExplorer.tsx").is_file()
    assert (shared / "optional/compare-view/CompareView.tsx").is_file()
    assert (shared / "foundation/neural-network/MiniNetworkGlyph.tsx").is_file()
    assert (shared / "foundation/neural-network/mini-network-glyph.css").is_file()
    assert (shared / "foundation/animation/useAnimationTimeline.ts").is_file()
    assert (shared / "foundation/animation/easing.ts").is_file()
    assert not (shared / "optional/formula/FormulaBlock.tsx").exists()


def test_scaffold_kit_rejects_unknown_or_non_optional_component_without_writing(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    src = root / "papers/demo-paper/web/enhanced/src"
    base_files = snapshot_files(src)

    unknown = invoke(root, "scaffold-kit", "demo-paper", "--add", "ImaginaryExplorer", "--allow-unapproved")
    core = invoke(root, "scaffold-kit", "demo-paper", "--add", "ProcessLoopExplorer", "--allow-unapproved")

    assert unknown.returncode != 0 and "Unknown reusable component" in unknown.stderr
    assert core.returncode != 0 and "P1 components only" in core.stderr
    assert snapshot_files(src) == base_files


def test_scaffold_kit_blocks_unapproved_components_without_flag(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    src = root / "papers/demo-paper/web/enhanced/src"
    base_files = snapshot_files(src)

    preset = invoke(root, "scaffold-kit", "demo-paper", "--preset", "continual-learning")
    optional = invoke(root, "scaffold-kit", "demo-paper", "--add", "EvidenceViewer")

    for result in (preset, optional):
        assert result.returncode != 0
        assert "--allow-unapproved" in result.stderr
    assert "Button" in preset.stderr
    assert "EvidenceViewer" in optional.stderr
    assert "[WARN]" not in preset.stdout
    assert not (src / "shared").exists()
    assert snapshot_files(src) == base_files


def test_scaffold_kit_prints_no_warning_without_unapproved_components(tmp_path, monkeypatch, capsys):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    kit = tmp_path / "approved-kit"
    write_fake_kit(kit, {
        "ApprovedDefault": {
            "tier": "P0", "status": "approved", "path": "foundation/controls", "category": "control",
            "default_for": ["continual-learning"], "approved_by": "A Reviewer",
            "approved_at": "2026-02-01", "evidence": ["papers/demo/web/enhanced/App.tsx"],
        },
    })
    module = load_paper_module(root)
    monkeypatch.setattr(module, "REUSABLE_KIT", kit)

    assert module.cmd_scaffold_kit(argparse.Namespace(
        paper_id="demo-paper", preset="continual-learning", add="", allow_unapproved=False,
    )) == 0

    captured = capsys.readouterr()
    assert "[WARN]" not in captured.out
    assert "Copied Reusable Kit v9.9.9" in captured.out
    shared = root / "papers/demo-paper/web/enhanced/src/shared"
    assert (shared / "KIT_VERSION").read_text(encoding="utf-8").strip() == "9.9.9"
    assert (shared / "foundation/controls/Placeholder.tsx").is_file()


def test_scaffold_kit_rejects_deprecated_component(tmp_path, monkeypatch):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    src = root / "papers/demo-paper/web/enhanced/src"
    base_files = snapshot_files(src)
    kit = tmp_path / "deprecated-kit"
    write_fake_kit(kit, {
        "DeprecatedDefault": {
            "tier": "P0", "status": "deprecated", "path": "foundation/controls",
            "category": "control", "default_for": ["continual-learning"],
        },
        "DeprecatedOptional": {
            "tier": "P1", "status": "deprecated", "path": "optional/old-view",
            "category": "comparison",
        },
    })
    module = load_paper_module(root)
    monkeypatch.setattr(module, "REUSABLE_KIT", kit)

    def run_scaffold(add="", allow_unapproved=False):
        return module.cmd_scaffold_kit(argparse.Namespace(
            paper_id="demo-paper", preset="continual-learning", add=add,
            allow_unapproved=allow_unapproved,
        ))

    with pytest.raises(module.PaperError) as preset_error:
        run_scaffold()
    assert "deprecated" in str(preset_error.value)
    assert "DeprecatedDefault" in str(preset_error.value)

    with pytest.raises(module.PaperError) as optional_error:
        run_scaffold(add="DeprecatedOptional", allow_unapproved=True)
    assert "deprecated" in str(optional_error.value)
    assert "DeprecatedOptional" in str(optional_error.value)

    assert not (src / "shared").exists()
    assert snapshot_files(src) == base_files


def test_approved_component_requires_approval_record(tmp_path, monkeypatch):
    root = make_project(tmp_path)
    module = load_paper_module(root)

    incomplete = tmp_path / "kit-incomplete"
    write_fake_kit(incomplete, {
        "Unapproved": {"tier": "P1", "status": "approved", "path": "optional/evidence-viewer", "category": "evidence"},
    })
    monkeypatch.setattr(module, "REUSABLE_KIT", incomplete)
    components, problems = module.reusable_kit_registry()
    assert "Unapproved" not in components
    for field in ("approved_by", "approved_at", "evidence"):
        assert any("Unapproved" in problem and field in problem for problem in problems), problems

    bad_date = tmp_path / "kit-bad-date"
    write_fake_kit(bad_date, {
        "Unapproved": {
            "tier": "P1", "status": "approved", "path": "optional/evidence-viewer", "category": "evidence",
            "approved_by": "A Reviewer", "approved_at": "2026-13-01", "evidence": ["papers/demo/web/enhanced/App.tsx"],
        },
    })
    monkeypatch.setattr(module, "REUSABLE_KIT", bad_date)
    components, problems = module.reusable_kit_registry()
    assert "Unapproved" not in components
    assert any("Unapproved" in problem and "2026-13-01" in problem for problem in problems), problems

    complete = tmp_path / "kit-complete"
    write_fake_kit(complete, {
        "Unapproved": {
            "tier": "P1", "status": "approved", "path": "optional/evidence-viewer", "category": "evidence",
            "approved_by": "A Reviewer", "approved_at": "2026-02-01", "evidence": ["papers/demo/web/enhanced/App.tsx"],
        },
    })
    monkeypatch.setattr(module, "REUSABLE_KIT", complete)
    components, problems = module.reusable_kit_registry()
    assert problems == []
    assert components["Unapproved"]["status"] == "approved"


def test_non_approved_component_with_approval_record_is_rejected(tmp_path, monkeypatch):
    root = make_project(tmp_path)
    module = load_paper_module(root)
    kit = tmp_path / "kit-contradictory"
    write_fake_kit(kit, {
        "FakeApproval": {
            "tier": "P1", "status": "candidate", "path": "optional/evidence-viewer", "category": "evidence",
            "approved_by": "A Reviewer", "approved_at": "2026-02-01", "evidence": ["papers/demo/web/enhanced/App.tsx"],
        },
    })
    monkeypatch.setattr(module, "REUSABLE_KIT", kit)

    components, problems = module.reusable_kit_registry()
    assert "FakeApproval" not in components
    assert any("FakeApproval" in problem and "candidate" in problem for problem in problems), problems


def test_registry_requires_version_two(tmp_path, monkeypatch):
    root = make_project(tmp_path)
    module = load_paper_module(root)
    kit = tmp_path / "kit-v1"
    write_fake_kit(kit, {
        "Button": {"tier": "P0", "status": "candidate", "path": "foundation/controls", "category": "control"},
    }, version=1)
    monkeypatch.setattr(module, "REUSABLE_KIT", kit)

    _components, problems = module.reusable_kit_registry()
    assert any("version: 2" in problem for problem in problems), problems
