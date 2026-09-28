import sys
from pathlib import Path

import pytest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from paper import STAGES, V3_ARTIFACTS, validate_config


STAGE_KEYS = {stage_id: key for stage_id, key, _label in STAGES}


def valid_config(paper_id="demo-paper"):
    return {
        "schema_version": 3,
        "id": paper_id,
        "title": "A Sample Paper",
        "paper": {
            "url": "https://example.org/paper",
            "authors": ["A. Author"],
            "venue": "Example Conference",
            "year": 2026,
            "source_type": "arXiv PDF",
            "source_location": "https://example.org/paper",
            "source_hash": "",
        },
        "workflow": {
            "version": 3,
            "current_stage": "W0",
            "stages": {key: {"status": "pending"} for _stage_id, key, _label in STAGES},
        },
        "artifacts": dict(V3_ARTIFACTS),
        "web": {"enhanced": "web/enhanced"},
        "release": {"upstream_paper_name": "", "upstream_version": "", "output": ""},
    }


def test_valid_schema_has_no_errors():
    assert validate_config(valid_config(), "demo-paper") == []


@pytest.mark.parametrize("schema_version", [1, 2])
def test_schema_rejects_historical_workflow_versions(schema_version):
    config = valid_config()
    config["schema_version"] = schema_version
    errors = validate_config(config, "demo-paper")
    assert len(errors) == 1
    assert "Unsupported schema_version {}".format(schema_version) in errors[0]
    assert "supports schema_version 3 only" in errors[0]
    assert "Git history" in errors[0]


@pytest.mark.parametrize("unsafe", [r"C:\Users\foo\a.md", "/Users/alice/a.md"])
def test_schema_rejects_absolute_artifact_paths(unsafe):
    config = valid_config()
    config["artifacts"]["paper_model"] = unsafe
    errors = validate_config(config, "demo-paper")
    assert any("artifacts.paper_model absolute paths" in error for error in errors)


@pytest.mark.parametrize("unsafe", ["../foo.md", "research/../../foo.md"])
def test_schema_rejects_artifact_parent_traversal(unsafe):
    config = valid_config()
    config["artifacts"]["paper_model"] = unsafe
    errors = validate_config(config, "demo-paper")
    assert any("artifacts.paper_model parent traversal" in error for error in errors)


def test_workflow_version_must_be_three():
    config = valid_config()
    config["workflow"]["version"] = 2
    assert any("workflow.version must be 3" in error for error in validate_config(config, "demo-paper"))


def test_current_stage_must_be_in_w0_through_w10():
    config = valid_config()
    config["workflow"]["current_stage"] = "W11"
    assert any("current_stage must be one of W0 through W10" in error for error in validate_config(config, "demo-paper"))


def test_stage_map_must_be_complete_and_contain_no_unknown_stage():
    config = valid_config()
    config["workflow"]["stages"].pop(STAGE_KEYS["W5"])
    config["workflow"]["stages"]["W11_future"] = {"status": "pending"}
    errors = validate_config(config, "demo-paper")
    assert any("missing: {}".format(STAGE_KEYS["W5"]) in error for error in errors)
    assert any("unknown keys: W11_future" in error for error in errors)


def test_stage_entries_reject_unknown_fields():
    config = valid_config()
    config["workflow"]["stages"][STAGE_KEYS["W0"]]["reason"] = "not part of v3"
    errors = validate_config(config, "demo-paper")
    assert any("has unknown or invalid fields: reason" in error for error in errors)


def test_human_review_stage_requires_reviewer_and_note():
    config = valid_config()
    config["workflow"]["stages"][STAGE_KEYS["W2"]] = {"status": "complete"}
    errors = validate_config(config, "demo-paper")
    assert any("reviewed_by is required" in error for error in errors)
    assert any("note is required" in error for error in errors)

    config["workflow"]["stages"][STAGE_KEYS["W2"]] = {
        "status": "complete", "reviewed_by": "Reviewer", "note": "Accepted",
    }
    assert validate_config(config, "demo-paper") == []


def test_automatic_stage_requires_automation_completion_marker():
    config = valid_config()
    config["workflow"]["stages"][STAGE_KEYS["W3"]] = {"status": "complete"}
    assert any("completed_by must be automation" in error for error in validate_config(config, "demo-paper"))

    config["workflow"]["stages"][STAGE_KEYS["W3"]]["completed_by"] = "automation"
    assert validate_config(config, "demo-paper") == []


def test_v3_artifact_map_must_be_complete_and_exact():
    config = valid_config()
    del config["artifacts"]["learning_spine"]
    config["artifacts"]["scenes_dir"] = "design/scenes"
    errors = validate_config(config, "demo-paper")
    assert any("artifacts is missing: learning_spine" in error for error in errors)
    assert any("artifacts has unknown keys: scenes_dir" in error for error in errors)


def test_release_identifiers_and_output_must_be_configured_together():
    config = valid_config()
    config["release"]["upstream_paper_name"] = "demo_paper"
    errors = validate_config(config, "demo-paper")
    assert any("must be configured together" in error for error in errors)


def test_release_output_must_match_upstream_identifiers():
    config = valid_config()
    config["release"] = {
        "upstream_paper_name": "demo_paper",
        "upstream_version": "ada0926",
        "output": "html_output/other_paper/ada0926",
    }
    errors = validate_config(config, "demo-paper")
    assert any("release.output must equal html_output" in error for error in errors)

    config["release"]["output"] = "html_output/demo_paper/ada0926"
    assert validate_config(config, "demo-paper") == []


def test_release_paths_cannot_escape_workspace():
    config = valid_config()
    config["release"] = {
        "upstream_paper_name": "demo_paper",
        "upstream_version": "ada0926",
        "output": "../outside",
    }
    errors = validate_config(config, "demo-paper")
    assert any("release.output parent traversal" in error for error in errors)


def test_paper_source_metadata_types_are_checked():
    config = valid_config()
    config["paper"]["authors"] = "A. Author"
    config["paper"]["year"] = True
    config["paper"]["source_type"] = None
    errors = validate_config(config, "demo-paper")
    assert any("paper.authors must be a list of strings" in error for error in errors)
    assert any("paper.year must be an integer or null" in error for error in errors)
    assert any("paper.source_type must be a string" in error for error in errors)
