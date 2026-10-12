import pytest

from workflow_helpers import (
    HUMAN_STAGES, STAGE_KEYS, invoke, load_config, make_project, mark_prior_stages_complete,
    save_config, write_manifest,
)


def test_stage_order_blocks_w4_before_w3_and_w7_before_w6(tmp_path):
    root, _paper, _config_path, _module = make_project(tmp_path)
    result = invoke(root, "stage", "demo-paper", "W4", "in_progress")
    assert result.returncode != 0
    assert "W0 Source Intake is pending" in result.stderr
    result = invoke(root, "stage", "demo-paper", "W7", "complete", "--reviewed-by", "Reviewer", "--note", "Accepted")
    assert result.returncode != 0
    assert "W0 Source Intake is pending" in result.stderr


@pytest.mark.parametrize("stage", sorted(HUMAN_STAGES))
def test_human_review_stages_require_reviewer_and_note(tmp_path, stage):
    root, _paper, config_path, _module = make_project(tmp_path)
    config = load_config(config_path)
    mark_prior_stages_complete(config, stage)
    save_config(config_path, config)
    result = invoke(root, "stage", "demo-paper", stage, "complete")
    assert result.returncode != 0
    assert "requires --reviewed-by and --note" in result.stderr


@pytest.mark.parametrize("stage", ["W0", "W1", "W3", "W5", "W6", "W8"])
def test_automatic_stages_complete_without_fake_reviewer(tmp_path, stage):
    root, paper, config_path, _module = make_project(tmp_path)
    if stage != "W0":
        config = load_config(config_path)
        mark_prior_stages_complete(config, stage)
        if stage == "W8":
            write_manifest(paper, complete_core={
                "C01": ("S1", "Problem", "complete"),
                "C02": ("S2", "ArchitectureExplorer", "complete"),
                "C03": ("S2", "ArchitectureExplorer", "complete"),
            })
        save_config(config_path, config)
    result = invoke(root, "stage", "demo-paper", stage, "complete")
    assert result.returncode == 0, result.stderr
    config = load_config(config_path)
    entry = config["workflow"]["stages"][STAGE_KEYS[stage]]
    assert entry["status"] == "complete"
    assert entry["completed_by"] == "automation"
    assert "reviewed_by" not in entry
    assert "note" not in entry


def test_check_passes_when_w10_is_pending_without_local_paperskill_path(tmp_path):
    root, paper, config_path, _module = make_project(tmp_path)
    config = load_config(config_path)
    config["workflow"]["current_stage"] = "W10"
    save_config(config_path, config)

    result = invoke(root, "check", "demo-paper")

    assert result.returncode == 0, result.stdout + result.stderr
    assert "[MANUAL] Official PaperSkill preflight is recorded by the user after it passes." in result.stdout
    assert "[WARN] W10:" not in result.stdout
    assert "MISSING W10 artifact" not in result.stdout
    assert "CHECK PASS" in result.stdout
    assert not (paper / "audit/upstream-source-check.json").exists()
    assert not (root / "html_output").exists()


def test_w10_records_user_confirmed_preflight_without_local_export_or_report(tmp_path):
    root, paper, config_path, _module = make_project(tmp_path)
    config = load_config(config_path)
    mark_prior_stages_complete(config, "W10")
    config["release"] = {"upstream_paper_name": "", "upstream_version": "", "output": ""}
    save_config(config_path, config)
    result = invoke(root, "stage", "demo-paper", "W10", "complete")
    assert result.returncode == 0, result.stderr
    config = load_config(config_path)
    assert config["workflow"]["stages"][STAGE_KEYS["W10"]]["completed_by"] == "automation"
    assert config["workflow"]["stages"][STAGE_KEYS["W10"]]["status"] == "complete"
    assert not (paper / "audit/upstream-preflight.json").exists()
    assert not (root / "html_output").exists()


def test_status_shows_release_output_as_metadata_without_checking_local_path(tmp_path):
    root, _paper, config_path, _module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada1012",
        "output": "html_output/sample_paper_name/ada1012",
    }
    save_config(config_path, config)

    result = invoke(root, "status", "demo-paper")

    assert result.returncode == 0, result.stderr
    assert "html_output/sample_paper_name/ada1012" not in result.stdout
    assert not (root / "html_output").exists()
