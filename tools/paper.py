#!/usr/bin/env python3
"""Mechanical workspace and workflow checks for PaperSkillWork."""

import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Any, Dict, List, Optional, Sequence, Tuple

try:
    import yaml
except ImportError:  # pragma: no cover - the dependency is declared in requirements-dev.txt
    yaml = None


if yaml is not None:
    class UniqueKeyLoader(yaml.SafeLoader):
        """Safe YAML loader that rejects duplicate keys instead of discarding data."""

    def _construct_unique_mapping(loader: Any, node: Any, deep: bool = False) -> Dict[Any, Any]:
        mapping: Dict[Any, Any] = {}
        for key_node, value_node in node.value:
            key = loader.construct_object(key_node, deep=deep)
            if key in mapping:
                raise yaml.constructor.ConstructorError(
                    "while constructing a mapping", node.start_mark,
                    "found duplicate key {!r}".format(key), key_node.start_mark,
                )
            mapping[key] = loader.construct_object(value_node, deep=deep)
        return mapping

    UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_unique_mapping)


ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "papers"
REUSABLE_KIT = ROOT / "reusable-kit"
WEB_PROJECT_TEMPLATE = ROOT / "templates" / "web-project"
PAPER_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
UPSTREAM_PAPER_NAME_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
UPSTREAM_VERSION_RE = re.compile(r"^[a-z][a-z0-9]*[0-9]{4}(?:_[0-9]+)?$")
PLACEHOLDER_RE = re.compile(r"\{\{([A-Za-z0-9_]+)\}\}")
ALLOWED_PLACEHOLDERS = {"paper_id", "paper_title", "paper_url", "arxiv_id"}
KIT_COMPONENT_STATUSES = ("candidate", "approved", "deprecated")
STAGES: List[Tuple[str, str, str]] = [
    ("W0", "W0_source_intake", "Source Intake"),
    ("W1", "W1_source_cache", "Source Cache + Asset Inventory"),
    ("W2", "W2_paper_model", "Paper Understanding Model"),
    ("W3", "W3_evidence_assets", "Evidence + Asset Curation"),
    ("W4", "W4_learning_spine", "Learning Spine + Information Priority"),
    ("W5", "W5_interaction_plan", "Visual / Interaction Planning"),
    ("W6", "W6_vertical_slice", "First Vertical Slice"),
    ("W7", "W7_human_review", "Human Learning Review"),
    ("W8", "W8_full_implementation", "Full Implementation"),
    ("W9", "W9_final_audit", "Learning + Evidence Audit"),
    ("W10", "W10_upstream_preflight", "Upstream Packaging & Preflight"),
]
STAGE_IDS = [stage[0] for stage in STAGES]
STAGE_BY_ID = {stage[0]: stage for stage in STAGES}
HUMAN_REVIEW_STAGES = {"W2", "W4", "W7", "W9"}
V3_TEMPLATE_OUTPUTS = {
    "paper.yaml": "paper.yaml",
    "source-content.md": "source-cache/content.md",
    "source-manifest.json": "source-cache/manifest.json",
    "source-evidence.json": "source-cache/evidence.json",
    "paper-model.md": "research/paper-model.md",
    "evidence-registry.yaml": "research/evidence-registry.yaml",
    "learning-spine.md": "design/learning-spine.md",
    "asset-plan.md": "design/asset-plan.md",
    "implementation-plan.md": "design/implementation-plan.md",
    "implementation-manifest.json": "web/enhanced/implementation-manifest.json",
    "final-check.md": "audit/final-check.md",
}
V3_ARTIFACTS = {
    "source_cache": "source-cache",
    "paper_model": "research/paper-model.md",
    "evidence_registry": "research/evidence-registry.yaml",
    "learning_spine": "design/learning-spine.md",
    "asset_plan": "design/asset-plan.md",
    "implementation_plan": "design/implementation-plan.md",
    "final_check": "audit/final-check.md",
    "enhanced": "web/enhanced",
}
V3_STAGE_ARTIFACTS = {
    "W0": ("file", "paper.yaml"),
    "W1": ("dir", "source-cache"),
    "W2": ("file", "research/paper-model.md"),
    "W3": ("file", "research/evidence-registry.yaml"),
    "W4": ("file", "design/learning-spine.md"),
    "W5": ("file", "design/implementation-plan.md"),
    "W6": ("file", "web/enhanced/package.json"),
    "W7": ("file", "design/implementation-plan.md"),
    "W8": ("file", "web/enhanced/package.json"),
    "W9": ("file", "audit/final-check.md"),
}
ABSOLUTE_LOCAL_PATH_RE = re.compile(
    r"(?:[A-Za-z]:\\Users\\[^\s\"'<>]+|/Users/[^/\s]+/[^\s\"'<>]+)"
)


class PaperError(Exception):
    """An expected user-facing validation or command error."""


def require_yaml() -> None:
    if yaml is None:
        raise PaperError("PyYAML is required. Install it with: python3 -m pip install -r requirements-dev.txt")


def paper_dir(paper_id: str) -> Path:
    validate_paper_id(paper_id)
    return PAPERS / paper_id


def validate_paper_id(paper_id: str) -> None:
    if not PAPER_ID_RE.fullmatch(paper_id):
        raise PaperError("Invalid paper id. Use lowercase letters, digits, '_' or '-', starting with a letter or digit.")


def path_problem(value: Any) -> Optional[str]:
    if not isinstance(value, str) or not value.strip():
        return "must be a non-empty relative path"
    text = value.strip()
    windows = PureWindowsPath(text)
    posix = PurePosixPath(text.replace("\\", "/"))
    if windows.is_absolute() or windows.drive or posix.is_absolute():
        return "absolute paths are not allowed"
    if ".." in posix.parts:
        return "parent traversal ('..') is not allowed"
    return None


def load_yaml(path: Path) -> Dict[str, Any]:
    require_yaml()
    try:
        value = yaml.load(path.read_text(encoding="utf-8"), Loader=UniqueKeyLoader)
    except (OSError, UnicodeError, yaml.YAMLError) as exc:
        raise PaperError("Cannot read valid YAML from {}: {}".format(path, exc))
    if not isinstance(value, dict):
        raise PaperError("{} must contain a YAML mapping".format(path))
    return value


def validate_config(config: Dict[str, Any], expected_id: str) -> List[str]:
    errors: List[str] = []
    schema_version = config.get("schema_version")
    if type(schema_version) is not int or schema_version != 3:
        return [
            "Unsupported schema_version {!r}. Current PaperSkillWork tooling supports schema_version 3 only. "
            "Historical workspaces must be inspected through Git history or migrated manually.".format(schema_version)
        ]

    configured_id = config.get("id")
    if not isinstance(configured_id, str) or not PAPER_ID_RE.fullmatch(configured_id):
        errors.append("id is invalid")
    elif configured_id != expected_id:
        errors.append("id '{}' does not match workspace directory '{}'".format(configured_id, expected_id))
    if not isinstance(config.get("title"), str) or not config["title"].strip():
        errors.append("title must be non-empty")

    paper = config.get("paper")
    if not isinstance(paper, dict) or not isinstance(paper.get("url"), str):
        errors.append("paper.url must be a string")
    if isinstance(paper, dict) and "local_pdf" in paper and paper["local_pdf"] is not None:
        problem = path_problem(paper["local_pdf"])
        if problem:
            errors.append("paper.local_pdf {}".format(problem))

    workflow = config.get("workflow")
    if not isinstance(workflow, dict):
        errors.append("workflow must be a mapping")
    else:
        extra_workflow_keys = sorted(set(workflow) - {"version", "current_stage", "stages"}, key=str)
        if extra_workflow_keys:
            errors.append("workflow has unknown keys: {}".format(", ".join(map(str, extra_workflow_keys))))
        if type(workflow.get("version")) is not int or workflow.get("version") != 3:
            errors.append("workflow.version must be 3")
        if workflow.get("current_stage") not in STAGE_IDS:
            errors.append("workflow.current_stage must be one of W0 through W10")
        stages = workflow.get("stages")
        expected_keys = {item[1] for item in STAGES}
        if not isinstance(stages, dict):
            errors.append("workflow.stages must be a mapping")
        else:
            missing = sorted(expected_keys - set(stages))
            extra = sorted(set(stages) - expected_keys, key=str)
            if missing:
                errors.append("workflow.stages is missing: {}".format(", ".join(missing)))
            if extra:
                errors.append("workflow.stages has unknown keys: {}".format(", ".join(map(str, extra))))
            for stage_id, stage_key, _label in STAGES:
                entry = stages.get(stage_key)
                if not isinstance(entry, dict):
                    if stage_key not in missing:
                        errors.append("workflow.stages.{} must be a mapping".format(stage_key))
                    continue
                status = entry.get("status")
                if status not in ("pending", "in_progress", "complete"):
                    errors.append("workflow.stages.{}.status must be pending, in_progress, or complete".format(stage_key))
                allowed_entry_keys = {"status"}
                if status == "complete":
                    allowed_entry_keys.update({"reviewed_by", "note"} if stage_id in HUMAN_REVIEW_STAGES else {"completed_by"})
                extra_entry_keys = sorted(set(entry) - allowed_entry_keys, key=str)
                if extra_entry_keys:
                    errors.append("workflow.stages.{} has unknown or invalid fields: {}".format(stage_key, ", ".join(map(str, extra_entry_keys))))
                if status == "complete":
                    if stage_id in HUMAN_REVIEW_STAGES:
                        if not isinstance(entry.get("reviewed_by"), str) or not entry["reviewed_by"].strip():
                            errors.append("workflow.stages.{}.reviewed_by is required for human-review stage {}".format(stage_key, stage_id))
                        if not isinstance(entry.get("note"), str) or not entry["note"].strip():
                            errors.append("workflow.stages.{}.note is required for human-review stage {}".format(stage_key, stage_id))
                    elif entry.get("completed_by") != "automation":
                        errors.append("workflow.stages.{}.completed_by must be automation for stage {}".format(stage_key, stage_id))

    for group_name in ("artifacts", "web"):
        group = config.get(group_name)
        if not isinstance(group, dict):
            errors.append("{} must be a mapping".format(group_name))
            continue
        for key, value in group.items():
            problem = path_problem(value)
            if problem:
                errors.append("{}.{} {}".format(group_name, key, problem))

    artifacts = config.get("artifacts")
    if isinstance(artifacts, dict):
        missing_artifacts = sorted(set(V3_ARTIFACTS) - set(artifacts))
        extra_artifacts = sorted(set(artifacts) - set(V3_ARTIFACTS), key=str)
        if missing_artifacts:
            errors.append("artifacts is missing: {}".format(", ".join(missing_artifacts)))
        if extra_artifacts:
            errors.append("artifacts has unknown keys: {}".format(", ".join(map(str, extra_artifacts))))
        for key, expected in V3_ARTIFACTS.items():
            if key in artifacts and artifacts[key] != expected:
                errors.append("artifacts.{} must be {}".format(key, expected))

    release = config.get("release")
    if not isinstance(release, dict):
        errors.append("release must be a mapping")
    else:
        release_fields = ("upstream_paper_name", "upstream_version", "output")
        extra_release_fields = sorted(set(release) - set(release_fields), key=str)
        if extra_release_fields:
            errors.append("release has unknown keys: {}".format(", ".join(map(str, extra_release_fields))))
        if any(not isinstance(release.get(key), str) for key in release_fields):
            errors.append("release.upstream_paper_name, release.upstream_version, and release.output must be strings")
        else:
            paper_name = release["upstream_paper_name"].strip()
            version = release["upstream_version"].strip()
            output = release["output"].strip()
            if paper_name and not UPSTREAM_PAPER_NAME_RE.fullmatch(paper_name):
                errors.append("release.upstream_paper_name must be a lowercase underscore identifier")
            if version and not UPSTREAM_VERSION_RE.fullmatch(version):
                errors.append("release.upstream_version must match the upstream version naming rule")
            if output:
                if not paper_name or not version:
                    errors.append("release.output requires upstream_paper_name and upstream_version")
                problem = path_problem(output)
                if problem:
                    errors.append("release.output {}".format(problem))
                elif paper_name and version and output.replace("\\", "/") != "html_output/{}/{}".format(paper_name, version):
                    errors.append("release.output must equal html_output/<upstream_paper_name>/<upstream_version>")

    if isinstance(paper, dict):
        if not isinstance(paper.get("authors"), list) or any(not isinstance(author, str) for author in paper.get("authors", [])):
            errors.append("paper.authors must be a list of strings")
        if paper.get("year") is not None and (isinstance(paper.get("year"), bool) or not isinstance(paper.get("year"), int)):
            errors.append("paper.year must be an integer or null")
        for key in ("venue", "source_type", "source_location", "source_hash"):
            if not isinstance(paper.get(key), str):
                errors.append("paper.{} must be a string".format(key))

    web = config.get("web")
    if isinstance(web, dict):
        extra_web_fields = sorted(set(web) - {"enhanced", "final"}, key=str)
        if extra_web_fields:
            errors.append("web has unknown keys: {}".format(", ".join(map(str, extra_web_fields))))
        if web.get("enhanced") != "web/enhanced":
            errors.append("web.enhanced must be web/enhanced")

    return errors


