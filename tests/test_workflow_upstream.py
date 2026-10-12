import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace

import pytest

from workflow_helpers import (
    load_config, make_project, mark_prior_stages_complete, save_config,
    write_export, write_upstream_report,
)


CANONICAL_PAPERSKILL_URL = "https://github.com/ReductTech/PaperSkill.git"


def make_clean_upstream_repo(path):
    path.mkdir()
    subprocess.run(["git", "init", "-q", "-b", "main", str(path)], check=True)
    subprocess.run(["git", "-C", str(path), "config", "user.name", "Test User"], check=True)
    subprocess.run(["git", "-C", str(path), "config", "user.email", "test@example.org"], check=True)
    subprocess.run(["git", "-C", str(path), "config", "uploadpack.allowFilter", "true"], check=True)
    (path / ".gitignore").write_text(
        "**/node_modules/\n**/dist/\n**/dist-ssr/\n**/.vite/\n**/*.tsbuildinfo\n",
        encoding="utf-8",
    )
    (path / "package.json").write_text(json.dumps({"scripts": {"import": "node noop.js", "validate": "node noop.js", "build:paper": "node noop.js", "preflight": "node noop.js"}}), encoding="utf-8")
    (path / "noop.js").write_text("process.exit(0);\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(path), "add", ".gitignore", "package.json", "noop.js"], check=True)
    subprocess.run(["git", "-C", str(path), "commit", "-q", "-m", "test upstream"], check=True)
    subprocess.run(["git", "-C", str(path), "remote", "add", "upstream", CANONICAL_PAPERSKILL_URL], check=True)
    subprocess.run(["git", "-C", str(path), "remote", "add", "origin", "https://github.com/LIZZYGREAT/PaperSkill.git"], check=True)
    return path


def run_git_with_local_canonical_remote(command, kwargs, canonical_source):
    local_command = list(command)
    if local_command[0] == "git" and "clone" in local_command:
        local_command[local_command.index(CANONICAL_PAPERSKILL_URL)] = canonical_source.resolve().as_uri()
    return subprocess.run(local_command, **kwargs)


def make_shallow_sparse_sibling(path, canonical_source):
    remote_url = canonical_source.resolve().as_uri()
    subprocess.run([
        "git", "clone", "--filter=blob:none", "--depth=1", "--sparse", remote_url, str(path),
    ], check=True, capture_output=True, text=True)
    subprocess.run(["git", "-C", str(path), "remote", "rename", "origin", "upstream"], check=True)
    subprocess.run(["git", "-C", str(path), "config", "user.name", "Test User"], check=True)
    subprocess.run(["git", "-C", str(path), "config", "user.email", "test@example.org"], check=True)
    subprocess.run([
        "git", "-C", str(path), "sparse-checkout", "set", "--cone", "--skip-checks",
        "paper-skill", "scripts", ".github", "docs",
    ], check=True)
    subprocess.run(["git", "-C", str(path), "remote", "set-url", "upstream", CANONICAL_PAPERSKILL_URL], check=True)
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
    asset = output / "public/images/figure-1.png"
    asset.parent.mkdir(parents=True, exist_ok=True)
    asset.write_bytes(b"tutorial-figure")


def make_fake_upstream_runner(sibling, fail_command=None, generate_build_artifacts=False):
    state = {
        "temp_repo": None,
        "imported": None,
        "changed_paths": [],
        "committed": False,
        "clean_snapshot_before_build": None,
    }
    upstream_commit = "a" * 40
    temporary_commit = "b" * 40

    def result(command, exit_code=0, stdout="", stderr=""):
        return subprocess.CompletedProcess(command, exit_code, stdout=stdout, stderr=stderr)

    def status_text(paths):
        return "".join("?? {}\0".format(path) for path in paths)

    def runner(command, **kwargs):
        assert kwargs["encoding"] == "utf-8"
        assert kwargs["errors"] == "replace"
        if command[0] == "git":
            if "clone" in command:
                state["temp_repo"] = Path(command[-1])
                state["temp_repo"].mkdir(parents=True)
                return result(command)

            arguments = command[command.index("-C") + 2:]
            cwd = Path(kwargs["cwd"])
            if cwd == sibling:
                if arguments[0] == "status":
                    return result(command)
                if arguments[:2] == ["rev-parse", "HEAD"]:
                    return result(command, stdout=upstream_commit + "\n")
                if arguments[0] == "remote" and len(arguments) == 1:
                    return result(command, stdout="upstream\norigin\n")
                if arguments[:2] == ["remote", "get-url"]:
                    remote_url = CANONICAL_PAPERSKILL_URL if arguments[2] == "upstream" else "https://github.com/LIZZYGREAT/PaperSkill.git"
                    return result(command, stdout=remote_url + "\n")
                if arguments[0:2] == ["rev-parse", "--is-shallow-repository"]:
                    return result(command, stdout="true\n")
                if arguments[:2] == ["config", "--get"]:
                    return result(command, stdout="blob:none\n")
                if arguments[0:2] == ["sparse-checkout", "list"]:
                    return result(command, stdout="paper-skill\nscripts\n.github\ndocs\n")
                return result(command)

            if cwd == state["temp_repo"]:
                if arguments[0] == "status":
                    paths = [] if state["committed"] else state["changed_paths"]
                    return result(command, stdout=status_text(paths))
                if arguments[:2] == ["rev-parse", "HEAD"]:
                    commit = temporary_commit if state["committed"] else upstream_commit
                    return result(command, stdout=commit + "\n")
                if arguments[:2] == ["rev-parse", "refs/remotes/origin/main"]:
                    return result(command, stdout=upstream_commit + "\n")
                if arguments[0] == "add":
                    return result(command)
                if arguments[0] == "commit":
                    state["committed"] = True
                    return result(command)
                return result(command)
            raise AssertionError("unexpected Git working directory: {}".format(cwd))

        stage = command[2]
        if stage == "import":
            name = command[5]
            version = command[command.index("--version") + 1]
            make_imported_export(Path(kwargs["cwd"]), name=name, version=version)
            state["imported"] = state["temp_repo"] / "html_output" / name / version
            state["changed_paths"] = sorted(
                path.relative_to(state["temp_repo"]).as_posix()
                for path in state["imported"].rglob("*")
                if path.is_file()
            )
        elif stage == "build:paper":
            imported = state["imported"]
            clean_export = state["temp_repo"].parent / "clean-export"
            state["clean_snapshot_before_build"] = (
                clean_export.is_dir()
                and all(not (clean_export / path).exists() for path in (
                    "node_modules", "dist", ".vite", "tsconfig.app.tsbuildinfo",
                ))
            )
            if generate_build_artifacts:
                generated = {
                    "node_modules/vite/index.html": "<script src='/runtime.js'></script>\n",
                    "dist/index.html": "generated build\n",
                    ".vite/deps/dep.js": "generated cache\n",
                    "tsconfig.app.tsbuildinfo": "temporary compiler state\n",
                }
                for relative, contents in generated.items():
                    target = imported / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_text(contents, encoding="utf-8")

        if stage == fail_command:
            return result(command, exit_code=1, stdout="simulated {} failure\n".format(stage))
        return result(command, stdout="passed\n")

    return runner, state


def add_existing_release(canonical, paper_name, version):
    output = canonical / "html_output" / paper_name / version
    output.mkdir(parents=True)
    (output / "README.md").write_text("Existing release\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(canonical), "add", "--", "html_output"], check=True)
    subprocess.run([
        "git", "-C", str(canonical), "commit", "-q", "-m", "reserve {}/{}".format(paper_name, version),
    ], check=True)


def refresh_sibling(sibling, canonical):
    subprocess.run([
        "git", "-C", str(sibling), "remote", "set-url", "upstream", canonical.resolve().as_uri(),
    ], check=True)
    subprocess.run(["git", "-C", str(sibling), "fetch", "upstream", "main", "--depth=1"], check=True)
    subprocess.run(["git", "-C", str(sibling), "switch", "--detach", "upstream/main"], check=True)
    subprocess.run([
        "git", "-C", str(sibling), "remote", "set-url", "upstream", CANONICAL_PAPERSKILL_URL,
    ], check=True)


def upstream_check_args(repo, paper_id="demo-paper"):
    return argparse.Namespace(
        paper_id=paper_id,
        participant=None,
        pinyin=None,
        github=None,
        paperskill_repo=str(repo),
        replace_output=False,
    )


@pytest.mark.parametrize("remote_url", [
    "https://github.com/ReductTech/PaperSkill.git",
    "git@github.com:ReductTech/PaperSkill.git",
    "ssh://git@ssh.github.com:443/ReductTech/PaperSkill.git",
])
def test_canonical_paperskill_remote_supports_https_and_ssh_urls(tmp_path, remote_url):
    _root, _paper, _config_path, module = make_project(tmp_path)

    assert module.is_canonical_paperskill_remote(remote_url)
    assert not module.is_canonical_paperskill_remote("https://github.com/LIZZYGREAT/PaperSkill.git")


def test_contributor_profile_uses_global_git_defaults_with_per_run_overrides(tmp_path, monkeypatch):
    _root, _paper, _config_path, module = make_project(tmp_path)
    global_config = tmp_path / "global.gitconfig"
    global_config.write_text(
        '[paperskillwork]\n\tparticipant = Ada Researcher\n\tpinyin = adaresearcher\n\tgithub = ada-r\n',
        encoding="utf-8",
    )
    monkeypatch.setenv("GIT_CONFIG_GLOBAL", str(global_config))

    assert module.resolve_contributor_profile() == ("Ada Researcher", "adaresearcher", "ada-r")
    assert module.resolve_contributor_profile("Temporary Name", None, "temp-user") == (
        "Temporary Name", "adaresearcher", "temp-user",
    )


def test_contributor_profile_reports_one_time_setup_when_display_name_is_missing(tmp_path, monkeypatch):
    _root, _paper, _config_path, module = make_project(tmp_path)
    monkeypatch.setenv("GIT_CONFIG_GLOBAL", str(tmp_path / "empty.gitconfig"))

    with pytest.raises(module.PaperError, match="git config --global paperskillwork.participant"):
        module.resolve_contributor_profile()


def test_release_identifiers_are_derived_and_version_uses_official_suffix_rule(tmp_path):
    _root, _paper, _config_path, module = make_project(tmp_path)
    config = load_config(_config_path)
    config["title"] = "Learning Without Forgetting"
    automatic, stamp = module.prepare_release_identifiers(
        config, "王丹", "Wang Dan", "wangd", module.datetime(2026, 10, 12),
    )

    assert automatic is True
    assert stamp == "1012"
    assert config["release"] == {
        "upstream_paper_name": "learning_without_forgetting",
        "upstream_version": "wangdan1012",
        "output": "html_output/learning_without_forgetting/wangdan1012",
    }
    assert module.validate_config(config, "demo-paper") == []


def test_available_upstream_version_uses_next_open_suffix(tmp_path):
    _root, _paper, _config_path, module = make_project(tmp_path)
    paper_output = tmp_path / "PaperSkill/html_output/demo_paper"
    (paper_output / "ada1012").mkdir(parents=True)
    (paper_output / "ada1012_2").mkdir()

    assert module.available_upstream_version(tmp_path / "PaperSkill", "demo_paper", "ada1012") == "ada1012_3"


def test_upstream_source_prefers_configured_final_directory(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    final = paper / "web/final"
    final.mkdir()
    config = {"web": {"enhanced": "web/enhanced", "final": "web/final"}}

    assert module.resolve_upstream_source(paper, config) == final


def test_upstream_source_falls_back_to_enhanced_when_final_is_not_configured(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    config = {"web": {"enhanced": "web/enhanced"}}

    assert module.resolve_upstream_source(paper, config) == paper / "web/enhanced"


def test_upstream_source_reports_missing_configured_final_without_fallback(tmp_path):
    _root, paper, _config_path, module = make_project(tmp_path)
    config = {"web": {"enhanced": "web/enhanced", "final": "web/final"}}

    with pytest.raises(module.PaperError, match="configured web.final source is missing: web/final"):
        module.resolve_upstream_source(paper, config)


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


def test_w10_allows_root_relative_vite_module_entry(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    export = write_export(root, config, paper)
    (export / "index.html").write_text(
        '<script type="module" src="/src/main.tsx"></script>\n',
        encoding="utf-8",
    )
    write_upstream_report(paper, config)

    assert module.v3_stage_completion_problems(paper, "W10", config) == []


def test_upstream_check_runs_in_temporary_checkout_and_writes_pass_report(tmp_path, capsys, monkeypatch):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    final = paper / "web/final"
    final.mkdir()
    (final / "source-choice.txt").write_text("final source\n", encoding="utf-8")
    (paper / "web/enhanced/source-choice.txt").write_text("enhanced source\n", encoding="utf-8")
    config["web"]["final"] = "web/final"
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    config_path.write_text(module.yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")
    canonical = make_clean_upstream_repo(tmp_path / "canonical")
    sparse_fixture_files = {
        "paper-skill/README.md": "PaperSkill source\n",
        "scripts/validate.js": "process.exit(0);\n",
        ".github/workflows/ci.yml": "name: test\n",
        "docs/upstream.md": "Upstream docs\n",
        "html_output/sample_paper_name/README.md": "Existing paper directory\n",
        "html_output/unrelated_paper/README.md": "Keep this sparse\n",
    }
    for relative, contents in sparse_fixture_files.items():
        target = canonical / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(contents, encoding="utf-8")
    subprocess.run(["git", "-C", str(canonical), "add", "-A"], check=True)
    subprocess.run(["git", "-C", str(canonical), "commit", "-q", "-m", "add sparse checkout fixtures"], check=True)
    upstream = make_shallow_sparse_sibling(tmp_path / "PaperSkill", canonical)
    called = []
    npm_order = []
    preflight_heads = []
    clone_snapshots = []
    sparse_snapshots = []
    branch_snapshots = []
    build_snapshot_states = []

    def git_output(repo, *arguments):
        result = subprocess.run(
            ["git", "-C", str(repo)] + list(arguments), capture_output=True, text=True, check=True,
        )
        return result.stdout.strip()

    def visible_files(repo):
        return {
            path.relative_to(repo).as_posix()
            for path in repo.rglob("*")
            if path.is_file() and ".git" not in path.relative_to(repo).parts
        }

    def runner(command, **kwargs):
        assert kwargs["encoding"] == "utf-8"
        assert kwargs["errors"] == "replace"
        called.append((command, Path(kwargs["cwd"]), dict(kwargs)))
        if command[0] == "git":
            result = run_git_with_local_canonical_remote(command, kwargs, canonical)
            if result.returncode == 0 and "clone" in command:
                cloned_repo = Path(command[-1])
                clone_snapshots.append((
                    git_output(cloned_repo, "rev-parse", "HEAD"),
                    git_output(cloned_repo, "rev-parse", "refs/remotes/origin/main"),
                    visible_files(cloned_repo),
                ))
            elif result.returncode == 0 and "sparse-checkout" in command and "set" in command:
                repo = Path(kwargs["cwd"])
                sparse_snapshots.append(visible_files(repo))
            elif result.returncode == 0 and "switch" in command and "-c" in command:
                repo = Path(kwargs["cwd"])
                branch_snapshots.append((
                    git_output(repo, "branch", "--show-current"),
                    git_output(repo, "rev-parse", "HEAD"),
                ))
            if "commit" in command:
                npm_order.append("git commit")
            return result
        npm_order.append("npm run {}".format(command[2]))
        if command[2] == "preflight":
            head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=kwargs["cwd"], capture_output=True, text=True, check=True)
            preflight_heads.append(head.stdout.strip())
        if command[2] == "import":
            source = Path(kwargs["cwd"]) / command[4]
            assert (source / "source-choice.txt").read_text(encoding="utf-8") == "final source\n"
            make_imported_export(Path(kwargs["cwd"]))
        if command[2] == "build:paper":
            imported = Path(kwargs["cwd"]) / config["release"]["output"]
            clean_export = Path(kwargs["cwd"]).parent / "clean-export"
            build_snapshot_states.append((
                clean_export.is_dir(),
                all(not (clean_export / path).exists() for path in (
                    "node_modules", "dist", ".vite", "tsconfig.app.tsbuildinfo",
                )),
            ))
            generated = {
                "node_modules/vite/index.html": "<script src='/runtime.js'></script>\n",
                "dist/index.html": "generated build\n",
                ".vite/deps/dep.js": "generated cache\n",
                "tsconfig.app.tsbuildinfo": "temporary compiler state\n",
            }
            for relative, contents in generated.items():
                target = imported / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(contents, encoding="utf-8")
        return subprocess.CompletedProcess(command, 0, stdout="passed\n", stderr="")

    monkeypatch.setattr(module, "subprocess", SimpleNamespace(PIPE=subprocess.PIPE, run=runner))
    result = module.run_upstream_check(paper, config, upstream, "Ada Author")
    assert result == 0
    output = capsys.readouterr().out
    expected_progress = [
        "[W10] Checking upstream HEAD and checkout state...",
        "[W10] Checking local release inputs...",
        "[W10] Connecting to official PaperSkill main (partial clone)...",
        "[W10] PASS Connecting to official PaperSkill main (partial clone)",
        "[W10] Expanding sparse paths for this release...",
        "[W10] PASS Expanding sparse paths for this release",
        "[W10] Preparing temporary contribution branch...",
        "[W10] PASS Preparing temporary contribution branch",
        "[W10] Preparing release source snapshot...",
        "[W10] PASS Preparing release source snapshot",
        "[W10] Official Import...",
        "[W10] Official Validate...",
        "[W10] Official Build:paper...",
        "[W10] Official Preflight...",
        "[W10] Writing verified export and preflight report...",
        "[W10] PASS Writing verified export and preflight report",
    ]
    positions = [output.index(progress) for progress in expected_progress]
    assert positions == sorted(positions)
    assert all(cwd != upstream for command, cwd, _kwargs in called if command[0].startswith("npm"))
    assert (root / config["release"]["output"] / "paper.json").is_file()
    export = root / config["release"]["output"]
    assert build_snapshot_states == [(True, True)]
    assert (export / "paper.json").is_file()
    assert (export / "src/App.tsx").is_file()
    assert (export / "public/images/figure-1.png").read_bytes() == b"tutorial-figure"
    assert all(not (export / path).exists() for path in (
        "node_modules", "dist", ".vite", "tsconfig.app.tsbuildinfo",
    ))
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert report["status"] == "PASS"
    assert len(report["upstream_commit"]) == 40
    assert len(report["temporary_commit"]) == 40
    assert report["temporary_commit"] != report["upstream_commit"]
    assert report["upstream_remote"] == "upstream"
    assert report["upstream_remote_url"] == CANONICAL_PAPERSKILL_URL
    assert report["sibling_baseline"]["is_shallow"] is True
    assert report["sibling_baseline"]["partial_clone_filter"] == "blob:none"
    assert "scripts" in report["sibling_baseline"]["sparse_checkout"]
    clone_call = next(command for command, _cwd, _kwargs in called if command[0] == "git" and "clone" in command)
    assert "--filter=blob:none" in clone_call
    assert "--sparse" in clone_call
    assert "--depth=1" in clone_call
    assert "--no-tags" in clone_call
    assert "--progress" in clone_call
    assert "--no-checkout" not in clone_call
    assert "--shared" not in clone_call
    assert "--reference-if-able" not in clone_call
    assert len(clone_snapshots) == 1
    clone_head, clone_origin_main, initial_files = clone_snapshots[0]
    assert clone_head == clone_origin_main == report["upstream_commit"]
    assert initial_files == {"noop.js", "package.json"}
    sparse_paths_call = next(command for command, _cwd, _kwargs in called if "sparse-checkout" in command and "set" in command)
    assert sum(1 for command, _cwd, _kwargs in called if "sparse-checkout" in command and "set" in command) == 1
    assert not any("sparse-checkout" in command and "init" in command for command, _cwd, _kwargs in called)
    assert "--skip-checks" in sparse_paths_call
    assert "html_output/sample_paper_name" in sparse_paths_call
    assert len(sparse_snapshots) == 1
    assert sparse_snapshots[0] == {
        "noop.js", "package.json", "paper-skill/README.md", "scripts/validate.js",
        ".github/workflows/ci.yml", "docs/upstream.md", "html_output/sample_paper_name/README.md",
    }
    branch_call = next(
        command for command, _cwd, _kwargs in called
        if "switch" in command and "-c" in command
    )
    assert branch_call[branch_call.index("switch") + 1:] == ["-c", "paperskillwork-preflight"]
    assert not any(command[0] == "git" and "checkout" in command for command, _cwd, _kwargs in called)
    assert branch_snapshots == [("paperskillwork-preflight", report["upstream_commit"])]
    ordered_calls = [
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if "clone" in command),
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if "sparse-checkout" in command and "set" in command),
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if "switch" in command and "-c" in command),
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if command[0] != "git" and command[2] == "import"),
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if "commit" in command),
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if command[0] != "git" and command[2] == "validate"),
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if command[0] != "git" and command[2] == "build:paper"),
        next(index for index, (command, _cwd, _kwargs) in enumerate(called) if command[0] != "git" and command[2] == "preflight"),
    ]
    assert ordered_calls == sorted(ordered_calls)
    assert report["changed_paths"]
    assert all(path.startswith("html_output/sample_paper_name/ada0926/") for path in report["changed_paths"])
    assert report["unexpected_paths"] == []
    assert len(report["export_sha256"]) == 64
    assert report["export_sha256"] == module.directory_sha256(export)
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


