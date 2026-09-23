import sys
from pathlib import Path

import pytest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from paper import GATES, validate_config


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
