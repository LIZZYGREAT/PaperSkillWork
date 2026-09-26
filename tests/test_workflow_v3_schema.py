import json

from workflow_v3_helpers import load_config, make_project


def test_new_creates_workflow_v3_workspace_without_legacy_scaffolds(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    assert config["schema_version"] == 3
    assert config["workflow"]["version"] == 3
    assert list(config["workflow"]["stages"]) == [stage[1] for stage in module.STAGES]
    for relative in (
        "source-cache/content.md", "source-cache/manifest.json", "source-cache/evidence.json",
        "research/paper-model.md", "research/evidence-registry.yaml", "design/learning-spine.md",
        "design/asset-plan.md", "design/implementation-plan.md", "web/enhanced/implementation-manifest.json",
    ):
        assert (paper / relative).is_file(), relative
    for relative in (
        "research/01_paper_model.md", "research/02_evidence_registry.yaml",
        "design/learning-contract.md", "design/learning-architecture.md", "design/scenes",
    ):
        assert not (paper / relative).exists(), relative
    assert config["release"] == {"upstream_paper_name": "", "upstream_version": "", "output": ""}


def test_v3_release_identifiers_are_separate_and_output_is_derived_from_them(tmp_path):
    _root, _paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "learning_without_forgetting",
        "upstream_version": "ada0926",
        "output": "html_output/learning_without_forgetting/ada0926",
    }
    assert module.validate_config(config, "demo-paper") == []
    config["release"]["output"] = "html_output/demo-paper/v1"
    assert any("must equal html_output" in error for error in module.validate_config(config, "demo-paper"))


def test_w1_source_cache_pending_and_manifest_mismatch_fail_but_complete_cache_passes(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    (paper / "source-cache/content.md").write_text("SOURCE CACHE STATUS: PENDING\n", encoding="utf-8")
    _manifest, problems = module.v3_cache_data(paper)
    assert any("pending scaffold" in problem for problem in problems)

    (paper / "source-cache/content.md").write_text("Complete cached source text.\n", encoding="utf-8")
    manifest_path = paper / "source-cache/manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["paper"]["title"] = "A different title"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    problems = module.v3_stage_completion_problems(paper, "W1", config)
    assert any("manifest paper.title does not match" in problem for problem in problems)

    manifest["paper"]["title"] = config["title"]
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    _manifest, problems = module.v3_cache_data(paper)
    assert problems == []