def test_upstream_check_decodes_utf8_and_replaces_invalid_bytes_without_hiding_failure(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    save_config(config_path, config)
    upstream = make_clean_upstream_repo(tmp_path / "PaperSkill")
    output_script = "import sys; sys.stdout.buffer.write('\\u5b8b\\u4f20\\u4e2d\\u6587'.encode('utf-8')); sys.stderr.buffer.write(b'\\xff')"

    def runner(command, **kwargs):
        assert kwargs["encoding"] == "utf-8"
        assert kwargs["errors"] == "replace"
        if command[0] == "git" and "clone" in command:
            decoded = subprocess.run([sys.executable, "-c", output_script], **kwargs)
            return subprocess.CompletedProcess(command, 9, stdout=decoded.stdout, stderr=decoded.stderr)
        if command[0] == "git":
            return run_git_with_local_canonical_remote(command, kwargs, upstream)
        raise AssertionError("official command should not run after the simulated clone failure")

    result = module.run_upstream_check(paper, config, upstream, "Ada Author", process_runner=runner)

    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert result == 1
    assert report["status"] == "FAIL"
    assert "\u5b8b\u4f20\u4e2d\u6587" in report["error"]
    assert "�" in report["error"]
    assert not (root / config["release"]["output"]).exists()


def test_upstream_check_publishes_clean_import_snapshot_after_build_pollutes_worktree(tmp_path):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    upstream = tmp_path / "PaperSkill"
    upstream.mkdir()
    (upstream / ".git").mkdir()
    runner, state = make_fake_upstream_runner(
        upstream, generate_build_artifacts=True,
    )

    result = module.run_upstream_check(paper, config, upstream, "Ada Author", process_runner=runner)

    export = root / config["release"]["output"]
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert result == 0
    assert report["status"] == "PASS"
    assert state["clean_snapshot_before_build"] is True
    assert (export / "paper.json").is_file()
    assert (export / "src/App.tsx").is_file()
    assert (export / "public/images/figure-1.png").read_bytes() == b"tutorial-figure"
    assert all(not (export / path).exists() for path in (
        "node_modules", "dist", ".vite", "tsconfig.app.tsbuildinfo",
    ))
    assert not any("/node_modules/" in path or "/dist/" in path for path in report["changed_paths"])
    assert report["export_sha256"] == module.directory_sha256(export)


@pytest.mark.parametrize("fail_command", ["validate", "build:paper", "preflight"])
def test_upstream_check_does_not_publish_snapshot_or_lock_version_before_success(
    tmp_path, monkeypatch, fail_command,
):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    mark_prior_stages_complete(config, "W10")
    save_config(config_path, config)
    upstream = tmp_path / "PaperSkill"
    upstream.mkdir()
    (upstream / ".git").mkdir()
    runner, _state = make_fake_upstream_runner(
        upstream, fail_command=fail_command, generate_build_artifacts=True,
    )
    monkeypatch.setattr(module, "resolve_contributor_profile", lambda *_args: ("Ada Researcher", "ada", ""))
    actual_run = module.run_upstream_check

    def run_with_fake_processes(*args, **kwargs):
        return actual_run(*args, process_runner=runner, **kwargs)

    monkeypatch.setattr(module, "run_upstream_check", run_with_fake_processes)

    assert module.cmd_upstream_check(upstream_check_args(upstream)) == 1

    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert report["status"] == "FAIL"
    assert report["commands"][-1]["command"] == "npm run {}".format(fail_command)
    assert report["commands"][-1]["exit_code"] == 1
    assert not (root / "html_output" / report["paper_name"] / report["version"]).exists()
    assert load_config(config_path)["release"] == {
        "upstream_paper_name": "", "upstream_version": "", "output": "",
    }


def test_upstream_check_records_temporary_branch_failure(tmp_path, capsys):
    _root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    config_path.write_text(module.yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")
    canonical = make_clean_upstream_repo(tmp_path / "canonical")
    sibling = make_shallow_sparse_sibling(tmp_path / "PaperSkill", canonical)
    official_commands = []

    def runner(command, **kwargs):
        if command[0] == "git" and "switch" in command and "-c" in command:
            return subprocess.CompletedProcess(command, 1, stdout="", stderr="branch creation failed")
        if command[0] == "git":
            return run_git_with_local_canonical_remote(command, kwargs, canonical)
        official_commands.append(command)
        return subprocess.CompletedProcess(command, 0, stdout="unexpected\n", stderr="")

    result = module.run_upstream_check(paper, config, sibling, "Ada Author", process_runner=runner)
    output = capsys.readouterr().out
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))

    assert result == 1
    assert "[W10] FAIL Preparing temporary contribution branch" in output
    assert report["status"] == "FAIL"
    assert "Preparing temporary contribution branch" in report["error"]
    assert "branch creation failed" in report["error"]
    assert official_commands == []
    assert report["commands"] == []


