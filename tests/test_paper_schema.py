import sys
from pathlib import Path

import pytest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from paper import GATES, V2_ARTIFACTS, validate_config


def valid_config(paper_id="demo-paper"):
    return {
        "schema_version": 1,
        "id": paper_id,
        "title": "A Sample Paper",
        "paper": {"url": "https://example.org/paper", "arxiv_id": "", "local_pdf": "source/paper.pdf"},
        "workflow": {
            "current_gate": "G0",
            "gates": {key: {"status": "pending"} for _gate, key, _label in GATES},
        },
        "artifacts": {
            "review": "research/01_review.md",
            "evidence_audit": "research/02_evidence_audit.md",
            "storyboard": "design/storyboard.md",
            "interaction_plan": "design/interaction-plan.md",
        },
        "web": {"canonical": "web/canonical", "enhanced": "web/enhanced"},
    }


def valid_v2_config(paper_id="demo-paper"):
    config = valid_config(paper_id)
    config["schema_version"] = 2
    config["workflow"]["version"] = 2
    config["artifacts"] = dict(V2_ARTIFACTS)
    return config


def test_valid_schema_has_no_errors():
    config = valid_config()
    assert validate_config(config, "demo-paper") == []


@pytest.mark.parametrize("unsafe", [r"C:\Users\foo\a.md", "/Users/alice/a.md"])
def test_schema_rejects_absolute_paths(unsafe):
    config = valid_config()
    config["artifacts"]["review"] = unsafe
    assert any("absolute paths" in error for error in validate_config(config, "demo-paper"))


@pytest.mark.parametrize("unsafe", ["../foo.md", "research/../../foo.md"])
def test_schema_rejects_parent_traversal(unsafe):
    config = valid_config()
    config["artifacts"]["review"] = unsafe
    assert any("parent traversal" in error for error in validate_config(config, "demo-paper"))


def test_schema_requires_complete_gate_map_and_known_status():
    config = valid_config()
    config["workflow"]["gates"].pop("G5_interaction_design")
    config["workflow"]["gates"]["G1_research"]["status"] = ["complete"]
    errors = validate_config(config, "demo-paper")
    assert any("missing: G5_interaction_design" in error for error in errors)
    assert any("G1_research.status" in error for error in errors)


def test_schema_requires_reason_for_skipped_gate():
    config = valid_config()
    config["workflow"]["gates"]["G1_research"]["status"] = "skipped"
    errors = validate_config(config, "demo-paper")
    assert any("skipped status requires a reason" in error for error in errors)
    config["workflow"]["gates"]["G1_research"]["reason"] = "Out of scope for this paper"
    assert validate_config(config, "demo-paper") == []


def test_legacy_status_is_limited_to_migration_case():
    config = valid_config()
    config["workflow"]["gates"]["G2_evidence_audit"]["status"] = "legacy"
    assert any("reserved for the PhyAgentOS" in error for error in validate_config(config, "demo-paper"))
    migration = valid_config("phyagentos")
    migration["workflow"]["gates"]["G2_evidence_audit"]["status"] = "legacy"
    assert validate_config(migration, "phyagentos") == []


def test_v2_schema_requires_v2_workflow_and_artifact_contract():
    config = valid_v2_config()
    assert validate_config(config, "demo-paper") == []
    config["workflow"]["version"] = 1
    assert any("workflow.version must be 2" in error for error in validate_config(config, "demo-paper"))
    config["workflow"]["version"] = 2
    del config["artifacts"]["terms"]
    assert any("artifacts is missing: terms" in error for error in validate_config(config, "demo-paper"))


def test_v2_schema_rejects_legacy_gate_state():
    config = valid_v2_config()
    config["workflow"]["gates"]["G2_evidence_audit"]["status"] = "legacy"
    assert any("Workflow v2 gates cannot use legacy status" in error for error in validate_config(config, "demo-paper"))


def test_v2_schema_rejects_unsafe_paths():
    config = valid_v2_config()
    config["artifacts"]["paper_model"] = "../outside.md"
    errors = validate_config(config, "demo-paper")
    assert any("artifacts.paper_model parent traversal" in error for error in errors)
