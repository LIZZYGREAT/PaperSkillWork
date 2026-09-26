from workflow_v3_helpers import load_config, make_project, write_export, write_upstream_report, write_fenced_yaml, write_manifest


def test_w3_requires_original_source_and_approved_rights_but_not_derivative(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path, selected_asset=True)
    config = load_config(config_path)
    assert module.v3_stage_completion_problems(paper, "W3", config) == []

    asset_path = paper / "design/asset-plan.md"
    data, _ = module.fenced_yaml(asset_path)
    data["assets"][0]["reuse_rights"] = "pending"
    write_fenced_yaml(asset_path, "Asset Plan", data)
    problems = module.v3_stage_completion_problems(paper, "W3", config)
    assert any("no approved reuse-rights basis" in problem for problem in problems)

    data["assets"][0]["reuse_rights"] = "Permission granted by the authors"
    data["assets"][0]["source_path"] = "source-cache/figures/missing.png"
    write_fenced_yaml(asset_path, "Asset Plan", data)
    problems = module.v3_stage_completion_problems(paper, "W3", config)
    assert any("selected source asset is missing" in problem for problem in problems)


def test_w8_requires_asset_derivative_web_copy_and_provenance(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path, selected_asset=True)
    config = load_config(config_path)
    write_manifest(paper, complete_core={
        "C01": ("S1", "Problem", "complete"),
        "C02": ("S2", "ArchitectureExplorer", "complete"),
        "C03": ("S2", "ArchitectureExplorer", "complete"),
    })
    problems = module.v3_stage_completion_problems(paper, "W8", config)
    assert any("selected web derivative is missing" in problem for problem in problems)
    assert any("is missing from web/enhanced" in problem for problem in problems)
    assert any("web/enhanced is missing asset provenance README.md" in problem for problem in problems)

    derivative = paper / "assets/figures/web/F01.png"
    derivative.parent.mkdir(parents=True, exist_ok=True)
    derivative.write_bytes(b"web-derivative")
    web_asset = paper / "web/enhanced/public/images/F01.png"
    web_asset.parent.mkdir(parents=True, exist_ok=True)
    web_asset.write_bytes(b"web-asset")
    (paper / "web/enhanced/README.md").write_text("## Asset provenance\n", encoding="utf-8")
    assert module.v3_stage_completion_problems(paper, "W8", config) == []


def test_w10_requires_exported_asset_and_readme_provenance(tmp_path):
    root, paper, config_path, module = make_project(tmp_path, selected_asset=True)
    config = load_config(config_path)
    output = write_export(root, config, paper, with_asset=False)
    (paper / "assets/figures/web/F01.png").parent.mkdir(parents=True, exist_ok=True)
    (paper / "assets/figures/web/F01.png").write_bytes(b"web-derivative")
    (paper / "web/enhanced/public/images/F01.png").parent.mkdir(parents=True, exist_ok=True)
    (paper / "web/enhanced/public/images/F01.png").write_bytes(b"web-asset")
    (paper / "web/enhanced/README.md").write_text("## Asset provenance\n", encoding="utf-8")
    write_upstream_report(paper, config)

    problems = module.v3_stage_completion_problems(paper, "W10", config)
    assert any("export is missing selected asset" in problem for problem in problems)

    (output / "README.md").write_text("Project overview only.\n", encoding="utf-8")
    (output / "public/images").mkdir(parents=True, exist_ok=True)
    (output / "public/images/F01.png").write_bytes(b"exported-figure")
    problems = module.v3_stage_completion_problems(paper, "W10", config)
    assert any("export README.md must document asset provenance" in problem for problem in problems)

    (output / "README.md").write_text("## Asset provenance\n", encoding="utf-8")
    write_upstream_report(paper, config)
    assert module.v3_stage_completion_problems(paper, "W10", config) == []
