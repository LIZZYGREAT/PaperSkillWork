import json
import shutil
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def git(repo, *args):
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        capture_output=True,
        text=True,
    )


def seed_paperskill_fixture(repo, paper_name, existing_versions):
    repo.mkdir()
    subprocess.run(["git", "init", "-q", "-b", "main", str(repo)], check=True)
    git(repo, "config", "user.name", "Test Contributor")
    git(repo, "config", "user.email", "test@example.invalid")
    (repo / "package.json").write_text('{"name":"fixture-paperskill"}\n', encoding="utf-8")
    (repo / "README.md").write_text("Tiny PaperSkill fixture.\n", encoding="utf-8")
    for version in existing_versions:
        existing = repo / "html_output" / paper_name / version
        existing.mkdir(parents=True)
        (existing / "paper.json").write_text(
            json.dumps({"paperName": paper_name, "version": version}), encoding="utf-8",
        )
    git(repo, "add", "--", "package.json", "README.md", "html_output")
    git(repo, "commit", "-m", "fixture baseline")


def simulate_official_import(repo, source, paper_name, base_version):
    """Model the official import contract: direct copy, filtering, and free suffix selection."""
    paper_root = repo / "html_output" / paper_name
    version = base_version
    suffix = 2
    while (paper_root / version).exists():
        version = "{}_{}".format(base_version, suffix)
        suffix += 1

    destination = paper_root / version
    shutil.copytree(
        source,
        destination,
        ignore=shutil.ignore_patterns("node_modules", "dist", "dist-ssr", ".vite", ".git"),
    )
    (destination / "paper.json").write_text(
        json.dumps({"paperName": paper_name, "version": version}), encoding="utf-8",
    )
    return destination


def test_single_paper_import_fixture_selects_next_version_and_stages_only_that_directory(tmp_path):
    work = tmp_path / "PaperSkillWork"
    paper = work / "papers" / "demo-paper"
    source = paper / "web" / "enhanced"
    source.mkdir(parents=True)
    (source / "package.json").write_text('{"scripts":{"build":"vite build"}}\n', encoding="utf-8")
    (source / "index.html").write_text('<script src="/src/main.tsx"></script>\n', encoding="utf-8")
    (source / "src").mkdir()
    (source / "src" / "main.tsx").write_text("export {};\n", encoding="utf-8")
    (source / "node_modules" / "react").mkdir(parents=True)
    (source / "node_modules" / "react" / "index.js").write_text("fixture dependency\n", encoding="utf-8")
    (source / "dist").mkdir()
    (source / "dist" / "bundle.js").write_text("fixture build output\n", encoding="utf-8")

    paper_name = "sample_paper_name"
    base_version = "ada1012"
    paperskill = tmp_path / "PaperSkill"
    seed_paperskill_fixture(paperskill, paper_name, [base_version, base_version + "_2"])

    imported = simulate_official_import(paperskill, source, paper_name, base_version)
    relative = imported.relative_to(paperskill).as_posix()
    assert relative == "html_output/sample_paper_name/ada1012_3"
    assert (imported / "paper.json").is_file()
    assert not (imported / "node_modules").exists()
    assert not (imported / "dist").exists()

    (paperskill / "catalog" / "papers.json").parent.mkdir(parents=True)
    (paperskill / "catalog" / "papers.json").write_text("unrelated local change\n", encoding="utf-8")
    git(paperskill, "add", "--", relative)
    staged = git(paperskill, "diff", "--cached", "--name-only").stdout.splitlines()

    assert staged
    assert all(path.startswith(relative + "/") for path in staged)
    assert (paperskill / "catalog" / "papers.json").is_file()
    assert not (work / "html_output").exists()


def test_workflow_docs_keep_four_individual_qa_statuses_and_single_w10_gate():
    statuses = ("UPSTREAM_SYNTAX", "UPSTREAM_OUTPUT", "SOURCE_BUILD", "SUBPATH_ASSETS")
    paths = (
        REPO_ROOT / ".agents/skills/implementation-plan/SKILL.md",
        REPO_ROOT / ".agents/skills/enhanced-implementation/SKILL.md",
        REPO_ROOT / ".agents/skills/final-audit/SKILL.md",
        REPO_ROOT / "docs/WORKFLOW.md",
        REPO_ROOT / "templates/implementation-plan.md",
        REPO_ROOT / "templates/final-check.md",
    )
    docs = "\n".join(path.read_text(encoding="utf-8") for path in paths)
    for status in statuses:
        assert status in docs
    assert "UPSTREAM_SOURCE_CHECK" not in docs
    assert "NOT_RUN" in (REPO_ROOT / "templates/final-check.md").read_text(encoding="utf-8")
    assert "唯一正式发布门禁" in (REPO_ROOT / "docs/WORKFLOW.md").read_text(encoding="utf-8")