def read_paper(paper_id: str) -> Tuple[Path, Dict[str, Any]]:
    folder = paper_dir(paper_id)
    if not folder.is_dir():
        raise PaperError("Paper workspace does not exist: papers/{}".format(paper_id))
    config_path = folder / "paper.yaml"
    if not config_path.is_file():
        raise PaperError("Missing papers/{}/paper.yaml".format(paper_id))
    return folder, load_yaml(config_path)


def validate_or_raise(config: Dict[str, Any], paper_id: str) -> None:
    errors = validate_config(config, paper_id)
    if errors:
        raise PaperError("Invalid paper.yaml:\n- " + "\n- ".join(errors))


def git_global_value(key: str) -> str:
    try:
        result = subprocess.run(
            ["git", "config", "--global", "--get", key],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False,
        )
    except OSError as exc:
        raise PaperError("Could not read the shared contributor profile from Git config: {}".format(exc))
    if result.returncode == 1:
        return ""
    if result.returncode != 0:
        detail = (result.stderr or "").strip()
        raise PaperError("Could not read global Git setting {}{}".format(key, ": " + detail if detail else ""))
    value = (result.stdout or "").strip()
    if "\n" in value or "\r" in value:
        raise PaperError("Global Git setting {} must be a single line".format(key))
    return value


def resolve_contributor_profile(
    participant_override: Optional[str] = None,
    pinyin_override: Optional[str] = None,
    github_override: Optional[str] = None,
) -> Tuple[str, str, str]:
    values = []
    for key, override in (
        ("participant", participant_override),
        ("pinyin", pinyin_override),
        ("github", github_override),
    ):
        value = git_global_value("paperskillwork." + key) if override is None else override
        value = value.strip()
        if "\n" in value or "\r" in value:
            raise PaperError("Contributor profile field {} must be a single line".format(key))
        values.append(value)
    participant, pinyin, github = values
    if not participant:
        raise PaperError(
            "Contributor display name is missing. Set it once with `git config --global "
            "paperskillwork.participant \"Your public name\"`, or pass --participant for this run. "
            "Optional shared defaults: paperskillwork.pinyin and paperskillwork.github."
        )
    return participant, pinyin, github


def upstream_paper_name_from_title(title: str) -> str:
    ascii_title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    paper_name = re.sub(r"[^a-z0-9]+", "_", ascii_title.lower()).strip("_")
    if not paper_name or not UPSTREAM_PAPER_NAME_RE.fullmatch(paper_name):
        raise PaperError(
            "Could not derive an upstream paper name from the English title. "
            "Set release.upstream_paper_name in paper.yaml once and retry."
        )
    return paper_name


def write_paper_config(folder: Path, config: Dict[str, Any]) -> None:
    require_yaml()
    paper_id = config.get("id", "")
    validate_or_raise(config, paper_id)
    output = yaml.safe_dump(config, allow_unicode=True, sort_keys=False, default_flow_style=False)
    (folder / "paper.yaml").write_text(output, encoding="utf-8")


def marker_present(path: Path, marker: str) -> bool:
    if not path.is_file():
        return False
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return False
    pattern = r"^\s*(?:(?:Content|Release) Check Status\s*:\s*)?{}\s*$".format(re.escape(marker))
    return re.search(pattern, text, re.IGNORECASE | re.MULTILINE) is not None