def test_automatic_release_version_is_persisted_only_after_success_and_retry_uses_open_suffixes(tmp_path, monkeypatch):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    mark_prior_stages_complete(config, "W10")
    save_config(config_path, config)

    paper_name = "a_sample_paper"
    base_version = "ada1012"
    canonical = make_clean_upstream_repo(tmp_path / "canonical")
    add_existing_release(canonical, paper_name, base_version)
    sibling = make_shallow_sparse_sibling(tmp_path / "PaperSkill", canonical)

    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            return cls(2026, 10, 12, tzinfo=tz)

    monkeypatch.setattr(module, "datetime", FixedDateTime)
    monkeypatch.setattr(module, "resolve_contributor_profile", lambda *_args: ("Ada Researcher", "ada", ""))
    actual_run = module.run_upstream_check
    preflight_calls = []

    def process_runner(command, **kwargs):
        if command[0] == "git":
            return run_git_with_local_canonical_remote(command, kwargs, canonical)
        if command[2] == "import":
            version = command[command.index("--version") + 1]
            make_imported_export(Path(kwargs["cwd"]), name=command[5], version=version)
        if command[2] == "preflight":
            preflight_calls.append(command)
            if len(preflight_calls) == 1:
                return subprocess.CompletedProcess(command, 1, stdout="", stderr="temporary failure")
        return subprocess.CompletedProcess(command, 0, stdout="passed\n", stderr="")

    attempts = []

    def run_with_fake_processes(*args, **kwargs):
        assert kwargs["auto_version"] is True
        result = actual_run(*args, process_runner=process_runner, **kwargs)
        attempts.append(args[1]["release"]["upstream_version"])
        return result

    monkeypatch.setattr(module, "run_upstream_check", run_with_fake_processes)
    args = upstream_check_args(sibling)

    assert module.cmd_upstream_check(args) == 1
    assert load_config(config_path)["release"] == {
        "upstream_paper_name": "", "upstream_version": "", "output": "",
    }
    assert attempts == ["ada1012_2"]
    assert not (root / "html_output" / paper_name / "ada1012_2").exists()

    add_existing_release(canonical, paper_name, "ada1012_2")
    refresh_sibling(sibling, canonical)
    assert module.cmd_upstream_check(args) == 0

    assert attempts == ["ada1012_2", "ada1012_3"]
    assert load_config(config_path)["release"] == {
        "upstream_paper_name": paper_name,
        "upstream_version": "ada1012_3",
        "output": "html_output/{}/ada1012_3".format(paper_name),
    }
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert report["status"] == "PASS"
    assert report["version"] == "ada1012_3"
    assert (root / "html_output" / paper_name / "ada1012_3" / "paper.json").is_file()


