import json
import subprocess
from pathlib import Path

from workflow_helpers import load_config, make_project, write_export, write_upstream_report


def make_clean_upstream_repo(path):
    path.mkdir()
    subprocess.run(["git", "init", "-q", str(path)], check=True)
    subprocess.run(["git", "-C", str(path), "config", "user.name", "Test User"], check=True)
    subprocess.run(["git", "-C", str(path), "config", "user.email", "test@example.org"], check=True)
    (path / "package.json").write_text(json.dumps({"scripts": {"import": "node noop.js", "validate": "node noop.js", "build:paper": "node noop.js", "preflight": "node noop.js"}}), encoding="utf-8")
    (path / "noop.js").write_text("process.exit(0);\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(path), "add", "package.json", "noop.js"], check=True)
    subprocess.run(["git", "-C", str(path), "commit", "-q", "-m", "test upstream"], check=True)
    return path


def make_imported_export(cwd, name="sample_paper_name", version="ada0926"):
    output = cwd / "html_output" / name / version
    files = (
        "README.md", "package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json",
        "src/App.tsx", "src/data/tutorial.ts", "src/modules/registry.tsx", "src/styles/paper.css",
    )
    for relative in files:
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("## Asset provenance\n" if relative == "README.md" else "{}\n", encoding="utf-8")
    (output / "paper.json").write_text(json.dumps({"paperName": name, "version": version}), encoding="utf-8")
    (output / "package.json").write_text("{}\n", encoding="utf-8")


def test_w10_requires_machine_report_and_rejects_a_failed_upstream_command(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    write_export(root, config, paper)
    problems = module.v3_stage_completion_problems(paper, "W10", config)
    assert any("audit/upstream-preflight.json is missing" in problem for problem in problems)

    write_upstream_report(paper, config, exit_code=1)
    problems = module.v3_stage_completion_problems(paper, "W10", config)
    assert any("status must be PASS" in problem for problem in problems)
    assert any("failed with exit code 1" in problem for problem in problems)


def test_upstream_check_runs_in_temporary_checkout_and_writes_pass_report(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    config_path.write_text(module.yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")
    upstream = make_clean_upstream_repo(tmp_path / "PaperSkill")
    called = []
    npm_order = []
    preflight_heads = []

    def runner(command, **kwargs):
        called.append((command, Path(kwargs["cwd"])))
        if command[0] == "git":
            result = subprocess.run(command, **kwargs)
            if "commit" in command:
                npm_order.append("git commit")
            return result
        npm_order.append("npm run {}".format(command[2]))
        if command[2] == "preflight":
            head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=kwargs["cwd"], capture_output=True, text=True, check=True)
            preflight_heads.append(head.stdout.strip())
        if command[2] == "import":
            make_imported_export(Path(kwargs["cwd"]))
        return subprocess.CompletedProcess(command, 0, stdout="passed\n", stderr="")

    result = module.run_upstream_check(paper, config, upstream, "Ada Author", process_runner=runner)
    assert result == 0
    assert all(cwd != upstream for command, cwd in called if command[0].startswith("npm"))
    assert (root / config["release"]["output"] / "paper.json").is_file()
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert report["status"] == "PASS"
    assert len(report["upstream_commit"]) == 40
    assert len(report["temporary_commit"]) == 40
    assert report["temporary_commit"] != report["upstream_commit"]
    assert report["changed_paths"]
    assert all(path.startswith("html_output/sample_paper_name/ada0926/") for path in report["changed_paths"])
    assert report["unexpected_paths"] == []
    assert len(report["export_sha256"]) == 64
    assert npm_order == ["npm run import", "git commit", "npm run validate", "npm run build:paper", "npm run preflight"]
    assert preflight_heads == [report["temporary_commit"]]
    assert [item["command"] for item in report["commands"]] == [
        "npm run import", "npm run validate", "npm run build:paper", "npm run preflight",
    ]
    assert module.v3_stage_completion_problems(paper, "W10", config) == []
    status = subprocess.run(["git", "-C", str(upstream), "status", "--porcelain"], capture_output=True, text=True, check=True)
    assert status.stdout == ""
    identity = subprocess.run(["git", "-C", str(upstream), "config", "user.name"], capture_output=True, text=True, check=True)
    assert identity.stdout.strip() == "Test User"


def test_upstream_check_rejects_import_changes_outside_tutorial_scope(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    config_path.write_text(module.yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")
    upstream = make_clean_upstream_repo(tmp_path / "PaperSkill")
    npm_commands = []

    def runner(command, **kwargs):
        if command[0] == "git":
            return subprocess.run(command, **kwargs)
        npm_commands.append(command[2])
        if command[2] == "import":
            cwd = Path(kwargs["cwd"])
            make_imported_export(cwd)
            unexpected = cwd / "catalog/papers.json"
            unexpected.parent.mkdir(parents=True, exist_ok=True)
            unexpected.write_text("{}\n", encoding="utf-8")
        return subprocess.CompletedProcess(command, 0, stdout="passed\n", stderr="")

    result = module.run_upstream_check(paper, config, upstream, "Ada Author", process_runner=runner)
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert result == 1
    assert npm_commands == ["import"]
    assert "catalog/papers.json" in report["changed_paths"]
    assert report["unexpected_paths"] == ["catalog/papers.json"]
    assert report["temporary_commit"] == ""
    assert not (root / config["release"]["output"]).exists()
    status = subprocess.run(["git", "-C", str(upstream), "status", "--porcelain"], capture_output=True, text=True, check=True)
    assert status.stdout == ""


def test_w10_requires_commit_scope_and_matching_export_hash(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    write_export(root, config, paper)

    report = write_upstream_report(paper, config)
    report.pop("temporary_commit")
    (paper / "audit/upstream-preflight.json").write_text(json.dumps(report), encoding="utf-8")
    problems = module.v3_stage_completion_problems(paper, "W10", config)
    assert any("temporary tutorial commit SHA" in problem for problem in problems)

    report = write_upstream_report(paper, config)
    report["changed_paths"].append("catalog/papers.json")
    (paper / "audit/upstream-preflight.json").write_text(json.dumps(report), encoding="utf-8")
    problems = module.v3_stage_completion_problems(paper, "W10", config)
    assert any("changed_paths must stay within release.output" in problem for problem in problems)

    write_upstream_report(paper, config)
    (root / config["release"]["output"] / "README.md").write_text("Modified after preflight\n", encoding="utf-8")
    problems = module.v3_stage_completion_problems(paper, "W10", config)
    assert any("SHA-256 does not match" in problem for problem in problems)


def test_upstream_check_command_failure_is_reported_and_does_not_copy_export(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    config_path.write_text(module.yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")
    upstream = make_clean_upstream_repo(tmp_path / "PaperSkill")

    def runner(command, **kwargs):
        if command[0] == "git":
            return subprocess.run(command, **kwargs)
        if command[2] == "import":
            make_imported_export(Path(kwargs["cwd"]))
        exit_code = 1 if command[2] == "preflight" else 0
        return subprocess.CompletedProcess(command, exit_code, stdout="mock result\n", stderr="")

    result = module.run_upstream_check(paper, config, upstream, "Ada Author", process_runner=runner)
    assert result == 1
    assert not (root / config["release"]["output"]).exists()
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert report["status"] == "FAIL"
    assert report["commands"][-1]["exit_code"] == 1
    problems = module.upstream_preflight_problems(paper, config)
    assert any("status must be PASS" in problem for problem in problems)
    assert any("failed with exit code 1" in problem for problem in problems)
