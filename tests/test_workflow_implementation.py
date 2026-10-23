import json
import shutil

import pytest

from workflow_helpers import make_project, write_fake_kit, write_manifest, write_fenced_yaml


def test_implementation_plan_covers_priorities_evidence_and_vertical_slice(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    _plan, problems = module.v3_implementation_data(paper, evidence_ids)
    assert problems == []


def test_implementation_plan_rejects_missing_and_duplicate_core_and_unknown_stage(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    path = paper / "design/implementation-plan.md"
    data, _ = module.fenced_yaml(path)
    data["implementation"]["stages"][1]["core_items"] = ["C01", "C02"]
    data["implementation"]["stages"][1]["id"] = "S9"
    data["implementation"]["stages"][0]["evidence_refs"] = ["E404"]
    write_fenced_yaml(path, "Implementation Plan", data)
    with path.open("a", encoding="utf-8") as handle:
        handle.write("\n## Primary Spine Mapping\n\n## Reusable Pattern Library\n\n## Vertical Slice (W6)\n\n### Vertical Slice Review (W7)\n")

    _plan, problems = module.v3_implementation_data(paper, evidence_ids)
    assert any("CORE item 'C03' is missing" in problem for problem in problems)
    assert any("CORE item 'C01' must appear in exactly one" in problem for problem in problems)
    assert any("ID 'S9' is not in the learning spine" in problem for problem in problems)
    assert any("unknown evidence ID 'E404'" in problem for problem in problems)


def test_implementation_plan_rejects_invalid_vertical_slice_and_delete_item(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    path = paper / "design/implementation-plan.md"
    data, _ = module.fenced_yaml(path)
    implementation = data["implementation"]
    implementation["stages"][0]["core_items"].append("D01")
    implementation["vertical_slice"] = {"stages": ["S9"], "required_core_items": ["C03"]}
    write_fenced_yaml(path, "Implementation Plan", data)
    _plan, problems = module.v3_implementation_data(paper, evidence_ids)
    assert any("DELETE item 'D01' must not appear" in problem for problem in problems)
    assert any("vertical-slice stage 'S9' does not exist" in problem for problem in problems)
    assert any("vertical-slice CORE item 'C03' is not assigned" in problem for problem in problems)


def test_implementation_plan_rejects_unregistered_reusable_pattern(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    path = paper / "design/implementation-plan.md"
    data, _ = module.fenced_yaml(path)
    data["implementation"]["stages"][1]["reusable_pattern"] = "ImaginaryExplorer"
    write_fenced_yaml(path, "Implementation Plan", data)
    _plan, problems = module.v3_implementation_data(paper, evidence_ids)
    assert any("unknown reusable_pattern 'ImaginaryExplorer'" in problem for problem in problems)


def test_implementation_plan_deprecated_reusable_pattern_fails_candidate_warns(tmp_path, monkeypatch):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    kit = tmp_path / "maturity-kit"

    write_fake_kit(kit, {
        "ArchitectureExplorer": {
            "tier": "P0", "status": "candidate", "path": "core/architecture", "category": "architecture",
        },
    })
    monkeypatch.setattr(module, "REUSABLE_KIT", kit)
    warnings = []
    _plan, problems = module.v3_implementation_data(paper, evidence_ids, warnings=warnings)
    assert problems == []
    assert any("ArchitectureExplorer" in warning and "candidate" in warning for warning in warnings), warnings

    write_fake_kit(kit, {
        "ArchitectureExplorer": {
            "tier": "P0", "status": "deprecated", "path": "core/architecture", "category": "architecture",
        },
    })
    warnings = []
    _plan, problems = module.v3_implementation_data(paper, evidence_ids, warnings=warnings)
    assert any(
        "uses deprecated reusable component 'ArchitectureExplorer' and must choose a supported one" in problem
        for problem in problems
    ), problems
    assert warnings == []


def test_w6_and_w8_do_not_require_local_upstream_reports(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    manifest_path = paper / "web/enhanced/implementation-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    assert module.v3_stage_completion_problems(paper, "W6", config) == []
    assert module.v3_stage_completion_problems(paper, "W8", config)

    manifest["implemented_core"]["C03"]["status"] = "complete"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    report_path = paper / "audit/upstream-source-check.json"
    if report_path.exists():
        report_path.unlink()
    assert module.v3_stage_completion_problems(paper, "W8", config) == []
    assert not report_path.exists()


def test_w6_and_w8_use_configured_final_source_for_implementation_coverage(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    enhanced = paper / "web/enhanced"
    final = paper / "web/final"
    shutil.copytree(enhanced, final)

    manifest_path = final / "implementation-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["implemented_core"]["C03"]["status"] = "complete"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    (enhanced / "implementation-manifest.json").unlink()
    config["web"]["final"] = "web/final"

    assert module.v3_stage_completion_problems(paper, "W6", config) == []
    assert module.v3_stage_completion_problems(paper, "W8", config) == []


def test_w9_requires_human_audit_without_duplicate_upstream_status_rows(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    path = paper / "audit/final-check.md"
    text = path.read_text(encoding="utf-8").replace("Overall: PENDING", "Overall: PASS")
    text = "\n".join(line for line in text.splitlines() if "UPSTREAM_" not in line and "RUNTIME_MAPPING_REVIEW" not in line)
    path.write_text(text, encoding="utf-8")

    assert module.v3_stage_completion_problems(paper, "W9", config) == []


def test_implementation_manifest_rejects_delete_missing_supporting_and_mainline_reference(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    manifest_path = paper / "web/enhanced/implementation-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["implemented_core"]["D01"] = {"stage": "S1", "component": "Extra", "status": "complete"}
    manifest["supporting"] = {}
    manifest["reference"]["R03"]["placement"] = "mainline"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    problems = module.v3_stage_completion_problems(paper, "W8", config)
    assert any("DELETE items must stay out" in problem for problem in problems)
    assert any("SUPPORTING item 'S11' is missing" in problem for problem in problems)
    assert any("REFERENCE item 'R03' must not be marked mainline" in problem for problem in problems)