def test_explicit_release_failure_preserves_version_config_and_existing_export(tmp_path, monkeypatch):
    root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    release = {
        "upstream_paper_name": "a_sample_paper",
        "upstream_version": "ada1012",
        "output": "html_output/a_sample_paper/ada1012",
    }
    config["release"] = dict(release)
    mark_prior_stages_complete(config, "W10")
    save_config(config_path, config)

    canonical = make_clean_upstream_repo(tmp_path / "canonical")
    add_existing_release(canonical, release["upstream_paper_name"], release["upstream_version"])
    sibling = make_shallow_sparse_sibling(tmp_path / "PaperSkill", canonical)

    existing_export = root / release["output"]
    existing_export.mkdir(parents=True)
    sentinel = existing_export / "validated-export.txt"
    sentinel.write_text("keep this verified export\n", encoding="utf-8")
    monkeypatch.setattr(module, "resolve_contributor_profile", lambda *_args: ("Ada Researcher", "ada", ""))
    actual_run = module.run_upstream_check
    npm_commands = []

    def process_runner(command, **kwargs):
        if command[0] == "git":
            return run_git_with_local_canonical_remote(command, kwargs, canonical)
        npm_commands.append(command)
        return subprocess.CompletedProcess(command, 0, stdout="passed\n", stderr="")

    def run_with_fake_processes(*args, **kwargs):
        assert kwargs["auto_version"] is False
        return actual_run(*args, process_runner=process_runner, **kwargs)

    monkeypatch.setattr(module, "run_upstream_check", run_with_fake_processes)
    assert module.cmd_upstream_check(upstream_check_args(sibling)) == 1

    assert load_config(config_path)["release"] == release
    assert sentinel.read_text(encoding="utf-8") == "keep this verified export\n"
    assert npm_commands == []
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert report["status"] == "FAIL"
    assert "version already exists" in report["error"]



