import json

from workflow_v3_helpers import make_project, write_manifest, write_fenced_yaml


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


def test_w6_requires_only_vertical_slice_core_and_w8_requires_all_core(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    assert module.v3_stage_completion_problems(paper, "W6", config) == []

    manifest_path = paper / "web/enhanced/implementation-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["implemented_core"]["C02"]["status"] = "planned"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    problems = module.v3_stage_completion_problems(paper, "W6", config)
    assert any("vertical-slice CORE item 'C02' must have status complete" in problem for problem in problems)

    manifest["implemented_core"]["C02"]["status"] = "complete"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    problems = module.v3_stage_completion_problems(paper, "W8", config)
    assert any("full implementation CORE item 'C03' must have status complete" in problem for problem in problems)

    manifest["implemented_core"]["C03"]["status"] = "complete"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    assert module.v3_stage_completion_problems(paper, "W8", config) == []


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
