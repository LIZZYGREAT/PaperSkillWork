import json
import shutil
import subprocess

import pytest

from workflow_helpers import REPO_ROOT, make_project, run_source_check, write_manifest, write_fenced_yaml


LOCAL_PAPERSKILL = REPO_ROOT.parent / "PaperSkill"


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
    upstream = paper.parents[1] / "PaperSkill"
    assert run_source_check(module, paper, config, upstream, "full") == 0
    problems = module.v3_stage_completion_problems(paper, "W8", config)
    assert any("full implementation CORE item 'C03' must have status complete" in problem for problem in problems)

    manifest["implemented_core"]["C03"]["status"] = "complete"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    assert run_source_check(module, paper, config, upstream, "full") == 0
    assert module.v3_stage_completion_problems(paper, "W8", config) == []


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
    upstream = paper.parents[1] / "PaperSkill"
    assert run_source_check(module, paper, config, upstream, "structure") == 0
    assert run_source_check(module, paper, config, upstream, "full") == 0

    assert module.v3_stage_completion_problems(paper, "W6", config) == []
    assert module.v3_stage_completion_problems(paper, "W8", config) == []


def test_structure_check_fails_with_missing_tutorial_entry_and_blocks_w6(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    (paper / "web/enhanced/src/data/tutorial.ts").unlink()

    result = run_source_check(module, paper, config, root / "PaperSkill", "structure")
    assert result != 0
    record = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    structure = record["checks"]["structure"]
    assert structure["status"] == "FAIL"
    assert "missing required source file: src/data/tutorial.ts" in structure["error_summary"]
    problems = module.v3_stage_completion_problems(paper, "W6", config)
    assert any("status must be PASS" in problem for problem in problems)
    assert any("missing required source file: src/data/tutorial.ts" in problem for problem in problems)


@pytest.mark.parametrize("relative", [
    "src/modules/registry.tsx", "src/styles/paper.css", "src/types.ts",
    "src/styles/tokens.css", "src/styles/components.css", "src/main.tsx", "index.html",
])
def test_structure_check_reports_every_missing_upstream_entry(tmp_path, relative):
    root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    (paper / "web/enhanced" / relative).unlink()

    result = run_source_check(module, paper, config, root / "PaperSkill", "structure")
    assert result != 0
    record = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    assert "missing required source file: {}".format(relative) in record["checks"]["structure"]["error_summary"]


def test_structure_check_accepts_partial_slice_without_claiming_full_validation(tmp_path, capsys):
    root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    source = paper / "web/enhanced"
    report_path = paper / "audit/upstream-source-check.json"
    report = json.loads(report_path.read_text(encoding="utf-8"))
    report["checks"].pop("full")
    report_path.write_text(json.dumps(report), encoding="utf-8")
    (source / "src/data/tutorial.ts").write_text(
        "export const tutorial = [{ kind: 'chapter', id: 'slice', title: 'Opening only' }];\n",
        encoding="utf-8",
    )

    result = run_source_check(module, paper, config, root / "PaperSkill", "structure")
    assert result == 0
    output = capsys.readouterr().out
    assert "STRUCTURE PASS" in output
    assert "FULL_UPSTREAM_VALIDATION NOT_RUN (pending W8)" in output
    record = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    assert record["checks"]["structure"]["status"] == "PASS"
    assert "full" not in record["checks"]
    assert record["checks"]["structure"]["level"] == "structure"
    assert not (source / "paper.json").exists()


def test_w8_uses_official_failure_output_for_under_threshold_tutorial(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    write_manifest(paper, complete_core={
        "C01": ("S1", "Problem", "complete"),
        "C02": ("S2", "ArchitectureExplorer", "complete"),
        "C03": ("S2", "ArchitectureExplorer", "complete"),
    })
    # This is valid early-slice metadata, but the official full validator reports that the
    # chapter/module content is still below the target upstream contract.
    (paper / "web/enhanced/src/data/tutorial.ts").write_text(
        "export const tutorial = [{ kind: 'chapter', id: 'slice', title: 'Opening only' }];\n",
        encoding="utf-8",
    )
    result = run_source_check(
        module, paper, config, root / "PaperSkill", "full",
        "  ✗ chapter count is below the target contract\nRESULT: FAIL\n",
    )
    assert result != 0
    record = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    assert record["checks"]["full"]["official_validation"]["result"] == "FAIL"
    assert "chapter count is below the target contract" in record["checks"]["full"]["commands"][-1]["output"]
    problems = module.v3_stage_completion_problems(paper, "W8", config)
    assert any("status must be PASS" in problem for problem in problems)
    assert any("official validate-output.js must record exit code 0 and RESULT: PASS" in problem for problem in problems)


@pytest.mark.parametrize("relative,content,official_error", [
    (
        "src/data/tutorial.ts",
        "export const tutorial = [{ kind: 'chapter', id: 'slice', componentId: 'missing-widget' }];\n",
        "componentId(s) not registered in registry.tsx",
    ),
    (
        "src/styles/paper.css",
        "main { color: red; } /* TODO: replace template */\n",
        "leftover template placeholder",
    ),
])
def test_w8_does_not_override_official_component_or_placeholder_failures(
    tmp_path, relative, content, official_error,
):
    root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    (paper / "web/enhanced" / relative).write_text(content, encoding="utf-8")

    result = run_source_check(
        module, paper, config, root / "PaperSkill", "full",
        "  ✗ {}\nRESULT: FAIL\n".format(official_error),
    )
    assert result != 0
    problems = module.v3_stage_completion_problems(paper, "W8", config)
    assert any("official validate-output.js must record exit code 0 and RESULT: PASS" in problem for problem in problems)
    record = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    assert official_error in record["checks"]["full"]["commands"][-1]["output"]


def test_full_check_without_paperskill_checkout_is_explicitly_blocked(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)

    result = run_source_check(module, paper, config, None, "full")
    assert result != 0
    record = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    full = record["checks"]["full"]
    assert full["status"] == "FAIL"
    assert full["official_validation"]["result"] == "NOT_RUN"
    assert "requires --paperskill-repo" in full["error_summary"]


def test_missing_node_is_reported_without_a_false_structure_pass(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)

    result = run_source_check(
        module, paper, config, None, "structure", node_available=False,
    )
    assert result != 0
    report = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    structure = report["checks"]["structure"]
    assert structure["status"] == "FAIL"
    assert "Node.js was not found" in structure["error_summary"]


def test_w8_full_evidence_expires_when_release_source_changes(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    (paper / "web/enhanced/src/data/tutorial.ts").write_text(
        "export const tutorial = [{ kind: 'chapter', id: 'changed', title: 'Changed after validation' }];\n",
        encoding="utf-8",
    )
    problems = module.v3_stage_completion_problems(paper, "W8", config)
    assert any("source-check fingerprint is stale" in problem for problem in problems)


def test_completed_w6_reports_a_migration_hint_when_structure_evidence_is_missing(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    (paper / "audit/upstream-source-check.json").unlink()

    problems = module.v3_stage_completion_problems(paper, "W6", config)
    assert problems.count("audit/upstream-source-check.json is missing; run upstream-source-check --level structure") == 1


def test_w9_requires_upstream_audit_rows_and_runtime_mapping_review(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    path = paper / "audit/final-check.md"
    text = path.read_text(encoding="utf-8").replace("Overall: PENDING", "Overall: PASS")
    for row_name in (
        "UPSTREAM_SOURCE_STRUCTURE",
        "UPSTREAM_OFFICIAL_VALIDATE_OUTPUT",
        "UPSTREAM_RELEASE_SOURCE_BUILD",
    ):
        text = text.replace("| `{}` | NOT_RUN |".format(row_name), "| `{}` | PASS |".format(row_name))
    path.write_text(text, encoding="utf-8")

    problems = module.v3_stage_completion_problems(paper, "W9", config)
    assert any("RUNTIME_MAPPING_REVIEW must be PASS" in problem for problem in problems)

    text = text.replace("| `RUNTIME_MAPPING_REVIEW` | NOT_RUN |", "| `RUNTIME_MAPPING_REVIEW` | PASS |")
    path.write_text(text, encoding="utf-8")
    assert module.v3_stage_completion_problems(paper, "W9", config) == []


def test_real_local_official_validator_rejects_noncompliant_tutorial_when_available(tmp_path):
    if not (
        LOCAL_PAPERSKILL.is_dir()
        and (LOCAL_PAPERSKILL / ".git").exists()
        and (LOCAL_PAPERSKILL / "paper-skill/scripts/validate-output.js").is_file()
        and shutil.which("node")
        and shutil.which("npm")
        and shutil.which("git")
    ):
        pytest.skip("local PaperSkill checkout and Node/npm are unavailable; fixture-based validator contract tests still run")
    status = subprocess.run(
        ["git", "-C", str(LOCAL_PAPERSKILL), "status", "--porcelain", "--untracked-files=all"],
        capture_output=True, text=True, check=False,
    )
    if status.returncode != 0 or status.stdout.strip():
        pytest.skip("local PaperSkill checkout is not clean; the test does not alter or inspect a dirty validator")

    root, paper, config_path, module = make_project(tmp_path)
    config = module.load_yaml(config_path)
    (paper / "web/enhanced/src/data/tutorial.ts").write_text(
        "export const tutorial = [{ kind: 'chapter', id: 'slice', componentId: 'missing-widget' }];\n",
        encoding="utf-8",
    )

    result = module.run_upstream_source_check(paper, config, "full", LOCAL_PAPERSKILL)
    assert result != 0
    report = json.loads((paper / "audit/upstream-source-check.json").read_text(encoding="utf-8"))
    full = report["checks"]["full"]
    assert full["official_validation"]["result"] == "FAIL"
    assert "componentId(s) not registered in registry.tsx: missing-widget" in full["commands"][-1]["output"]
    assert any(
        "official validate-output.js must record exit code 0 and RESULT: PASS" in issue
        for issue in module.v3_stage_completion_problems(paper, "W8", config)
    )


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