def test_upstream_check_does_not_report_embedded_remote_credentials(tmp_path, capsys):
    _root, paper, _config_path, module = make_project(tmp_path)
    upstream = make_clean_upstream_repo(tmp_path / "PaperSkill")
    secret_remote = "https://private-token@github.com/ReductTech/PaperSkill.git"
    subprocess.run([
        "git", "-C", str(upstream), "remote", "set-url", "upstream", secret_remote,
    ], check=True)

    result = module.run_upstream_check(paper, load_config(_config_path), upstream, "Ada Author")
    output = capsys.readouterr().out
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))

    assert result == 1
    assert "must not embed credentials" in report["error"]
    assert "private-token" not in output
    assert "private-token" not in json.dumps(report)

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
            return run_git_with_local_canonical_remote(command, kwargs, upstream)
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


def test_upstream_check_rejects_sibling_behind_canonical_main(tmp_path):
    _root, paper, config_path, module = make_project(tmp_path)
    config = load_config(config_path)
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    config["paper"]["url"] = "https://example.org/paper"
    config_path.write_text(module.yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")

    canonical = make_clean_upstream_repo(tmp_path / "canonical")
    sibling = tmp_path / "PaperSkill"
    subprocess.run(["git", "clone", "-q", str(canonical), str(sibling)], check=True)
    subprocess.run(["git", "-C", str(sibling), "remote", "set-url", "origin", CANONICAL_PAPERSKILL_URL], check=True)
    (canonical / "main-only.txt").write_text("new canonical commit\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(canonical), "add", "main-only.txt"], check=True)
    subprocess.run(["git", "-C", str(canonical), "commit", "-q", "-m", "advance canonical main"], check=True)
    npm_commands = []

    def runner(command, **kwargs):
        if command[0] == "git":
            return run_git_with_local_canonical_remote(command, kwargs, canonical)
        npm_commands.append(command[2])
        return subprocess.CompletedProcess(command, 0, stdout="passed\n", stderr="")

    result = module.run_upstream_check(paper, config, sibling, "Ada Author", process_runner=runner)
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert result == 1
    assert npm_commands == []
    assert report["upstream_commit"] != report["canonical_main_commit"]
    assert "git fetch origin main --depth=1 --filter=tree:0" in report["error"]
    status = subprocess.run(["git", "-C", str(sibling), "status", "--porcelain"], capture_output=True, text=True, check=True)
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


def test_upstream_check_command_failure_is_reported_and_does_not_copy_export(tmp_path, capsys):
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
            return run_git_with_local_canonical_remote(command, kwargs, upstream)
        if command[2] == "import":
            make_imported_export(Path(kwargs["cwd"]))
        exit_code = 1 if command[2] == "preflight" else 0
        return subprocess.CompletedProcess(command, exit_code, stdout="mock result\n", stderr="")

    result = module.run_upstream_check(paper, config, upstream, "Ada Author", process_runner=runner)
    assert result == 1
    output = capsys.readouterr().out
    assert "[W10] Official Preflight..." in output
    assert "[W10] FAIL Official Preflight: mock result" in output
    assert "[W10] Writing failure preflight report..." in output
    assert "[W10] PASS Writing failure preflight report" in output
    assert not (root / config["release"]["output"]).exists()
    report = json.loads((paper / "audit/upstream-preflight.json").read_text(encoding="utf-8"))
    assert report["status"] == "FAIL"
    assert report["commands"][-1]["exit_code"] == 1
    problems = module.upstream_preflight_problems(paper, config)
    assert any("status must be PASS" in problem for problem in problems)
    assert any("failed with exit code 1" in problem for problem in problems)