def quote_yaml(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def registry_entry_status(entry: Dict[str, Any]) -> Optional[str]:
    """Return the maturity status of a registry entry, or None when it is not declared."""
    status = entry.get("status")
    return status if isinstance(status, str) else None


def approval_evidence_problems(name: str, entry: Dict[str, Any]) -> List[str]:
    """Verify the human acceptance record that an approved component must carry."""
    problems: List[str] = []
    approved_by = entry.get("approved_by")
    if not isinstance(approved_by, str) or not approved_by.strip():
        problems.append("reusable-kit component '{}' is approved but is missing a non-empty approved_by".format(name))
    approved_at = entry.get("approved_at")
    if not isinstance(approved_at, str) or not approved_at.strip():
        problems.append("reusable-kit component '{}' is approved but is missing a non-empty approved_at date".format(name))
    elif not re.fullmatch(r"\d{4}-\d{2}-\d{2}", approved_at.strip()):
        problems.append(
            "reusable-kit component '{}' is approved but approved_at '{}' is not a YYYY-MM-DD date".format(name, approved_at)
        )
    else:
        try:
            datetime.date.fromisoformat(approved_at.strip())
        except ValueError:
            problems.append(
                "reusable-kit component '{}' is approved but approved_at '{}' is not a real calendar date".format(name, approved_at)
            )
    evidence = entry.get("evidence")
    if not isinstance(evidence, list) or not evidence:
        problems.append("reusable-kit component '{}' is approved but is missing a non-empty evidence list".format(name))
    else:
        for index, item in enumerate(evidence, start=1):
            if not isinstance(item, str) or not item.strip():
                problems.append(
                    "reusable-kit component '{}' is approved but evidence item {} is not a non-empty string".format(name, index)
                )
    return problems


def reusable_kit_registry() -> Tuple[Dict[str, Dict[str, Any]], List[str]]:
    """Load the reusable component registry and verify its source directories."""
    registry_path = REUSABLE_KIT / "registry.yaml"
    if not registry_path.is_file():
        return {}, ["reusable-kit/registry.yaml is missing"]
    require_yaml()
    try:
        data = yaml.load(registry_path.read_text(encoding="utf-8"), Loader=UniqueKeyLoader)
    except (OSError, yaml.YAMLError) as exc:
        return {}, ["could not read reusable-kit/registry.yaml: {}".format(exc)]
    if not isinstance(data, dict) or not isinstance(data.get("components"), dict):
        return {}, ["reusable-kit/registry.yaml must define a components mapping"]
    components: Dict[str, Dict[str, Any]] = {}
    problems: List[str] = []
    version = data.get("version")
    if not isinstance(version, int) or isinstance(version, bool) or version != 2:
        problems.append("reusable-kit/registry.yaml must declare version: 2")
    for name, entry in data["components"].items():
        if not isinstance(name, str) or not isinstance(entry, dict):
            problems.append("reusable-kit registry entries need string names and mappings")
            continue
        tier = entry.get("tier")
        relative = entry.get("path")
        status = registry_entry_status(entry)
        if status is None or status not in KIT_COMPONENT_STATUSES:
            problems.append("reusable-kit component '{}' has an invalid status".format(name))
            continue
        if tier not in ("P0", "P1", "P2"):
            problems.append("reusable-kit component '{}' has an invalid tier".format(name))
            continue
        if not isinstance(relative, str) or not relative.strip():
            problems.append("reusable-kit component '{}' needs a source path".format(name))
            continue
        path = PurePosixPath(relative)
        if path.is_absolute() or ".." in path.parts or "\\" in relative:
            problems.append("reusable-kit component '{}' has an unsafe source path".format(name))
            continue
        source = (REUSABLE_KIT / Path(*path.parts)).resolve()
        try:
            source.relative_to(REUSABLE_KIT.resolve())
        except ValueError:
            problems.append("reusable-kit component '{}' path escapes the Kit".format(name))
            continue
        if not source.is_dir():
            problems.append("reusable-kit component '{}' source directory is missing: {}".format(name, relative))
            continue
        try:
            entry_source = kit_file(REUSABLE_KIT, entry.get("source"))
            if not entry_source.is_file():
                raise PaperError("source file is missing")
            entry_source.resolve().relative_to(source)
            dependencies = entry.get("dependencies", [])
            if not isinstance(dependencies, list):
                raise PaperError("dependencies must be a file-path list")
            for dependency in dependencies:
                if not kit_file(REUSABLE_KIT, dependency).is_file():
                    raise PaperError("dependency file is missing: {}".format(dependency))
            for field in ("purpose", "use_when", "avoid_when", "demo_anchor", "usage"):
                if field in entry and (not isinstance(entry[field], str) or not entry[field].strip()):
                    raise PaperError("{} must be non-empty text".format(field))
            if entry.get("recipe") and not kit_file(REUSABLE_KIT, entry["recipe"]).is_file():
                raise PaperError("recipe is missing: {}".format(entry["recipe"]))
        except (PaperError, ValueError) as exc:
            problems.append("reusable-kit component '{}' has invalid source metadata: {}".format(name, exc))
            continue
        if status == "approved":
            approval_problems = approval_evidence_problems(name, entry)
            if approval_problems:
                problems.extend(approval_problems)
                continue
        else:
            recorded = sorted(key for key in ("approved_by", "approved_at", "evidence") if entry.get(key) is not None)
            if recorded:
                problems.append(
                    "reusable-kit component '{}' is {} but records {}; only an approved entry may carry an approval record".format(
                        name, status, ", ".join(recorded)
                    )
                )
                continue
        components[name] = entry
    return components, problems


def kit_file(root: Path, relative: str) -> Path:
    """Resolve a portable source path without following links outside its owner."""
    if not isinstance(relative, str) or not relative or "\\" in relative:
        raise PaperError("Unsafe Kit file path: {}".format(relative))
    path = PurePosixPath(relative)
    if path.is_absolute() or PureWindowsPath(relative).drive or ".." in path.parts:
        raise PaperError("Unsafe Kit file path: {}".format(relative))
    target = root / Path(*path.parts)
    try:
        target.resolve().relative_to(root.resolve())
    except ValueError:
        raise PaperError("Kit file escapes its owner: {}".format(relative))
    for item in (target, *target.parents):
        if item == root.parent:
            break
        if item.is_symlink():
            raise PaperError("Kit file cannot traverse a symlink: {}".format(relative))
    return target


def kit_source_closure(registry: Dict[str, Dict[str, Any]], selected: Sequence[str]) -> List[str]:
    """Follow real local imports/exports plus declared non-import dependencies."""
    visited = set()

    def visit(relative: str) -> None:
        if relative in visited:
            return
        source = kit_file(REUSABLE_KIT, relative)
        if not source.is_file():
            raise PaperError("Missing Kit dependency: {}".format(relative))
        visited.add(relative)
        if source.suffix not in (".ts", ".tsx", ".css"):
            raise PaperError("Unsupported Kit source file: {}".format(relative))
        content = source.read_text(encoding="utf-8")
        imports = re.findall(r'''(?:\bfrom\s*|\bimport\s*|\bimport\s*\(\s*|@import\s*)["'](\.[^"']+)["']''', content)
        for specifier in imports:
            candidate = source.parent / specifier
            choices = [candidate] if candidate.suffix else [Path(str(candidate) + ext) for ext in (".ts", ".tsx", ".css", ".d.ts")] + [candidate / "index.ts", candidate / "index.tsx"]
            resolved = next((p for p in choices if p.is_file()), None)
            if resolved is None:
                raise PaperError("Missing Kit import '{}' from {}".format(specifier, relative))
            try:
                dependency = resolved.resolve().relative_to(REUSABLE_KIT.resolve()).as_posix()
            except ValueError:
                raise PaperError("Kit import escapes source: {} in {}".format(specifier, relative))
            # Check the authored path as well, before normalization loses links.
            if any(p.is_symlink() for p in (resolved, *resolved.parents) if p != REUSABLE_KIT.parent):
                raise PaperError("Kit imports cannot traverse symlinks")
            visit(dependency)

    for name in selected:
        entry = registry[name]
        visit(entry["source"])
        for relative in entry.get("dependencies", []):
            visit(relative)
    return sorted(visited)


def cmd_scaffold_kit(args: argparse.Namespace) -> int:
    import hashlib

    validate_paper_id(args.paper_id)
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    web_dir = folder / "web/enhanced"
    if not web_dir.is_dir():
        raise PaperError("Paper workspace is missing web/enhanced")
    src_dir = web_dir / "src"
    destination = src_dir / "shared"
    try:
        for path in (web_dir, src_dir, destination):
            path.resolve().relative_to(folder.resolve())
            if path.is_symlink() or (path.exists() and not path.is_dir()):
                raise PaperError("Kit destination must be a directory without symlinks: {}".format(path))
    except ValueError:
        raise PaperError("Kit destination resolves outside the paper workspace")
    registry, problems = reusable_kit_registry()
    if problems:
        raise PaperError("Reusable Kit registry is invalid: {}".format("; ".join(problems)))
    selected = [name.strip() for name in args.select.split(",") if name.strip()]
    if args.preset:
        selected = [name for name, entry in registry.items() if args.preset in entry.get("default_for", [])] + selected
    selected = list(dict.fromkeys(selected))
    if not selected:
        raise PaperError("Choose --select AssetA,AssetB or an explicit --preset continual-learning")
    unknown = sorted(set(selected) - set(registry))
    if unknown:
        raise PaperError("Unknown reusable component(s): {}".format(", ".join(unknown)))
    files = kit_source_closure(registry, selected)
    included = list(dict.fromkeys(selected + [name for name, entry in registry.items() if entry["source"] in files]))
    deprecated = [name for name in included if registry_entry_status(registry[name]) == "deprecated"]
    if deprecated:
        raise PaperError("Kit components are deprecated and cannot be copied: {}".format(", ".join(deprecated)))
    unapproved = sorted(name for name in included if registry_entry_status(registry[name]) != "approved")
    if unapproved and not args.allow_unapproved:
        raise PaperError("Reusable Kit component(s) are not approved: {}. Pass --allow-unapproved to scaffold them anyway.".format(", ".join(unapproved)))
    version_path = REUSABLE_KIT / "KIT_VERSION"
    if not version_path.is_file():
        raise PaperError("reusable-kit/KIT_VERSION is missing")
    version = version_path.read_text(encoding="utf-8").strip()
    metadata = kit_file(destination, "KIT_SELECTION.json")
    version_target = kit_file(destination, "KIT_VERSION")
    previous = {"components": [], "files": {}}
    if metadata.exists():
        try:
            previous = json.loads(metadata.read_text(encoding="utf-8"))
            if not isinstance(previous, dict) or not isinstance(previous.get("components"), list) or not all(isinstance(n, str) for n in previous["components"]) or not isinstance(previous.get("files"), dict):
                raise ValueError("components/files have invalid types")
            for relative, digest in previous["files"].items():
                kit_file(destination, relative)
                if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
                    raise ValueError("invalid file digest")
        except (OSError, ValueError, TypeError) as exc:
            raise PaperError("Invalid KIT_SELECTION.json; reconcile provenance before appending: {}".format(exc))
    elif version_target.exists():
        raise PaperError("Existing KIT_VERSION has no selection manifest; reconcile the existing source copy before appending")

    digest = lambda content: hashlib.sha256(content).hexdigest()
    contents = {relative: kit_file(REUSABLE_KIT, relative).read_bytes() for relative in files}
    conflicts, retained, new_files = [], [], []
    for relative, content in contents.items():
        target = kit_file(destination, relative)
        # Validate every parent before writing anything, including file-vs-dir collisions.
        if any(p.exists() and not p.is_dir() for p in target.parents if p != destination.parent):
            conflicts.append(relative)
        elif target.exists():
            if not target.is_file():
                conflicts.append(relative)
            elif target.read_bytes() == content:
                pass
            elif previous["files"].get(relative) == digest(content):
                retained.append(relative)  # Locally edited copy of the same source revision.
            else:
                conflicts.append(relative)
        else:
            new_files.append(relative)
    if conflicts:
        raise PaperError("Kit conflicts; no files were written:\n  {}\nReconcile these files manually or copy into a separate isolated project; existing source is never overwritten.".format("\n  ".join(sorted(set(conflicts)))))
    if args.dry_run:
        print(json.dumps({"selected": selected, "included": included, "files": files, "new_files": new_files, "retained_edits": retained}, indent=2))
        return 0

    src_dir.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".shared-scaffold-", dir=str(src_dir)))
    created = []
    made_destination = not destination.exists()
    try:
        for relative in new_files:
            target = stage / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(contents[relative])
        merged = dict(previous["files"])
        merged.update({relative: digest(content) for relative, content in contents.items()})
        provenance = {"kit_version": version, "components": sorted(set(previous["components"] + included)), "files": merged}
        (stage / "KIT_SELECTION.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
        if made_destination:
            shutil.copy2(str(version_path), str(stage / "KIT_VERSION"))
            stage.rename(destination)
        else:
            for relative in new_files:
                target = kit_file(destination, relative)
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("xb") as stream:
                    created.append(target)
                    stream.write((stage / relative).read_bytes())
            # Atomic provenance replacement; no existing source file is ever replaced.
            (stage / "KIT_SELECTION.json").replace(metadata)
    except OSError as exc:
        for target in reversed(created):
            target.unlink()
        raise PaperError("Could not scaffold Kit; new source files rolled back: {}".format(exc))
    finally:
        if stage.exists():
            stage.resolve().relative_to(src_dir.resolve())
            shutil.rmtree(str(stage))
    for name in unapproved:
        print("[WARN] {} is {}, not approved; copied because --allow-unapproved was passed".format(name, registry_entry_status(registry[name])))
    for relative in retained:
        print("[KEEP] Local edit retained: {}".format(relative))
    print("Copied Reusable Kit v{} into papers/{}/web/enhanced/src/shared".format(version, args.paper_id))
    print("Selected components: {}".format(", ".join(selected)))
    print("Files: {} new, {} reused; source closure {}".format(len(new_files), len(files) - len(new_files), len(files)))
    print("The paper now owns this source copy; existing source files were not overwritten.")
    return 0


def render_template(template_name: str, replacements: Dict[str, str], source_path: Optional[str] = None) -> str:
    template_file = ROOT / "templates" / (source_path or template_name)
    if not template_file.is_file():
        raise PaperError("Required template is missing: templates/{}".format(template_name))
    template = template_file.read_text(encoding="utf-8")
    unknown = sorted(set(PLACEHOLDER_RE.findall(template)) - ALLOWED_PLACEHOLDERS)
    if unknown:
        raise PaperError("Template {} has unsupported placeholders: {}".format(template_name, ", ".join(unknown)))
    for key, value in replacements.items():
        template = template.replace("{{" + key + "}}", value)
    if PLACEHOLDER_RE.search(template):
        raise PaperError("Template {} contains an unresolved placeholder".format(template_name))
    return template


def cmd_new(args: argparse.Namespace) -> int:
    validate_paper_id(args.paper_id)
    title = args.title.strip()
    url = (args.url or "").strip()
    arxiv_id = (args.arxiv_id or "").strip()
    source_location = (args.source_location or url or "").strip()
    if not title or "\n" in title or "\r" in title:
        raise PaperError("--title must be a non-empty single line")
    if not source_location:
        raise PaperError("provide --url or --source-location so W0 can identify the source")
    if args.year is not None and (args.year < 1000 or args.year > 9999):
        raise PaperError("--year must be a four-digit year")
    folder = PAPERS / args.paper_id
    if folder.exists():
        raise PaperError("Workspace already exists and was left unchanged: papers/{}".format(args.paper_id))

    replacements = {
        "paper_id": args.paper_id,
        "paper_title": title,
        "paper_url": quote_yaml(url),
        "arxiv_id": quote_yaml(arxiv_id),
    }
    rendered: Dict[str, str] = {}
    for template_name, relative_output in V3_TEMPLATE_OUTPUTS.items():
        template_replacements = dict(replacements)
        if template_name == "paper.yaml":
            template_replacements["paper_title"] = quote_yaml(title)
        elif template_name == "source-manifest.json":
            template_replacements["paper_title"] = json.dumps(title, ensure_ascii=False)[1:-1]
            template_replacements["paper_url"] = json.dumps(url, ensure_ascii=False)[1:-1]
        rendered[relative_output] = render_template(template_name, template_replacements)

    require_yaml()
    try:
        config = yaml.safe_load(rendered["paper.yaml"])
    except yaml.YAMLError as exc:
        raise PaperError("Rendered paper.yaml is invalid: {}".format(exc))
    if not isinstance(config, dict):
        raise PaperError("Rendered paper.yaml must be a mapping")
    config["paper"].update({
        "authors": [author.strip() for author in (args.author or []) if author.strip()],
        "venue": (args.venue or "").strip(),
        "year": args.year,
        "source_type": (args.source_type or "").strip(),
        "source_location": source_location,
        "source_hash": (args.source_hash or "").strip(),
    })
    rendered["paper.yaml"] = yaml.safe_dump(config, allow_unicode=True, sort_keys=False, default_flow_style=False)
    manifest = json.loads(rendered["source-cache/manifest.json"])
    manifest["paper"].update(config["paper"])
    rendered["source-cache/manifest.json"] = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    validate_or_raise(config, args.paper_id)
    rendered["source/paper.url"] = (url + "\n") if url else ""

    try:
        if not WEB_PROJECT_TEMPLATE.is_dir():
            raise PaperError("Required web project template is missing: templates/web-project")
        folder.mkdir(parents=False)
        for directory in (
            "source", "source-cache/figures", "research", "design", "audit",
            "assets/figures/original", "assets/figures/web",
        ):
            (folder / directory).mkdir(parents=True, exist_ok=True)
        shutil.copytree(WEB_PROJECT_TEMPLATE, folder / "web/enhanced")
        for relative, content in rendered.items():
            target = folder / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
    except OSError as exc:
        raise PaperError("Could not create workspace papers/{}: {}".format(args.paper_id, exc))

    print("Created papers/{}".format(args.paper_id))
    print("Next: complete W0 source metadata and W1's full-paper source cache, then use $paper-review for W2.")
    return 0


def stage_states(config: Dict[str, Any]) -> Dict[str, str]:
    stages = config["workflow"]["stages"]
    return {stage_id: stages[key]["status"] for stage_id, key, _label in STAGES}


def recommended_stage(states: Dict[str, str]) -> str:
    for stage_id, _key, label in STAGES:
        if states.get(stage_id) != "complete":
            return "{} {}".format(stage_id, label)
    return "No remaining stage"


def cmd_status(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    states = stage_states(config)
    print("Paper: {}".format(args.paper_id))
    print("Title: {}".format(" ".join(config["title"].split())))
    print("Current Stage: {}".format(config["workflow"]["current_stage"]))
    print("\nStages")
    for stage_id, _key, label in STAGES:
        print("{} {:<36} {}".format(stage_id, label, states[stage_id].upper()))
    print("\nArtifacts")
    for stage_id, (_kind, relative) in V3_STAGE_ARTIFACTS.items():
        target = folder / relative
        exists = target.is_dir() and any(target.iterdir()) if target.is_dir() else target.is_file()
        print("[{}] {}".format("PRESENT" if exists else "MISSING", relative))
    print("Next Recommended Stage: {}".format(recommended_stage(states)))
    return 0


def cmd_paths(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    values = {
        "workspace": "papers/{}/".format(args.paper_id),
        "source": "papers/{}/source/paper.url".format(args.paper_id),
        "source_cache": "papers/{}/source-cache".format(args.paper_id),
        "paper_model": "papers/{}/research/paper-model.md".format(args.paper_id),
        "evidence_registry": "papers/{}/research/evidence-registry.yaml".format(args.paper_id),
        "learning_spine": "papers/{}/design/learning-spine.md".format(args.paper_id),
        "asset_plan": "papers/{}/design/asset-plan.md".format(args.paper_id),
        "implementation_plan": "papers/{}/design/implementation-plan.md".format(args.paper_id),
        "final_check": "papers/{}/audit/final-check.md".format(args.paper_id),
        "enhanced": "papers/{}/web/enhanced".format(args.paper_id),
        "publish_source": str(resolve_upstream_source(folder, config).resolve()),
    }
    web = config.get("web", {})
    if isinstance(web, dict) and web.get("final"):
        values["final"] = "papers/{}/{}".format(args.paper_id, web["final"])
    if config["release"]["output"]:
        values["release_output"] = config["release"]["output"]
    labels = [(key, key.replace("_", " ").title()) for key in values]
    if args.json:
        print(json.dumps(values, ensure_ascii=False, indent=2))
    else:
        for key, label in labels:
            print("{}: {}".format(label, values[key]))
    return 0


def cmd_open(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)

    web_config = config.get("web", {})
    if args.edition == "final" and not web_config.get("final"):
        raise PaperError("papers/{}/paper.yaml has not configured web.final; this workspace has no Final edition yet".format(args.paper_id))
    relative_path = web_config.get(args.edition) if isinstance(web_config, dict) else None
    if not isinstance(relative_path, str) or path_problem(relative_path):
        raise PaperError("papers/{}/paper.yaml has no valid web.{} path".format(args.paper_id, args.edition))

    web_dir = folder / relative_path
    package_path = web_dir / "package.json"
    if not package_path.is_file():
        raise PaperError("Web package not found: {}".format(package_path.relative_to(ROOT).as_posix()))
    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise PaperError("Cannot read {}: {}".format(package_path.relative_to(ROOT).as_posix(), exc))
    if not isinstance(package, dict) or not isinstance(package.get("scripts"), dict) or not package["scripts"].get("dev"):
        raise PaperError("{} must define an npm 'dev' script".format(package_path.relative_to(ROOT).as_posix()))

    npm = shutil.which("npm")
    if not npm:
        raise PaperError("npm was not found. Install Node.js and npm, then retry.")

    print("Opening {} ({})...".format(args.paper_id, args.edition), flush=True)
    install_result = subprocess.run([npm, "install"], cwd=str(web_dir), check=False)
    if install_result.returncode != 0:
        print("npm install failed with exit code {}.".format(install_result.returncode), file=sys.stderr)
        return install_result.returncode

    print("Starting the development server and opening the browser. Press Ctrl+C to stop it.", flush=True)
    return subprocess.run([npm, "run", "dev", "--", "--open"], cwd=str(web_dir), check=False).returncode


def cmd_stage(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if args.stage is None and args.status is None:
        print("Paper: {}".format(args.paper_id))
        print("Current Stage: {}".format(config["workflow"]["current_stage"]))
        for stage_id, key, label in STAGES:
            entry = config["workflow"]["stages"][key]
            print("{} {:<36} {}".format(stage_id, label, entry["status"].upper()))
        return 0
    if args.stage is None or args.status is None:
        raise PaperError("Provide both <stage> and <status>")
    if args.stage not in STAGE_BY_ID:
        raise PaperError("Unknown stage '{}'; expected W0 through W10".format(args.stage))
    if args.status not in ("in_progress", "complete"):
        raise PaperError("Stage status must be in_progress or complete")
    stage_key = STAGE_BY_ID[args.stage][1]
    if config["workflow"]["stages"][stage_key]["status"] == "complete":
        raise PaperError("{} is already complete; revise its artifacts without resetting accepted history".format(args.stage))
    if args.status in ("in_progress", "complete"):
        problems = stage_order_problems(config, args.stage)
    else:
        problems = []
    if args.status == "complete":
        if args.stage in HUMAN_REVIEW_STAGES:
            if not (args.reviewed_by and args.reviewed_by.strip() and args.note and args.note.strip()):
                raise PaperError("{} requires --reviewed-by and --note for human acceptance".format(args.stage))
        elif args.reviewed_by or args.note:
            raise PaperError("{} is an automatic stage; omit --reviewed-by and --note".format(args.stage))
        problems.extend(v3_stage_completion_problems(
            folder,
            args.stage,
            config,
            require_w2_execution_model=(args.stage == "W2"),
        ))
        if problems:
            raise PaperError("Cannot mark {} complete:\n- {}".format(args.stage, "\n- ".join(problems)))
    elif args.reviewed_by or args.note:
        raise PaperError("--reviewed-by and --note are only valid when completing a stage")
    elif problems:
        raise PaperError("Cannot start {}:\n- {}".format(args.stage, "\n- ".join(problems)))

    entry = config["workflow"]["stages"][stage_key]
    entry["status"] = args.status
    if args.status == "complete":
        if args.stage in HUMAN_REVIEW_STAGES:
            entry["reviewed_by"] = args.reviewed_by.strip()
            entry["note"] = args.note.strip()
            entry.pop("completed_by", None)
        else:
            entry["completed_by"] = "automation"
            entry.pop("reviewed_by", None)
            entry.pop("note", None)
        index = STAGE_IDS.index(args.stage)
        config["workflow"]["current_stage"] = STAGE_IDS[min(index + 1, len(STAGE_IDS) - 1)]
    else:
        config["workflow"]["current_stage"] = args.stage
    validate_or_raise(config, args.paper_id)
    require_yaml()
    output = yaml.safe_dump(config, allow_unicode=True, sort_keys=False, default_flow_style=False)
    (folder / "paper.yaml").write_text(output, encoding="utf-8")
    print("Recorded {} as {} for {}.".format(args.stage, args.status, args.paper_id))
    return 0


def stage_order_problems(config: Dict[str, Any], stage_id: str) -> List[str]:
    index = STAGE_IDS.index(stage_id)
    stages = config["workflow"]["stages"]
    return [
        "{} {} is {}; must be complete first".format(prior_id, label, stages[key]["status"])
        for prior_id, key, label in STAGES[:index]
        if stages[key]["status"] != "complete"
    ]


def resolve_upstream_source(folder: Path, config: Dict[str, Any]) -> Path:
    """Use Final when configured; use Enhanced while Final has not been created."""
    web = config.get("web", {})
    if not isinstance(web, dict):
        web = {}
    final_relative = web.get("final")
    if final_relative is not None:
        if not isinstance(final_relative, str) or not final_relative.strip():
            raise PaperError("web.final must be a non-empty relative path when configured")
        issue = path_problem(final_relative)
        if issue:
            raise PaperError("web.final {}".format(issue))
        source = folder / final_relative
        if not source.is_dir():
            raise PaperError("configured web.final source is missing: {}".format(final_relative))
        return source

    enhanced_relative = web.get("enhanced", "web/enhanced")
    source = folder / enhanced_relative
    if not source.is_dir():
        raise PaperError(
            "web.final is not configured and Enhanced source '{}' is missing".format(enhanced_relative)
        )
    return source


def cmd_release_info(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)

    title = config["title"].strip()
    paper = config.get("paper", {})
    paper_url = paper.get("url", "") if isinstance(paper, dict) else ""
    if not isinstance(paper_url, str) or not paper_url.startswith("https://"):
        raise PaperError("paper.url must be an https:// URL before release-info can be used")

    source = resolve_upstream_source(folder, config).resolve()
    release = config.get("release", {})
    paper_name = release.get("upstream_paper_name", "").strip() or upstream_paper_name_from_title(title)
    participant, pinyin, github = resolve_contributor_profile()
    if any(ord(character) > 127 for character in participant) and not pinyin and not github:
        raise PaperError(
            "Contributor pinyin or GitHub username is required to derive an upstream version for a non-ASCII participant"
        )
    year = paper.get("year")
    venue = paper.get("venue", "")

    print(json.dumps({
        "paper_id": args.paper_id,
        "paper_name": paper_name,
        "title": title,
        "paper_url": paper_url.strip(),
        "source": str(source),
        "participant": participant,
        "pinyin": pinyin,
        "github": github,
        "year": year,
        "venue": venue,
    }, ensure_ascii=False, indent=2))
    return 0


def tracked_workspace_paths(paper_id: str) -> List[str]:
    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "ls-files", "-z", "--", "papers/{}".format(paper_id)],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if result.returncode != 0:
            return []
        return [item.decode("utf-8", errors="replace") for item in result.stdout.split(b"\0") if item]
    except OSError:
        return []


def hygiene_failures(paper_id: str) -> List[str]:
    failures: List[str] = []
    generated_names = {"node_modules", "dist", "dist-ssr"}
    for root_relative in tracked_workspace_paths(paper_id):
        workspace_relative = root_relative.split("/", 2)[-1]
        parts = workspace_relative.split("/")
        if any(part in generated_names for part in parts):
            failures.append("tracked generated path: {}".format(root_relative))
            continue
        env_path = next(
            (part for part in parts if part == ".env" or (part.startswith(".env.") and part != ".env.example")),
            None,
        )
        if env_path:
            failures.append("tracked environment path: {}".format(root_relative))
    return failures


def hygiene_warnings(folder: Path) -> List[str]:
    """Check local text for machine-specific paths; local ignored caches are allowed."""
    warnings: List[str] = []
    text_suffixes = {".md", ".yaml", ".yml", ".url", ".json", ".ts", ".tsx", ".js", ".html", ".css", ".txt", ".py", ".toml"}
    ignored_parts = {"node_modules", "dist", "dist-ssr", ".git"}
    if folder.exists():
        for path in folder.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in text_suffixes:
                continue
            if ignored_parts.intersection(path.parts):
                continue
            try:
                contents = path.read_text(encoding="utf-8")
            except (OSError, UnicodeError):
                continue
            if ABSOLUTE_LOCAL_PATH_RE.search(contents):
                warnings.append("possible local absolute path in {}".format(path.relative_to(folder).as_posix()))
    return warnings


def markdown_section(markdown: str, heading: str) -> str:
    match = re.search(r"^##\s+{}\s*$([\s\S]*?)(?=^##\s+|\Z)".format(re.escape(heading)), markdown, re.MULTILINE)
    return match.group(1).strip() if match else ""


def markdown_subsection(markdown: str, heading: str) -> str:
    match = re.search(r"^###\s+{}\s*$([\s\S]*?)(?=^#{{1,6}}\s+|\Z)".format(re.escape(heading)), markdown, re.MULTILINE)
    return match.group(1).strip() if match else ""


def v3_w2_execution_model_problems(text: str) -> List[str]:
    problems: List[str] = []
    if not re.search(r"^##\s+Algorithm Execution Model\s*$", text, re.MULTILINE):
        return ["paper-model is missing section 'Algorithm Execution Model'"]

    inputs_prompt = "List the model, data, parameters, persistent state, available history, and assumptions that exist before execution starts."
    inference_prompt = "Describe inference separately: its entry point, inputs, required trained or persistent state, processing order, and outputs. If evaluation occurs between rounds, place it at the paper's actual timing rather than treating it as the final inference path."
    template_pseudocode = """initialize model, data, parameters, and persistent state
for each applicable task / round / step in the paper's real order:
    read the state and inputs required by this step
    execute training, update, selection, storage, or other key branches
    commit the values and persistent objects needed by the next step
return the paper-defined trained state or output"""
    state_headers = {
        "state / value", "created or read when", "temporary / derived / persistent",
        "frozen / updatable", "consumed or retained by",
    }

    for heading in ("Inputs and Initialization", "Executable Pseudocode", "Prediction / Inference Entry", "State Classification"):
        if not re.search(r"^###\s+{}\s*$".format(re.escape(heading)), text, re.MULTILINE):
            problems.append("Algorithm Execution Model is missing subsection '{}'".format(heading))
            continue
        body = markdown_subsection(text, heading)
        normalized = re.sub(r"\s+", " ", body).strip().lower()
        if heading == "Inputs and Initialization":
            if not normalized or normalized == inputs_prompt.lower():
                problems.append("Algorithm Execution Model subsection '{}' is empty or still a template prompt".format(heading))
        elif heading == "Prediction / Inference Entry":
            if not normalized or normalized == inference_prompt.lower():
                problems.append("Algorithm Execution Model subsection '{}' is empty or still a template prompt".format(heading))
        elif heading == "Executable Pseudocode":
            code_blocks = re.findall(r"```[^\n]*\n([\s\S]*?)```", body)
            code = "\n".join(block.strip() for block in code_blocks).strip()
            normalized_code = re.sub(r"\s+", " ", code).strip().lower()
            normalized_template = re.sub(r"\s+", " ", template_pseudocode).strip().lower()
            if not normalized_code:
                problems.append("Algorithm Execution Model needs a non-empty pseudocode code block")
            elif normalized_code == normalized_template:
                problems.append("Algorithm Execution Model pseudocode is still the template placeholder")
        elif heading == "State Classification":
            has_state_content = False
            for line in body.splitlines():
                stripped = line.strip()
                if not stripped.startswith("|"):
                    plain = re.sub(r"[`*_>#]", "", stripped).strip()
                    if plain:
                        has_state_content = True
                        break
                    continue
                cells = [re.sub(r"[`*_]", "", cell).strip().lower() for cell in stripped.strip("|").split("|")]
                if any(cell and set(cell) - {"-", ":"} and cell not in state_headers for cell in cells):
                    has_state_content = True
                    break
            if not has_state_content:
                problems.append("Algorithm Execution Model subsection '{}' is empty or still a template table".format(heading))
    return problems


def read_json_object(path: Path, label: str) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    if not path.is_file():
        return None, ["{} is missing".format(label)]
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        return None, ["{} is not valid JSON: {}".format(label, exc)]
    if not isinstance(value, dict):
        return None, ["{} must contain an object".format(label)]
    return value, []


def fenced_yaml(markdown_path: Path) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    if not markdown_path.is_file():
        return None, ["{} is missing".format(markdown_path.name)]
    try:
        markdown = markdown_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return None, ["cannot read {}: {}".format(markdown_path.name, exc)]
    match = re.search(r"```ya?ml\s*\n([\s\S]*?)\n```", markdown)
    if not match:
        return None, ["{} has no fenced YAML data block".format(markdown_path.name)]
    try:
        value = yaml.load(match.group(1), Loader=UniqueKeyLoader)
    except yaml.YAMLError as exc:
        return None, ["{} YAML block is invalid: {}".format(markdown_path.name, exc)]
    if not isinstance(value, dict):
        return None, ["{} YAML block must contain a mapping".format(markdown_path.name)]
    return value, []


def evidence_registry_ids_v3(folder: Path) -> Tuple[set, Dict[str, Dict[str, Any]], List[str]]:
    path = folder / "research/evidence-registry.yaml"
    if not path.is_file():
        return set(), {}, ["research/evidence-registry.yaml is missing"]
    try:
        registry = load_yaml(path)
    except PaperError as exc:
        return set(), {}, [str(exc)]
    ids: set = set()
    entries: Dict[str, Dict[str, Any]] = {}
    errors: List[str] = []
    for category, values in registry.items():
        if category == "review":
            if not isinstance(values, dict):
                errors.append("evidence registry review must be a mapping")
                continue
            for flag in ("unresolved_source_conflicts", "unresolved_evidence_conflicts", "unsafe_claim_wording"):
                items = values.get(flag, [])
                if not isinstance(items, list) or any(not isinstance(item, str) or not item.strip() for item in items):
                    errors.append("evidence registry review.{} must be a list of non-empty strings".format(flag))
                elif items:
                    errors.append("evidence registry review.{} must be resolved before W3 completes: {}".format(flag, "; ".join(items)))
            continue
        if not isinstance(values, dict):
            errors.append("evidence registry section '{}' must be a mapping".format(category))
            continue
        for item_id, entry in values.items():
            if not isinstance(item_id, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", item_id):
                errors.append("evidence registry has invalid ID '{}'".format(item_id))
                continue
            if item_id in ids:
                errors.append("evidence registry has duplicate ID '{}'".format(item_id))
            ids.add(item_id)
            if not isinstance(entry, dict):
                errors.append("evidence registry entry '{}' must be a mapping".format(item_id))
            else:
                entries[item_id] = entry
    return ids, entries, errors


def v3_cache_data(folder: Path) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    problems: List[str] = []
    content_path = folder / "source-cache/content.md"
    try:
        content = content_path.read_text(encoding="utf-8") if content_path.is_file() else ""
    except (OSError, UnicodeError) as exc:
        content = ""
        problems.append("cannot read source-cache/content.md: {}".format(exc))
    if not content.strip():
        problems.append("source-cache/content.md is missing or empty")
    elif "SOURCE CACHE STATUS: PENDING" in content:
        problems.append("source-cache/content.md is still the pending scaffold")
    manifest, manifest_problems = read_json_object(folder / "source-cache/manifest.json", "source-cache/manifest.json")
    evidence, evidence_problems = read_json_object(folder / "source-cache/evidence.json", "source-cache/evidence.json")
    problems.extend(manifest_problems + evidence_problems)
    if manifest is not None:
        source = manifest.get("paper")
        if not isinstance(source, dict):
            problems.append("source-cache/manifest.json needs a paper object")
        else:
            for key in ("title", "source_type", "source_location"):
                if not isinstance(source.get(key), str) or not source[key].strip():
                    problems.append("source-cache manifest paper metadata is missing {}".format(key))
            if not isinstance(source.get("authors"), list) or not source.get("authors"):
                problems.append("source-cache manifest paper metadata needs authors")
            if not str(source.get("venue", "")).strip() and source.get("year") is None:
                problems.append("source-cache manifest paper metadata needs venue or year")
        if not isinstance(manifest.get("extraction"), str) or not manifest["extraction"].strip():
            problems.append("source-cache manifest must describe its extraction method")
        if not isinstance(manifest.get("figures"), list):
            problems.append("source-cache/manifest.json needs a figures list")
        if manifest.get("cache_status") != "complete":
            problems.append("source-cache/manifest.json cache_status must be complete")
        allowed_figure_types = {"ARCHITECTURE", "PIPELINE", "ALGORITHM", "MECHANISM", "RESULT", "ABLATION", "DATASET_EXAMPLE", "QUALITATIVE_RESULT", "LOW_VALUE"}
        for index, figure in enumerate(manifest.get("figures", []) if isinstance(manifest.get("figures"), list) else []):
            if not isinstance(figure, dict):
                problems.append("source-cache figure {} must be an object".format(index + 1))
                continue
            for key in ("id", "locator", "caption", "type", "candidate_role"):
                if not isinstance(figure.get(key), str) or not figure[key].strip():
                    problems.append("source-cache figure {} is missing {}".format(index + 1, key))
            if not isinstance(figure.get("type"), str) or figure.get("type") not in allowed_figure_types:
                problems.append("source-cache figure '{}' has unknown type '{}'".format(figure.get("id", index + 1), figure.get("type")))
            image_path = figure.get("image_path")
            if image_path:
                path_issue = path_problem(image_path)
                if path_issue:
                    problems.append("source-cache figure {} image_path {}".format(figure.get("id", index + 1), path_issue))
                elif not (folder / image_path).is_file():
                    problems.append("source-cache figure image is missing: {}".format(image_path))
    if evidence is not None and not isinstance(evidence.get("source_notes", []), list):
        problems.append("source-cache/evidence.json source_notes must be a list")
    return manifest, problems


def v3_priority_data(folder: Path, evidence_ids: set) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    data, problems = fenced_yaml(folder / "design/learning-spine.md")
    if data is None:
        return None, problems
    stages = data.get("stages")
    items = data.get("items")
    if not isinstance(stages, list) or not stages:
        problems.append("learning spine must define at least one stage")
        stages = []
    stage_ids = set()
    for stage in stages:
        if not isinstance(stage, dict) or not isinstance(stage.get("id"), str) or not stage["id"].strip():
            problems.append("learning spine stages need unique IDs")
        elif stage["id"] in stage_ids:
            problems.append("learning spine has duplicate stage ID '{}'".format(stage["id"]))
        else:
            stage_ids.add(stage["id"])
        if not isinstance(stage, dict) or not isinstance(stage.get("question"), str) or not stage["question"].strip():
            problems.append("each learning spine stage needs a question")
    if not isinstance(items, list) or not items:
        problems.append("learning spine must define content priority items")
        items = []
    item_ids = set()
    for item in items:
        if not isinstance(item, dict):
            problems.append("learning spine items must be mappings")
            continue
        item_id = item.get("id")
        if not isinstance(item_id, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", item_id):
            problems.append("learning spine item has invalid ID '{}'".format(item_id))
            continue
        if item_id in item_ids:
            problems.append("duplicate learning item ID '{}' (items must be assigned once)".format(item_id))
        item_ids.add(item_id)
        if not isinstance(item.get("title"), str) or not item["title"].strip():
            problems.append("learning item '{}' needs a short title".format(item_id))
        priority = item.get("priority")
        stage = item.get("stage")
        placement = item.get("placement")
        if priority == "CORE":
            if not isinstance(stage, str) or stage not in stage_ids or placement != "mainline":
                problems.append("CORE item '{}' must map to one mainline stage".format(item_id))
        elif priority == "SUPPORTING":
            if not isinstance(stage, str) or stage not in stage_ids or placement not in ("compact-inline", "hover", "expandable"):
                problems.append("SUPPORTING item '{}' needs a compact placement and valid stage".format(item_id))
        elif priority == "REFERENCE":
            if stage is not None or placement not in ("Reference Hub", "Hover", "Advanced details", "Implementation notes", "Evidence details"):
                problems.append("REFERENCE item '{}' must stay outside the mainline".format(item_id))
        elif priority == "DELETE":
            if stage is not None or placement not in ("none", "DELETE", None):
                problems.append("DELETE item '{}' must not be placed on the mainline".format(item_id))
        else:
            problems.append("item '{}' has unknown priority '{}'".format(item_id, priority))
        refs = item.get("evidence_refs", [])
        if not isinstance(refs, list):
            problems.append("item '{}' evidence_refs must be a list".format(item_id))
        else:
            for reference in refs:
                if not isinstance(reference, str) or reference not in evidence_ids:
                    problems.append("learning item '{}' references unknown evidence ID '{}'".format(item_id, reference))
    return data, problems


def v3_implementation_data(
    folder: Path,
    evidence_ids: set,
    warnings: Optional[List[str]] = None,
) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    """Validate the implementation plan; candidate component use is a warning, not a failure."""
    plan, problems = fenced_yaml(folder / "design/implementation-plan.md")
    if plan is None:
        return None, problems
    implementation = plan.get("implementation")
    if not isinstance(implementation, dict):
        return plan, problems + ["implementation-plan YAML must define an implementation mapping"]

    reusable_components, registry_problems = reusable_kit_registry()
    problems.extend(registry_problems)

    spine, spine_problems = v3_priority_data(folder, evidence_ids)
    problems.extend(spine_problems)
    if not isinstance(spine, dict):
        return plan, problems
    spine_stages = {
        stage.get("id") for stage in spine.get("stages", [])
        if isinstance(stage, dict) and isinstance(stage.get("id"), str)
    }
    items_by_priority: Dict[str, set] = {priority: set() for priority in ("CORE", "SUPPORTING", "REFERENCE", "DELETE")}
    for item in spine.get("items", []):
        if isinstance(item, dict) and isinstance(item.get("priority"), str) and item.get("priority") in items_by_priority and isinstance(item.get("id"), str):
            items_by_priority[item["priority"]].add(item["id"])

    stages = implementation.get("stages")
    if not isinstance(stages, list):
        problems.append("implementation.stages must be a list")
        stages = []
    plan_stage_ids = set()
    planned_core: Dict[str, List[str]] = {}
    for index, stage in enumerate(stages):
        label = "implementation stage {}".format(index + 1)
        if not isinstance(stage, dict):
            problems.append("{} must be a mapping".format(label))
            continue
        stage_id = stage.get("id")
        if not isinstance(stage_id, str) or not stage_id.strip():
            problems.append("{} needs an ID from the learning spine".format(label))
        elif stage_id not in spine_stages:
            problems.append("{} ID '{}' is not in the learning spine".format(label, stage_id))
        elif stage_id in plan_stage_ids:
            problems.append("implementation plan has duplicate stage ID '{}'".format(stage_id))
        else:
            plan_stage_ids.add(stage_id)
        for key in ("page", "primary_vehicle", "reason"):
            if not isinstance(stage.get(key), str) or not stage[key].strip():
                problems.append("{} needs a non-empty {}".format(label, key))
        if "reusable_pattern" in stage and stage["reusable_pattern"] is not None and not isinstance(stage["reusable_pattern"], str):
            problems.append("{} reusable_pattern must be a string or null".format(label))
        elif isinstance(stage.get("reusable_pattern"), str) and stage["reusable_pattern"] not in reusable_components:
            problems.append("{} uses unknown reusable_pattern '{}' (see reusable-kit/registry.yaml)".format(label, stage["reusable_pattern"]))
        else:
            pattern = stage.get("reusable_pattern")
            if isinstance(pattern, str) and pattern in reusable_components:
                pattern_status = registry_entry_status(reusable_components[pattern])
                if pattern_status == "deprecated":
                    problems.append(
                        "{} uses deprecated reusable component '{}' and must choose a supported one".format(label, pattern)
                    )
                elif pattern_status != "approved" and warnings is not None:
                    warnings.append(
                        "{} uses candidate reusable component '{}'; it stays usable but is not approved yet".format(label, pattern)
                    )
        core_items = stage.get("core_items")
        if not isinstance(core_items, list) or not core_items:
            problems.append("{} core_items must be a non-empty list".format(label))
            core_items = []
        for item_id in core_items:
            if not isinstance(item_id, str):
                problems.append("{} core_items must contain item IDs".format(label))
                continue
            if item_id in items_by_priority["DELETE"]:
                problems.append("DELETE item '{}' must not appear in the implementation plan".format(item_id))
                continue
            if item_id not in items_by_priority["CORE"]:
                problems.append("{} includes '{}' which is not a CORE item".format(label, item_id))
            planned_core.setdefault(item_id, []).append(stage_id if isinstance(stage_id, str) else "?")
        evidence_refs = stage.get("evidence_refs")
        if not isinstance(evidence_refs, list):
            problems.append("{} evidence_refs must be a list".format(label))
        else:
            for reference in evidence_refs:
                if not isinstance(reference, str) or reference not in evidence_ids:
                    problems.append("{} references unknown evidence ID '{}'".format(label, reference))

    for item_id in sorted(items_by_priority["CORE"]):
        count = len(planned_core.get(item_id, []))
        if count == 0:
            problems.append("CORE item '{}' is missing from implementation.stages".format(item_id))
        elif count > 1:
            problems.append("CORE item '{}' must appear in exactly one implementation stage".format(item_id))

    def validate_placements(key: str, priority: str, allowed: set) -> None:
        rows = implementation.get(key)
        if not isinstance(rows, list):
            problems.append("implementation.{} must be a list".format(key))
            return
        seen: Dict[str, int] = {}
        for index, row in enumerate(rows):
            label = "implementation.{} item {}".format(key, index + 1)
            if not isinstance(row, dict):
                problems.append("{} must be a mapping".format(label))
                continue
            item_id = row.get("item")
            if not isinstance(item_id, str):
                problems.append("{} needs an item ID".format(label))
                continue
            seen[item_id] = seen.get(item_id, 0) + 1
            if item_id not in items_by_priority[priority]:
                if item_id in items_by_priority["DELETE"]:
                    problems.append("DELETE item '{}' must not appear in the implementation plan".format(item_id))
                else:
                    problems.append("implementation.{} includes '{}' which is not {}".format(key, item_id, priority))
            placement = row.get("placement")
            if not isinstance(placement, str) or placement not in allowed:
                problems.append("{} placement must be one of: {}".format(label, ", ".join(sorted(allowed))))
        for item_id in sorted(items_by_priority[priority]):
            count = seen.get(item_id, 0)
            if count == 0:
                problems.append("{} item '{}' is missing from implementation.{}".format(priority, item_id, key))
            elif count > 1:
                problems.append("{} item '{}' must appear only once in implementation.{}".format(priority, item_id, key))

    validate_placements("supporting", "SUPPORTING", {"compact-inline", "hover", "expandable"})
    validate_placements("reference", "REFERENCE", {"Reference Hub", "Hover", "Advanced details", "Implementation notes", "Evidence details"})

    source_manifest, cache_problems = v3_cache_data(folder)
    problems.extend(cache_problems)
    asset_plan, asset_problems = validate_asset_plan(folder, source_manifest, evidence_ids)
    problems.extend(asset_problems)
    selected_assets = {
        row.get("id") for row in asset_plan.get("assets", [])
        if isinstance(row, dict) and row.get("decision") in ("USE_DIRECTLY", "CROP_AND_USE", "REDRAW_FROM_PAPER") and isinstance(row.get("id"), str)
    } if isinstance(asset_plan, dict) and isinstance(asset_plan.get("assets"), list) else set()
    asset_rows = implementation.get("assets")
    if not isinstance(asset_rows, list):
        problems.append("implementation.assets must be a list")
        asset_rows = []
    seen_assets: Dict[str, int] = {}
    for index, row in enumerate(asset_rows):
        label = "implementation asset {}".format(index + 1)
        if not isinstance(row, dict):
            problems.append("{} must be a mapping".format(label))
            continue
        asset_id = row.get("asset")
        if not isinstance(asset_id, str):
            problems.append("{} needs an asset ID".format(label))
            continue
        seen_assets[asset_id] = seen_assets.get(asset_id, 0) + 1
        if asset_id not in selected_assets:
            problems.append("implementation asset '{}' is not a selected public asset".format(asset_id))
        asset_stage = row.get("stage")
        if asset_stage != "Reference Hub" and (not isinstance(asset_stage, str) or asset_stage not in spine_stages):
            problems.append("implementation asset '{}' stage must be a Learning Spine stage or Reference Hub".format(asset_id))
        if row.get("rendering") not in ("original", "crop", "redraw", "overlay"):
            problems.append("implementation asset '{}' rendering must be original, crop, redraw, or overlay".format(asset_id))
    for asset_id in sorted(selected_assets):
        count = seen_assets.get(asset_id, 0)
        if count == 0:
            problems.append("selected public asset '{}' is missing from implementation.assets".format(asset_id))
        elif count > 1:
            problems.append("selected public asset '{}' must appear once in implementation.assets".format(asset_id))

    vertical_slice = implementation.get("vertical_slice")
    if not isinstance(vertical_slice, dict):
        problems.append("implementation.vertical_slice must be a mapping")
    else:
        slice_stages = vertical_slice.get("stages")
        required_core = vertical_slice.get("required_core_items")
        if not isinstance(slice_stages, list) or not slice_stages:
            problems.append("implementation.vertical_slice.stages must be a non-empty list")
            slice_stages = []
        if not isinstance(required_core, list) or not required_core:
            problems.append("implementation.vertical_slice.required_core_items must be a non-empty list")
            required_core = []
        if len(slice_stages) != len(set(item for item in slice_stages if isinstance(item, str))):
            problems.append("implementation.vertical_slice.stages must not contain duplicates")
        if len(required_core) != len(set(item for item in required_core if isinstance(item, str))):
            problems.append("implementation.vertical_slice.required_core_items must not contain duplicates")
        selected_core = {
            core_id
            for stage in stages if isinstance(stage, dict) and stage.get("id") in slice_stages
            for core_id in stage.get("core_items", []) if isinstance(core_id, str)
        }
        for stage_id in slice_stages:
            if not isinstance(stage_id, str) or stage_id not in plan_stage_ids:
                problems.append("vertical-slice stage '{}' does not exist in the implementation plan".format(stage_id))
        for item_id in required_core:
            if not isinstance(item_id, str) or item_id not in items_by_priority["CORE"]:
                problems.append("vertical slice requires '{}' which is not a CORE item".format(item_id))
            elif item_id not in selected_core:
                problems.append("vertical-slice CORE item '{}' is not assigned to a selected stage".format(item_id))
    return plan, problems


def v3_implementation_coverage(
    folder: Path,
    stage_id: str,
    implementation_plan: Dict[str, Any],
    config: Dict[str, Any],
) -> List[str]:
    problems: List[str] = []
    try:
        source = resolve_upstream_source(folder, config)
    except PaperError as exc:
        return [str(exc)]
    source_label = source.relative_to(folder).as_posix()
    manifest, manifest_problems = read_json_object(
        source / "implementation-manifest.json",
        "{}/implementation-manifest.json".format(source_label),
    )
    problems.extend(manifest_problems)
    if manifest is None:
        return problems
    implementation = implementation_plan.get("implementation")
    if not isinstance(implementation, dict):
        return problems + ["implementation-plan has no implementation mapping"]

    core_plan: Dict[str, str] = {}
    for stage in implementation.get("stages", []) if isinstance(implementation.get("stages"), list) else []:
        if not isinstance(stage, dict) or not isinstance(stage.get("id"), str):
            continue
        for item_id in stage.get("core_items", []) if isinstance(stage.get("core_items"), list) else []:
            if isinstance(item_id, str):
                core_plan[item_id] = stage["id"]
    supporting_plan = {
        row.get("item"): row.get("placement") for row in implementation.get("supporting", [])
        if isinstance(row, dict) and isinstance(row.get("item"), str)
    } if isinstance(implementation.get("supporting"), list) else {}
    reference_plan = {
        row.get("item"): row.get("placement") for row in implementation.get("reference", [])
        if isinstance(row, dict) and isinstance(row.get("item"), str)
    } if isinstance(implementation.get("reference"), list) else {}
    vertical_slice = implementation.get("vertical_slice")
    slice_core = {
        item_id for item_id in vertical_slice.get("required_core_items", []) if isinstance(item_id, str)
    } if isinstance(vertical_slice, dict) and isinstance(vertical_slice.get("required_core_items"), list) else set()

    core_manifest = manifest.get("implemented_core")
    if not isinstance(core_manifest, dict):
        problems.append("implementation manifest implemented_core must be an object")
        core_manifest = {}
    for item_id, row in core_manifest.items():
        if item_id not in core_plan:
            problems.append("implementation manifest CORE item '{}' is not planned (DELETE items must stay out)".format(item_id))
            continue
        if not isinstance(row, dict):
            problems.append("implementation manifest CORE item '{}' must be an object".format(item_id))
            continue
        if row.get("stage") != core_plan[item_id]:
            problems.append("implementation manifest CORE item '{}' stage must be {}".format(item_id, core_plan[item_id]))
        if not isinstance(row.get("component"), str) or not row["component"].strip():
            problems.append("implementation manifest CORE item '{}' needs a component".format(item_id))
        if row.get("status") not in ("planned", "in_progress", "complete"):
            problems.append("implementation manifest CORE item '{}' status must be planned, in_progress, or complete".format(item_id))

    if stage_id == "W6":
        required_core = slice_core
        required_label = "vertical-slice"
    else:
        required_core = set(core_plan)
        required_label = "full implementation"
    for item_id in sorted(required_core):
        row = core_manifest.get(item_id)
        if not isinstance(row, dict):
            problems.append("{} CORE item '{}' is missing from implementation manifest".format(required_label, item_id))
        elif row.get("status") != "complete":
            problems.append("{} CORE item '{}' must have status complete".format(required_label, item_id))

    supporting_manifest = manifest.get("supporting")
    if not isinstance(supporting_manifest, dict):
        problems.append("implementation manifest supporting must be an object")
        supporting_manifest = {}
    for item_id, row in supporting_manifest.items():
        if item_id not in supporting_plan:
            problems.append("implementation manifest SUPPORTING item '{}' is not planned".format(item_id))
            continue
        if not isinstance(row, dict) or row.get("placement") != supporting_plan[item_id]:
            problems.append("implementation manifest SUPPORTING item '{}' placement must match the plan".format(item_id))
    if stage_id == "W8":
        for item_id in sorted(set(supporting_plan) - set(supporting_manifest)):
            problems.append("SUPPORTING item '{}' is missing from implementation manifest".format(item_id))

    reference_manifest = manifest.get("reference")
    if not isinstance(reference_manifest, dict):
        problems.append("implementation manifest reference must be an object")
        reference_manifest = {}
    for item_id, row in reference_manifest.items():
        if item_id not in reference_plan:
            problems.append("implementation manifest REFERENCE item '{}' is not planned".format(item_id))
            continue
        if isinstance(row, dict) and row.get("placement") == "mainline":
            problems.append("REFERENCE item '{}' must not be marked mainline".format(item_id))
        elif not isinstance(row, dict) or row.get("placement") != reference_plan[item_id]:
            problems.append("implementation manifest REFERENCE item '{}' placement must match the plan".format(item_id))
    if stage_id == "W8":
        for item_id in sorted(set(reference_plan) - set(reference_manifest)):
            problems.append("REFERENCE item '{}' is missing from implementation manifest".format(item_id))
    return problems


def validate_asset_plan(folder: Path, manifest: Optional[Dict[str, Any]], evidence_ids: set) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    data, problems = fenced_yaml(folder / "design/asset-plan.md")
    if data is None:
        return None, problems
    assets = data.get("assets")
    if not isinstance(assets, list):
        return data, problems + ["asset plan must define an assets list"]
    inventory = manifest.get("figures", []) if isinstance(manifest, dict) and isinstance(manifest.get("figures"), list) else []
    paper_figure_ids = {item.get("id") for item in inventory if isinstance(item, dict) and isinstance(item.get("id"), str)}
    planned_figure_ids = [item.get("paper_figure_id") for item in assets if isinstance(item, dict) and isinstance(item.get("paper_figure_id"), str)]
    for figure_id in paper_figure_ids:
        count = planned_figure_ids.count(figure_id)
        if count != 1:
            problems.append("source visual '{}' must have exactly one asset-plan decision".format(figure_id))
    decisions = {"USE_DIRECTLY", "CROP_AND_USE", "REDRAW_FROM_PAPER", "REFERENCE_ONLY", "DO_NOT_USE"}
    public_decisions = {"USE_DIRECTLY", "CROP_AND_USE", "REDRAW_FROM_PAPER"}
    allowed_asset_types = {"ARCHITECTURE", "PIPELINE", "ALGORITHM", "MECHANISM", "RESULT", "ABLATION", "DATASET_EXAMPLE", "QUALITATIVE_RESULT", "LOW_VALUE"}
    seen = set()
    for item in assets:
        if not isinstance(item, dict):
            problems.append("asset-plan entries must be mappings")
            continue
        item_id = item.get("id")
        if not isinstance(item_id, str) or not item_id.strip():
            problems.append("asset-plan entry needs an ID")
        elif item_id in seen:
            problems.append("asset plan has duplicate ID '{}'".format(item_id))
        else:
            seen.add(item_id)
        decision = item.get("decision")
        if not isinstance(decision, str) or decision not in decisions:
            problems.append("asset '{}' has invalid decision '{}'".format(item_id, decision))
            continue
        if not isinstance(item.get("type"), str) or item.get("type") not in allowed_asset_types:
            problems.append("asset '{}' has unknown type '{}'".format(item_id, item.get("type")))
        if decision in public_decisions:
            required = ("paper_figure_id", "page", "caption", "source_paper_version", "source_location", "source_locator", "teaching_role", "attribution", "reuse_rights", "processing", "derivative_path", "web_path", "explanation")
            for key in required:
                if not isinstance(item.get(key), str) or not item[key].strip():
                    problems.append("selected asset '{}' is missing {}".format(item_id, key))
            source_path = item.get("source_path")
            path_issue = path_problem(source_path)
            if path_issue:
                problems.append("selected asset '{}' source_path {}".format(item_id, path_issue))
            elif not (folder / source_path).is_file():
                problems.append("selected source asset is missing: {}".format(source_path))
            derivative_path = item.get("derivative_path")
            path_issue = path_problem(derivative_path)
            if path_issue:
                problems.append("selected asset '{}' derivative_path {}".format(item_id, path_issue))
            web_path = item.get("web_path")
            path_issue = path_problem(web_path)
            if path_issue:
                problems.append("selected asset '{}' web_path {}".format(item_id, path_issue))
            rights = str(item.get("reuse_rights", "")).lower()
            if not rights or re.search(r"unclear|pending|unknown|unverified|not checked|permission needed", rights):
                problems.append("selected asset '{}' has no approved reuse-rights basis".format(item_id))
        elif decision in ("REFERENCE_ONLY", "DO_NOT_USE") and (not isinstance(item.get("reason"), str) or not item["reason"].strip()):
            problems.append("asset '{}' needs a reason for {}".format(item_id, decision))
        refs = item.get("evidence_refs", [])
        if not isinstance(refs, list):
            problems.append("asset '{}' evidence_refs must be a list".format(item_id))
        else:
            for reference in refs:
                if not isinstance(reference, str) or reference not in evidence_ids:
                    problems.append("asset '{}' references unknown evidence ID '{}'".format(item_id, reference))
    if paper_figure_ids != set(planned_figure_ids):
        unregistered = sorted(str(item) for item in set(planned_figure_ids) - paper_figure_ids)
        if unregistered:
            problems.append("asset plan refers to unknown paper figures: {}".format(", ".join(unregistered)))
    return data, problems


def validate_asset_materialization(
    folder: Path,
    manifest: Optional[Dict[str, Any]],
    evidence_ids: set,
    source_root: Optional[Path] = None,
) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    data, problems = validate_asset_plan(folder, manifest, evidence_ids)
    if not isinstance(data, dict) or not isinstance(data.get("assets"), list):
        return data, problems
    selected = [
        item for item in data["assets"]
        if isinstance(item, dict) and item.get("decision") in ("USE_DIRECTLY", "CROP_AND_USE", "REDRAW_FROM_PAPER")
    ]
    for item in selected:
        item_id = item.get("id", "?")
        derivative_path = item.get("derivative_path")
        if isinstance(derivative_path, str) and not path_problem(derivative_path) and not (folder / derivative_path).is_file():
            problems.append("selected web derivative is missing: {}".format(derivative_path))
        web_path = item.get("web_path")
        if isinstance(web_path, str) and not path_problem(web_path):
            local_web_asset = (source_root or folder / "web/enhanced") / web_path
            if not local_web_asset.is_file():
                problems.append("selected asset '{}' is missing from the configured release source: {}".format(item_id, web_path))
    if selected:
        readme = (source_root or (folder / "web/enhanced")) / "README.md"
        source_label = source_root.relative_to(folder).as_posix() if source_root else "web/enhanced"
        if not readme.is_file():
            problems.append("{} is missing asset provenance README.md".format(source_label))
        else:
            readme_text = readme.read_text(encoding="utf-8")
            if not re.search(r"asset\s+(provenance|sources)|image\s+(provenance|sources)", readme_text, re.IGNORECASE):
                problems.append("{} README.md must document asset provenance".format(source_label))
    return data, problems


def v3_stage_completion_problems(
    folder: Path,
    stage_id: str,
    config: Dict[str, Any],
    require_w2_execution_model: bool = False,
) -> List[str]:
    problems: List[str] = []
    paper = config.get("paper", {})
    if stage_id == "W0":
        if not paper.get("source_type", "").strip():
            problems.append("paper.source_type must be recorded")
        if not paper.get("source_location", "").strip():
            problems.append("paper.source_location must be recorded")
        if not paper.get("authors"):
            problems.append("paper.authors must be recorded")
        if not paper.get("venue", "").strip() and paper.get("year") is None:
            problems.append("paper.venue or paper.year must be recorded")
        return problems
    if stage_id == "W1":
        manifest, problems = v3_cache_data(folder)
        source_record = manifest.get("paper") if isinstance(manifest, dict) else None
        if isinstance(source_record, dict):
            for key in ("title", "authors", "venue", "year", "source_type", "source_location", "source_hash"):
                expected = config.get("title") if key == "title" else paper.get(key)
                if source_record.get(key) != expected:
                    problems.append("source-cache manifest paper.{} does not match paper.yaml".format(key))
        return problems
    if stage_id == "W2":
        path = folder / "research/paper-model.md"
        required = ("Core Explanation", "Problem", "Core Insight", "Prerequisites", "Objects and Variables", "Architecture and Ownership", "Data Flow", "State and Time", "Training", "Inference / Runtime", "Core Equations", "Results", "Limitations")
        if not path.is_file():
            return ["research/paper-model.md is missing"]
        text = path.read_text(encoding="utf-8")
        for section in required:
            if not re.search(r"^##\s+{}\s*$".format(re.escape(section)), text, re.MULTILINE):
                problems.append("paper-model is missing section '{}'".format(section))
                continue
            body = markdown_section(text, section)
            normalized = re.sub(r"[`*_>#-]", "", body).strip()
            lower_body = normalized.lower()
            prompt_only = any(lower_body.startswith(prompt) for prompt in (
                "in one short paragraph:", "describe components", "input → ...",
                "for papers with training", "separate author-stated limits",
            ))
            if not normalized or prompt_only or re.fullmatch(r"\|?\s*(concept|object / variable).*", normalized, re.IGNORECASE):
                problems.append("paper-model section '{}' is empty or still a template prompt".format(section))
        if require_w2_execution_model:
            problems.extend(v3_w2_execution_model_problems(text))
        return problems
    if stage_id == "W3":
        manifest, cache_problems = v3_cache_data(folder)
        problems.extend(cache_problems)
        evidence_ids, entries, registry_problems = evidence_registry_ids_v3(folder)
        problems.extend(registry_problems)
        if not entries:
            problems.append("evidence registry must contain claim-level evidence")
        allowed_evidence_types = {"PAPER_FACT", "PAPER_RESULT", "AUTHOR_INTERPRETATION", "OUR_INTERPRETATION", "IMPLEMENTATION_MAPPING", "GENERAL_BACKGROUND", "TEACHING_EXAMPLE"}
        for entry_id, entry in entries.items():
            if not isinstance(entry.get("claim"), str) or not entry["claim"].strip():
                problems.append("evidence entry '{}' is missing claim".format(entry_id))
            for key in ("type", "source_locator", "conditions", "allowed_wording"):
                if not isinstance(entry.get(key), str) or not entry[key].strip():
                    problems.append("evidence entry '{}' is missing {}".format(entry_id, key))
            if not isinstance(entry.get("type"), str) or entry.get("type") not in allowed_evidence_types:
                problems.append("evidence entry '{}' has unknown type '{}'".format(entry_id, entry.get("type")))
        _assets, asset_problems = validate_asset_plan(folder, manifest, evidence_ids)
        problems.extend(asset_problems)
        return problems
    if stage_id == "W4":
        evidence_ids, _entries, evidence_problems = evidence_registry_ids_v3(folder)
        _data, spine_problems = v3_priority_data(folder, evidence_ids)
        return evidence_problems + spine_problems
    if stage_id == "W5":
        path = folder / "design/implementation-plan.md"
        if not path.is_file():
            return ["design/implementation-plan.md is missing"]
        text = path.read_text(encoding="utf-8")
        for heading in ("Primary Spine Mapping", "Reusable Pattern Library", "Vertical Slice (W6)", "Vertical Slice Review (W7)"):
            if not re.search(r"^#{{2,3}}\s+{}\s*$".format(re.escape(heading)), text, re.MULTILINE):
                problems.append("implementation-plan is missing section '{}'".format(heading))
        evidence_ids, _entries, evidence_problems = evidence_registry_ids_v3(folder)
        problems.extend(evidence_problems)
        _plan, implementation_problems = v3_implementation_data(folder, evidence_ids)
        problems.extend(implementation_problems)
        return problems
    if stage_id in ("W6", "W8"):
        try:
            web = resolve_upstream_source(folder, config)
        except PaperError as exc:
            return [str(exc)]
        web_label = web.relative_to(folder).as_posix()
        package = web / "package.json"
        if not package.is_file():
            problems.append("{}/package.json is missing".format(web_label))
        elif stage_id == "W8" and not (web / "package-lock.json").is_file():
            problems.append("{}/package-lock.json is missing".format(web_label))
        if not any((web / path).is_file() for path in ("src/App.tsx", "src/main.tsx")):
            problems.append("{} needs src/App.tsx or src/main.tsx".format(web_label))
        evidence_ids, _entries, evidence_problems = evidence_registry_ids_v3(folder)
        problems.extend(evidence_problems)
        implementation_plan, implementation_problems = v3_implementation_data(folder, evidence_ids)
        problems.extend(implementation_problems)
        if isinstance(implementation_plan, dict):
            problems.extend(v3_implementation_coverage(folder, stage_id, implementation_plan, config))
        if stage_id == "W8":
            source_manifest, source_problems = v3_cache_data(folder)
            problems.extend(source_problems)
            _assets, asset_problems = validate_asset_materialization(
                folder, source_manifest, evidence_ids, source_root=web,
            )
            problems.extend(asset_problems)
        return problems
    if stage_id == "W7":
        plan = folder / "design/implementation-plan.md"
        if not marker_present(plan, "Vertical Slice Review: PASS"):
            problems.append("implementation-plan must record Vertical Slice Review: PASS")
        return problems
    if stage_id == "W9":
        final_check = folder / "audit/final-check.md"
        if not marker_present(final_check, "Overall: PASS"):
            problems.append("audit/final-check.md must contain Overall: PASS")
        return problems
    if stage_id == "W10":
        # The official PaperSkill import and preflight run in the PaperSkill checkout.
        # This stage records the user's completed release action; it has no local artifact gate.
        return problems
    return problems


def v3_cross_reference_problems(
    folder: Path,
    stage_index: int,
    warnings: Optional[List[str]] = None,
) -> List[str]:
    problems: List[str] = []
    manifest: Optional[Dict[str, Any]] = None
    evidence_ids: set = set()
    if stage_index >= STAGE_IDS.index("W1"):
        manifest, cache_problems = v3_cache_data(folder)
        problems.extend(cache_problems)
    if stage_index >= STAGE_IDS.index("W3"):
        evidence_ids, _entries, evidence_problems = evidence_registry_ids_v3(folder)
        problems.extend(evidence_problems)
        _assets, asset_problems = validate_asset_plan(folder, manifest, evidence_ids)
        problems.extend(asset_problems)
    if stage_index >= STAGE_IDS.index("W4"):
        _spine, spine_problems = v3_priority_data(folder, evidence_ids)
        problems.extend(spine_problems)
    if stage_index >= STAGE_IDS.index("W5") and warnings is not None:
        # Re-read the implementation plan only for its non-blocking maturity warnings;
        # its problems are already reported by the W5/W6/W8 artifact checks.
        _plan, _implementation_problems = v3_implementation_data(folder, evidence_ids, warnings=warnings)
    return problems


def cmd_check_v3(folder: Path, config: Dict[str, Any], paper_id: str) -> int:
    states = stage_states(config)
    failures: List[str] = []
    warnings: List[str] = []
    for stage_id, _key, label in STAGES:
        print("[STAGE] {} {}: {}".format(stage_id, label, states[stage_id].upper()))
        if stage_id == "W10":
            print("[MANUAL] Official PaperSkill preflight is recorded by the user after it passes.")
            continue
        kind, relative = V3_STAGE_ARTIFACTS[stage_id]
        artifact_label = relative
        if stage_id in ("W6", "W8"):
            try:
                configured_source = resolve_upstream_source(folder, config)
                target = configured_source / "package.json"
                kind = "file"
                artifact_label = "{}/package.json".format(configured_source.relative_to(folder).as_posix())
            except PaperError:
                target = folder / relative
                artifact_label = "configured release source ({})".format(relative)
        elif stage_id not in ("W6", "W8"):
            target = folder / relative
        exists = target.is_dir() and any(target.iterdir()) if target.is_dir() else target.is_file()
        print("[{}] {} artifact: {}".format("PRESENT" if exists else "MISSING", stage_id, artifact_label))
        issues = v3_stage_completion_problems(folder, stage_id, config)
        if states[stage_id] == "complete":
            failures.extend("{}: {}".format(stage_id, issue) for issue in issues)
        elif stage_id == config["workflow"]["current_stage"]:
            warnings.extend("{}: {}".format(stage_id, issue) for issue in issues)
    current_stage_index = STAGE_IDS.index(config["workflow"]["current_stage"])
    for issue in v3_cross_reference_problems(folder, current_stage_index, warnings):
        if not any(issue in warning for warning in warnings) and not any(issue in failure for failure in failures):
            warnings.append(issue)
    warnings.extend(hygiene_warnings(folder))
    failures.extend(hygiene_failures(paper_id))
    for warning in warnings:
        print("[WARN] {}".format(warning))
    for failure in failures:
        print("[FAIL] {}".format(failure))
    print("CHECK {}".format("FAILED" if failures else "PASS"))
    return 1 if failures else 0


def cmd_check(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    errors = validate_config(config, args.paper_id)
    if errors:
        for error in errors:
            print("[FAIL] {}".format(error))
        return 1
    return cmd_check_v3(folder, config, args.paper_id)


def cmd_release_check(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    errors = validate_config(config, args.paper_id)
    if errors:
        print("NOT READY\n\nBLOCKERS:")
        for error in errors:
            print("- Invalid paper.yaml: {}".format(error))
        return 1

    blockers: List[str] = []
    for stage_id, key, label in STAGES:
        if config["workflow"]["stages"][key]["status"] != "complete":
            blockers.append("{} {} not complete".format(stage_id, label))
        blockers.extend("{}: {}".format(stage_id, problem) for problem in v3_stage_completion_problems(folder, stage_id, config))
    if blockers:
        print("NOT READY\n\nBLOCKERS:")
        for blocker in dict.fromkeys(blockers):
            print("- {}".format(blocker))
        return 1
    print("RELEASE READY")
    return 0

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage PaperSkillWork Workflow v3 paper workspaces.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    new = subparsers.add_parser("new", help="create a paper workspace from the standard templates")
    new.add_argument("paper_id")
    new.add_argument("--title", required=True)
    new.add_argument("--url", default="")
    new.add_argument("--arxiv-id", default="")
    new.add_argument("--author", action="append", default=[], help="paper author; repeat for multiple authors")
    new.add_argument("--venue", default="")
    new.add_argument("--year", type=int)
    new.add_argument("--source-type", default="")
    new.add_argument("--source-location", default="")
    new.add_argument("--source-hash", default="")
    new.set_defaults(func=cmd_new)

    scaffold = subparsers.add_parser("scaffold-kit", help="copy the selected Reusable Kit source into a paper's enhanced project")
    scaffold.add_argument("paper_id")
    scaffold.add_argument("--preset", choices=("continual-learning",))
    scaffold.add_argument("--select", default="", help="comma-separated asset names; copies only their source closure")
    scaffold.add_argument("--dry-run", action="store_true", help="print the exact file closure without writing")
    scaffold.add_argument(
        "--allow-unapproved",
        action="store_true",
        help="copy components whose registry status is candidate instead of approved",
    )
    scaffold.set_defaults(func=cmd_scaffold_kit)

    for name, help_text, handler in (
        ("status", "show paper metadata, workflow states, and artifacts", cmd_status),
        ("check", "run mechanical workspace checks", cmd_check),
        ("release-check", "check whether the paper meets release prerequisites", cmd_release_check),
    ):
        command = subparsers.add_parser(name, help=help_text)
        command.add_argument("paper_id")
        command.set_defaults(func=handler)

    stage = subparsers.add_parser("stage", help="read or explicitly update a Workflow v3 stage")
    stage.add_argument("paper_id")
    stage.add_argument("stage", nargs="?", choices=STAGE_IDS)
    stage.add_argument("status", nargs="?", choices=("in_progress", "complete"))
    stage.add_argument("--reviewed-by", help="human reviewer name, required only for W2, W4, W7, and W9 completion")
    stage.add_argument("--note", help="human review note, required only for W2, W4, W7, and W9 completion")
    stage.set_defaults(func=cmd_stage)

    release_info = subparsers.add_parser("release-info", help="print read-only release metadata as JSON")
    release_info.add_argument("paper_id")
    release_info.add_argument("--json", action="store_true", required=True, help="emit the release metadata as JSON")
    release_info.set_defaults(func=cmd_release_info)

    paths = subparsers.add_parser("paths", help="show standard workspace paths")
    paths.add_argument("paper_id")
    paths.add_argument("--json", action="store_true")
    paths.set_defaults(func=cmd_paths)

    open_web = subparsers.add_parser("open", help="install web dependencies and open a paper tutorial locally")
    open_web.add_argument("paper_id")
    open_web.add_argument("--edition", choices=("enhanced", "final"), default="enhanced")
    open_web.set_defaults(func=cmd_open)
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except KeyboardInterrupt:
        print("\nDevelopment server stopped.")
        return 130
    except PaperError as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    except OSError as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
