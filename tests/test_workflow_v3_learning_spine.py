import yaml

from workflow_v3_helpers import load_config, make_project, write_fenced_yaml


def test_valid_learning_spine_and_priority_boundaries_pass(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    _spine, problems = module.v3_priority_data(paper, evidence_ids)
    assert problems == []


def test_learning_spine_rejects_missing_mainline_compact_reference_and_delete_rules(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    spine_path = paper / "design/learning-spine.md"
    data, _ = module.fenced_yaml(spine_path)
    items = {item["id"]: item for item in data["items"]}
    items["C01"]["stage"] = None
    items["C03"].update({"priority": "SUPPORTING", "placement": "mainline"})
    items["R03"]["stage"] = "S1"
    items["D01"].update({"stage": "S1", "placement": "mainline"})
    write_fenced_yaml(spine_path, "Learning Spine", data)

    _spine, problems = module.v3_priority_data(paper, evidence_ids)
    assert any("CORE item 'C01' must map" in problem for problem in problems)
    assert any("SUPPORTING item 'C03' needs a compact placement" in problem for problem in problems)
    assert any("REFERENCE item 'R03' must stay outside the mainline" in problem for problem in problems)
    assert any("DELETE item 'D01' must not be placed" in problem for problem in problems)


def test_learning_spine_rejects_unknown_evidence_and_duplicate_content_ids(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    evidence_ids, _entries, _problems = module.evidence_registry_ids_v3(paper)
    spine_path = paper / "design/learning-spine.md"
    data, _ = module.fenced_yaml(spine_path)
    data["items"][0]["evidence_refs"] = ["E404"]
    data["items"].append(dict(data["items"][0]))
    write_fenced_yaml(spine_path, "Learning Spine", data)
    _spine, problems = module.v3_priority_data(paper, evidence_ids)
    assert any("unknown evidence ID 'E404'" in problem for problem in problems)
    assert any("duplicate learning item ID 'C01'" in problem for problem in problems)


def test_w3_rejects_bad_evidence_registry_fields_and_unresolved_conflicts(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    registry_path = paper / "research/evidence-registry.yaml"
    registry = yaml.safe_load(registry_path.read_text(encoding="utf-8"))
    entry = registry["claims"]["E01"]
    entry["type"] = "NOT_A_TYPE"
    entry.pop("source_locator")
    entry.pop("allowed_wording")
    registry["review"]["unresolved_source_conflicts"] = ["Version metadata differs between sources"]
    registry_path.write_text(yaml.safe_dump(registry, sort_keys=False), encoding="utf-8")

    problems = module.v3_stage_completion_problems(paper, "W3", config)
    assert any("unknown type 'NOT_A_TYPE'" in problem for problem in problems)
    assert any("is missing source_locator" in problem for problem in problems)
    assert any("is missing allowed_wording" in problem for problem in problems)
    assert any("unresolved_source_conflicts" in problem for problem in problems)
