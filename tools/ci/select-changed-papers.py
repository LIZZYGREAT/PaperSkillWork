#!/usr/bin/env python3
"""Select paper workspace and web projects affected by a Git revision range."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


def git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        ["git", "-C", str(repo), *args],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if check and result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "unknown Git error"
        raise RuntimeError(f"git {' '.join(args)} failed: {detail}")
    return result


def resolve_commit(repo: Path, revision: str) -> str | None:
    if not revision or set(revision) == {"0"}:
        return None
    result = git(repo, "rev-parse", "--verify", f"{revision}^{{commit}}", check=False)
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def select_base(repo: Path, requested_base: str, fallback_ref: str | None, head: str) -> tuple[str, str]:
    resolved = resolve_commit(repo, requested_base)
    if resolved:
        return resolved, "event-before"

    if not fallback_ref:
        raise RuntimeError(
            f"The supplied base '{requested_base}' is zero or unavailable, and no trusted fallback ref was supplied. "
            "Provide the push target branch so the selector can use its merge-base; refusing to return an empty selection."
        )

    fallback = resolve_commit(repo, fallback_ref)
    if not fallback:
        raise RuntimeError(
            f"The supplied base '{requested_base}' is unavailable and trusted fallback ref '{fallback_ref}' "
            "cannot be resolved. Fetch the target branch or specify a valid baseline."
        )
    merge_base = git(repo, "merge-base", fallback, head, check=False)
    if merge_base.returncode != 0 or not merge_base.stdout.strip():
        raise RuntimeError(
            f"Could not determine merge-base between trusted fallback ref '{fallback_ref}' and HEAD '{head}'. "
            "Fetch a common target branch or specify a valid baseline."
        )
    return merge_base.stdout.strip(), f"merge-base:{fallback_ref}"


def changed_paths(repo: Path, base: str, head: str) -> list[str]:
    result = git(repo, "diff", "--name-status", "-z", "--find-renames", base, head, "--")
    fields = result.stdout.split("\0")
    paths: list[str] = []
    index = 0
    while index < len(fields):
        status = fields[index]
        index += 1
        if not status:
            continue
        if status.startswith(("R", "C")):
            if index + 1 >= len(fields):
                raise RuntimeError(f"Unexpected Git rename/copy record for status {status!r}.")
            paths.extend((fields[index], fields[index + 1]))
            index += 2
        else:
            if index >= len(fields):
                raise RuntimeError(f"Unexpected Git path record for status {status!r}.")
            paths.append(fields[index])
            index += 1
    return paths


def changed_targets(repo: Path, paths: list[str], base: str, head: str, base_source: str) -> dict[str, Any]:
    changed_papers: set[str] = set()
    web_dirs: dict[str, dict[str, str]] = {}
    kit_changed = False
    shared_qa_changed = False

    for git_path in paths:
        parts = Path(git_path.replace("\\", "/")).parts
        if len(parts) >= 2 and parts[0] == "papers":
            paper_id = parts[1]
            changed_papers.add(paper_id)
            if len(parts) >= 5 and parts[2] == "web":
                directory = "/".join(parts[:4])
                web_dirs[directory] = {"paper_id": paper_id, "dir": directory}
        if git_path == "reusable-kit" or git_path.startswith("reusable-kit/"):
            kit_changed = True
        if (
            git_path == "tools/visual-qa"
            or git_path.startswith("tools/visual-qa/")
            or git_path == "tools/ci"
            or git_path.startswith("tools/ci/")
            or git_path == ".github/workflows/ci.yml"
        ):
            shared_qa_changed = True

    deleted_papers = sorted(
        paper_id for paper_id in changed_papers if not (repo / "papers" / paper_id / "paper.yaml").is_file()
    )
    deleted_web_projects = [
        project
        for project in web_dirs.values()
        if not (repo / project["dir"] / "package.json").is_file()
    ]
    changed_web_projects = [
        project
        for project in web_dirs.values()
        if (repo / project["dir"] / "package.json").is_file()
    ]

    # A shared selector/runner/workflow change gets a small, fixed regression
    # sample. Paper-specific changes never expand to unrelated projects.
    if shared_qa_changed:
        for paper_id in ("ewc", "icarl"):
            directory = f"papers/{paper_id}/web/enhanced"
            if (repo / directory / "package.json").is_file():
                changed_web_projects.append({"paper_id": paper_id, "dir": directory})

    unique_projects = {project["dir"]: project for project in changed_web_projects}
    return {
        "base": base,
        "base_source": base_source,
        "head": head,
        "changed_papers": sorted(changed_papers),
        "deleted_papers": deleted_papers,
        "changed_web_projects": [unique_projects[key] for key in sorted(unique_projects)],
        "deleted_web_projects": sorted(deleted_web_projects, key=lambda item: item["dir"]),
        "kit_changed": kit_changed,
        "shared_qa_changed": shared_qa_changed,
    }


def append_github_outputs(path: str, selection: dict[str, Any]) -> None:
    values = {
        "changed_papers": json.dumps(selection["changed_papers"], separators=(",", ":")),
        "changed_web_projects": json.dumps(selection["changed_web_projects"], separators=(",", ":")),
        "deleted_papers": json.dumps(selection["deleted_papers"], separators=(",", ":")),
        "deleted_web_projects": json.dumps(selection["deleted_web_projects"], separators=(",", ":")),
        "kit_changed": str(selection["kit_changed"]).lower(),
        "shared_qa_changed": str(selection["shared_qa_changed"]).lower(),
        "diff_base": selection["base"],
    }
    with open(path, "a", encoding="utf-8", newline="\n") as output:
        for key, value in values.items():
            output.write(f"{key}={value}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path.cwd(), help="Git working tree (default: current directory)")
    parser.add_argument("--base", required=True, help="Push event before SHA (or all-zero SHA for first push)")
    parser.add_argument("--head", default="HEAD", help="Push event SHA (default: HEAD)")
    parser.add_argument("--fallback-ref", help="Trusted target branch/ref used to find a merge-base")
    parser.add_argument("--github-output", help="Append GitHub Actions outputs to this file")
    args = parser.parse_args()

    try:
        repo = Path(os.path.abspath(args.repo))
        head = resolve_commit(repo, args.head)
        if not head:
            raise RuntimeError(f"Head revision '{args.head}' cannot be resolved to a commit.")
        base, base_source = select_base(repo, args.base, args.fallback_ref, head)
        selection = changed_targets(repo, changed_paths(repo, base, head), base, head, base_source)
        if args.github_output:
            append_github_outputs(args.github_output, selection)
        json.dump(selection, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
        return 0
    except (OSError, RuntimeError) as error:
        print(f"Changed-paper selection failed: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
