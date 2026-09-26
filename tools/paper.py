#!/usr/bin/env python3
"""Mechanical workspace and workflow checks for PaperSkillWork."""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

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
PAPER_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
UPSTREAM_PAPER_NAME_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
UPSTREAM_VERSION_RE = re.compile(r"^[a-z][a-z0-9]*[0-9]{4}(?:_[0-9]+)?$")
PLACEHOLDER_RE = re.compile(r"\{\{([A-Za-z0-9_]+)\}\}")
ALLOWED_PLACEHOLDERS = {"paper_id", "paper_title", "paper_url", "arxiv_id"}
STATUSES = {"pending", "in_progress", "complete", "skipped", "legacy"}
GATES: List[Tuple[str, str, str]] = [
    ("G0", "G0_workspace", "Workspace + Learning Contract"),
    ("G1", "G1_research", "Paper Model"),
    ("G2", "G2_evidence_audit", "Evidence Registry"),
    ("G3", "G3_canonical", "Canonical Compatibility Baseline"),
    ("G4", "G4_narrative_design", "Learning Architecture"),
    ("G5", "G5_interaction_design", "Scene Specifications"),
    ("G6", "G6_enhanced", "Incremental Enhanced"),
    ("G7", "G7_release", "Learning + Evidence + Engineering Audit"),
]
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
LEGACY_GATE_LABELS = [
    "Workspace", "Research", "Evidence Audit", "Canonical", "Narrative Design",
    "Interaction Design", "Enhanced", "Final Audit & Release",
]
GATE_IDS = [gate[0] for gate in GATES]
GATE_BY_ID = {gate[0]: gate for gate in GATES}
LEGACY_GATE_ARTIFACTS = {
    "G0": ("file", "paper.yaml"),
    "G1": ("file", "research/01_review.md"),
    "G2": ("file", "research/02_evidence_audit.md"),
    "G3": ("dir", "web/canonical"),
    "G4": ("file", "design/storyboard.md"),
    "G5": ("file", "design/interaction-plan.md"),
    "G6": ("file", "web/enhanced/package.json"),
    "G7": ("file", "audit/content-check.md"),
}
TEMPLATE_OUTPUTS = {
    "paper.yaml": "paper.yaml",
    "learning-contract.md": "design/learning-contract.md",
    "paper-model.md": "research/01_paper_model.md",
    "evidence-registry.yaml": "research/02_evidence_registry.yaml",
    "terms.yaml": "knowledge/terms.yaml",
    "learning-architecture.md": "design/learning-architecture.md",
    "final-check.md": "audit/final-check.md",
    "release-check.md": "audit/release-check.md",
}
LEGACY_V2_TEMPLATE_PATHS = {
    "learning-contract.md": "legacy/v2/learning-contract.md",
    "paper-model.md": "legacy/v2/paper-model.md",
    "evidence-registry.yaml": "legacy/v2/evidence-registry.yaml",
    "terms.yaml": "legacy/v2/terms.yaml",
    "learning-architecture.md": "legacy/v2/learning-architecture.md",
    "final-check.md": "legacy/v2/final-check.md",
    "release-check.md": "legacy/v2/release-check.md",
}
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
V2_GATE_ARTIFACTS = {
    "G0": ("file", "design/learning-contract.md"),
    "G1": ("file", "research/01_paper_model.md"),
    "G2": ("file", "research/02_evidence_registry.yaml"),
    "G3": ("dir", "web/canonical"),
    "G4": ("file", "design/learning-architecture.md"),
    "G5": ("dir", "design/scenes"),
    "G6": ("file", "web/enhanced/package.json"),
    "G7": ("file", "audit/final-check.md"),
}
V2_ARTIFACTS = {
    "learning_contract": "design/learning-contract.md",
    "paper_model": "research/01_paper_model.md",
    "evidence_registry": "research/02_evidence_registry.yaml",
    "learning_architecture": "design/learning-architecture.md",
    "scenes_dir": "design/scenes",
    "terms": "knowledge/terms.yaml",
    "final_check": "audit/final-check.md",
    "release_check": "audit/release-check.md",
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
    "W10": ("dir", "html_output"),
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
    if isinstance(schema_version, bool) or schema_version not in (1, 2, 3):
        errors.append("schema_version must be 1, 2, or 3")
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
    elif schema_version != 3 and not paper["url"].strip():
        errors.append("paper.url must be non-empty")
    if isinstance(paper, dict) and "local_pdf" in paper and paper["local_pdf"] is not None:
        problem = path_problem(paper["local_pdf"])
        if problem:
            errors.append("paper.local_pdf {}".format(problem))

    workflow = config.get("workflow")
    if schema_version in (1, 2):
        if not isinstance(workflow, dict) or workflow.get("current_gate") not in GATE_IDS:
            errors.append("workflow.current_gate must be one of G0 through G7")
    elif not isinstance(workflow, dict) or workflow.get("current_stage") not in STAGE_IDS:
        errors.append("workflow.current_stage must be one of W0 through W10")
    if schema_version == 2 and isinstance(workflow, dict) and workflow.get("version") != 2:
        errors.append("workflow.version must be 2 for schema_version 2")
    if schema_version == 3 and isinstance(workflow, dict) and workflow.get("version") != 3:
        errors.append("workflow.version must be 3 for schema_version 3")

    if schema_version in (1, 2):
        gates = workflow.get("gates") if isinstance(workflow, dict) else None
        expected_keys = {item[1] for item in GATES}
        if not isinstance(gates, dict):
            errors.append("workflow.gates must be a mapping")
        else:
            missing = sorted(expected_keys - set(gates))
            extra = sorted(set(gates) - expected_keys)
            if missing:
                errors.append("workflow.gates is missing: {}".format(", ".join(missing)))
            if extra:
                errors.append("workflow.gates has unknown keys: {}".format(", ".join(extra)))
            for gate_id, gate_key, _label in GATES:
                entry = gates.get(gate_key)
                if not isinstance(entry, dict):
                    if gate_key not in missing:
                        errors.append("workflow.gates.{} must be a mapping".format(gate_key))
                    continue
                status = entry.get("status")
                if not isinstance(status, str) or status not in STATUSES:
                    errors.append("workflow.gates.{}.status must be one of: {}".format(gate_key, ", ".join(sorted(STATUSES))))
                if status == "skipped" and not (isinstance(entry.get("reason"), str) and entry["reason"].strip()):
                    errors.append("workflow.gates.{} skipped status requires a reason".format(gate_key))
                if status != "skipped" and "reason" in entry:
                    errors.append("workflow.gates.{}.reason is only valid when status is skipped".format(gate_key))
            if schema_version == 2 and any(
                isinstance(gates.get(key), dict) and gates[key].get("status") == "legacy"
                for _gate_id, key, _label in GATES
            ):
                errors.append("Workflow v2 gates cannot use legacy status")
            elif schema_version == 1 and configured_id != "phyagentos" and any(
                isinstance(gates.get(key), dict) and gates[key].get("status") == "legacy"
                for _gate_id, key, _label in GATES
            ):
                errors.append("legacy gate status is reserved for the PhyAgentOS Workflow v1 migration")
    elif schema_version == 3 and isinstance(workflow, dict):
        stages = workflow.get("stages")
        expected_keys = {item[1] for item in STAGES}
        if not isinstance(stages, dict):
            errors.append("workflow.stages must be a mapping")
        else:
            missing = sorted(expected_keys - set(stages))
            extra = sorted(set(stages) - expected_keys)
            if missing:
                errors.append("workflow.stages is missing: {}".format(", ".join(missing)))
            if extra:
                errors.append("workflow.stages has unknown keys: {}".format(", ".join(extra)))
            for stage_id, stage_key, _label in STAGES:
                entry = stages.get(stage_key)
                if not isinstance(entry, dict):
                    if stage_key not in missing:
                        errors.append("workflow.stages.{} must be a mapping".format(stage_key))
                    continue
                status = entry.get("status")
                if status not in ("pending", "in_progress", "complete"):
                    errors.append("workflow.stages.{}.status must be pending, in_progress, or complete".format(stage_key))
                if status == "complete":
                    if stage_id in HUMAN_REVIEW_STAGES:
                        if not isinstance(entry.get("reviewed_by"), str) or not entry["reviewed_by"].strip():
                            errors.append("workflow.stages.{}.reviewed_by is required for human-review stage {}".format(stage_key, stage_id))
                        if not isinstance(entry.get("note"), str) or not entry["note"].strip():
                            errors.append("workflow.stages.{}.note is required for human-review stage {}".format(stage_key, stage_id))
                    elif entry.get("completed_by") != "automation":
                        # Existing v3 workspaces that explicitly recorded a human reviewer remain readable.
                        if not (isinstance(entry.get("reviewed_by"), str) and entry["reviewed_by"].strip()
                                and isinstance(entry.get("note"), str) and entry["note"].strip()):
                            errors.append("workflow.stages.{}.completed_by must be automation for stage {}".format(stage_key, stage_id))
                    if entry.get("completed_by") not in (None, "automation"):
                        errors.append("workflow.stages.{}.completed_by must be automation when present".format(stage_key))

    for group_name in ("artifacts", "web"):
        group = config.get(group_name)
        if not isinstance(group, dict):
            errors.append("{} must be a mapping".format(group_name))
            continue
        for key, value in group.items():
            problem = path_problem(value)
            if problem:
                errors.append("{}.{} {}".format(group_name, key, problem))

    if schema_version == 2:
        artifacts = config.get("artifacts")
        if isinstance(artifacts, dict):
            missing_artifacts = sorted(set(V2_ARTIFACTS) - set(artifacts))
            if missing_artifacts:
                errors.append("artifacts is missing: {}".format(", ".join(missing_artifacts)))
            for key, expected in V2_ARTIFACTS.items():
                if key in artifacts and artifacts[key] != expected:
                    errors.append("artifacts.{} must be {}".format(key, expected))

    if schema_version == 3:
        artifacts = config.get("artifacts")
        if isinstance(artifacts, dict):
            missing_artifacts = sorted(set(V3_ARTIFACTS) - set(artifacts))
            if missing_artifacts:
                errors.append("artifacts is missing: {}".format(", ".join(missing_artifacts)))
            for key, expected in V3_ARTIFACTS.items():
                if key in artifacts and artifacts[key] != expected:
                    errors.append("artifacts.{} must be {}".format(key, expected))
        release = config.get("release")
        if not isinstance(release, dict):
            errors.append("release must be a mapping")
        else:
            release_fields = ("upstream_paper_name", "upstream_version", "output")
            if any(not isinstance(release.get(key), str) for key in release_fields):
                errors.append("release.upstream_paper_name, release.upstream_version, and release.output must be strings")
            else:
                values = [release[key].strip() for key in release_fields]
                if any(values) and not all(values):
                    errors.append("release upstream identifiers and output must be configured together")
                elif all(values):
                    paper_name, version, output = values
                    if not UPSTREAM_PAPER_NAME_RE.fullmatch(paper_name):
                        errors.append("release.upstream_paper_name must be a lowercase underscore identifier")
                    if not UPSTREAM_VERSION_RE.fullmatch(version):
                        errors.append("release.upstream_version must match the upstream version naming rule")
                    problem = path_problem(output)
                    if problem:
                        errors.append("release.output {}".format(problem))
                    elif output.replace("\\", "/") != "html_output/{}/{}".format(paper_name, version):
                        errors.append("release.output must equal html_output/<upstream_paper_name>/<upstream_version>")
        if isinstance(paper, dict):
            if not isinstance(paper.get("authors"), list) or any(not isinstance(author, str) for author in paper.get("authors", [])):
                errors.append("paper.authors must be a list of strings")
            if paper.get("year") is not None and (isinstance(paper.get("year"), bool) or not isinstance(paper.get("year"), int)):
                errors.append("paper.year must be an integer or null")
            for key in ("venue", "source_type", "source_location", "source_hash"):
                if not isinstance(paper.get(key), str):
                    errors.append("paper.{} must be a string".format(key))
        if not isinstance(config.get("web"), dict) or config.get("web", {}).get("enhanced") != "web/enhanced":
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


def marker_present(path: Path, marker: str) -> bool:
    if not path.is_file():
        return False
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return False
    pattern = r"^\s*(?:(?:Content|Release) Check Status\s*:\s*)?{}\s*$".format(re.escape(marker))
    return re.search(pattern, text, re.IGNORECASE | re.MULTILINE) is not None


def artifact_map(config: Dict[str, Any]) -> Dict[str, Tuple[str, str]]:
    return V2_GATE_ARTIFACTS if config.get("schema_version") == 2 else LEGACY_GATE_ARTIFACTS


def artifact_satisfied(folder: Path, gate_id: str, config: Dict[str, Any]) -> Tuple[bool, str]:
    kind, relative = artifact_map(config)[gate_id]
    target = folder / relative
    if kind == "dir":
        return target.is_dir() and any(target.iterdir()), relative
    if not target.is_file():
        return False, relative
    if gate_id == "G2" and config.get("schema_version") == 2:
        try:
            return isinstance(load_yaml(target), dict), relative
        except PaperError:
            return False, relative
    if gate_id in ("G0", "G1", "G2", "G4"):
        try:
            return bool(target.read_text(encoding="utf-8").strip()), relative
        except (OSError, UnicodeError):
            return False, relative
    return True, relative


def gate_completion_problems(folder: Path, gate_id: str, config: Dict[str, Any]) -> List[str]:
    satisfied, relative = artifact_satisfied(folder, gate_id, config)
    if not satisfied:
        return ["required artifact missing or empty: {}".format(relative)]
    if gate_id == "G5" and config.get("schema_version") == 2:
        scene_problems = scene_acceptance_problems(folder)
        if scene_problems:
            return scene_problems
    if gate_id == "G0" and config.get("schema_version") == 1:
        url_file = folder / "source/paper.url"
        if not url_file.is_file() or not url_file.read_text(encoding="utf-8").strip():
            return ["required artifact missing or empty: source/paper.url"]
    if gate_id == "G0" and config.get("schema_version") == 2:
        url_file = folder / "source/paper.url"
        if not url_file.is_file() or not url_file.read_text(encoding="utf-8").strip():
            return ["required artifact missing or empty: source/paper.url"]
    if gate_id == "G7":
        check_path = folder / ("audit/final-check.md" if config.get("schema_version") == 2 else "audit/content-check.md")
        check_marker = "Overall: PASS" if config.get("schema_version") == 2 else "PASS"
        if not marker_present(check_path, check_marker):
            return ["{} must contain {}".format(check_path.relative_to(folder).as_posix(), check_marker)]
        if not marker_present(folder / "audit/release-check.md", "READY"):
            return ["audit/release-check.md must contain READY"]
    return []


def quote_yaml(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


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
        folder.mkdir(parents=False)
        for directory in (
            "source", "source-cache/figures", "research", "design", "audit",
            "assets/figures/original", "assets/figures/web", "web/enhanced",
        ):
            (folder / directory).mkdir(parents=True, exist_ok=True)
        for relative, content in rendered.items():
            target = folder / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
    except OSError as exc:
        raise PaperError("Could not create workspace papers/{}: {}".format(args.paper_id, exc))

    print("Created papers/{}".format(args.paper_id))
    print("Next: complete W0 source metadata and W1's full-paper source cache, then use $paper-review for W2.")
    return 0


def cmd_migrate_v2(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") != 1:
        raise PaperError("Only schema_version 1 workspaces can be migrated to v2")

    paper_config_path = folder / "paper.yaml"
    legacy_paper_config = paper_config_path.read_bytes()
    legacy_states = gate_states(config)
    legacy_config = dict(config.get("artifacts", {}))
    detected: Dict[str, str] = {}
    for _gate_id, (_kind, relative) in LEGACY_GATE_ARTIFACTS.items():
        if (folder / relative).exists():
            detected[relative] = "migration/legacy-paper-v1.yaml" if relative == "paper.yaml" else relative
    for relative in ("research/03_terms.md", "audit/release-check.md"):
        if (folder / relative).exists():
            detected[relative] = "audit/legacy/release-check-v1.md" if relative == "audit/release-check.md" else relative

    config["title"] = " ".join(config["title"].split())
    config["schema_version"] = 2
    workflow = config["workflow"]
    workflow["version"] = 2
    workflow["current_gate"] = "G0"
    workflow["gates"] = {key: {"status": "pending"} for _gate_id, key, _label in GATES}
    config["artifacts"] = dict(V2_ARTIFACTS)
    config["legacy_artifacts"] = detected
    config["migration_v2"] = {
        "from_schema_version": 1,
        "legacy_gate_states": legacy_states,
        "legacy_artifact_config": legacy_config,
        "legacy_paper_config_backup": "migration/legacy-paper-v1.yaml",
    }

    replacements = {
        "paper_id": args.paper_id,
        "paper_title": " ".join(config["title"].split()),
        "paper_url": quote_yaml(config["paper"]["url"]),
        "arxiv_id": quote_yaml(str(config.get("paper", {}).get("arxiv_id", "") or "")),
    }
    created: List[str] = []
    preserved: List[str] = []
    directories = ("source", "research", "design/scenes", "knowledge", "audit", "audit/legacy", "migration")
    for relative in directories:
        (folder / relative).mkdir(parents=True, exist_ok=True)

    paper_backup = folder / "migration/legacy-paper-v1.yaml"
    if not paper_backup.exists():
        paper_backup.write_bytes(legacy_paper_config)
        created.append("migration/legacy-paper-v1.yaml")
    else:
        preserved.append("migration/legacy-paper-v1.yaml")

    for template_name, relative in TEMPLATE_OUTPUTS.items():
        if template_name == "paper.yaml":
            continue
        target = folder / relative
        if target.exists():
            if template_name == "release-check.md":
                legacy_release_copy = folder / "audit/legacy/release-check-v1.md"
                if not legacy_release_copy.exists():
                    legacy_release_copy.write_bytes(target.read_bytes())
                    created.append("audit/legacy/release-check-v1.md")
                else:
                    preserved.append("audit/legacy/release-check-v1.md")
                target.write_text(
                    render_template(template_name, replacements, LEGACY_V2_TEMPLATE_PATHS[template_name]),
                    encoding="utf-8",
                )
                created.append(relative)
                continue
            preserved.append(relative)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(
            render_template(template_name, replacements, LEGACY_V2_TEMPLATE_PATHS[template_name]),
            encoding="utf-8",
        )
        created.append(relative)

    url_path = folder / "source/paper.url"
    if not url_path.exists():
        url_path.write_text(str(config["paper"]["url"]).strip() + "\n", encoding="utf-8")
        created.append("source/paper.url")
    else:
        preserved.append("source/paper.url")

    report_path = folder / "audit/migration-v2.md"
    if not report_path.exists():
        lines = [
            "# Workflow v2 Migration Report",
            "",
            "Migration created v2 artifacts without deleting legacy research, design, Canonical, or Enhanced files.",
            "The v1 paper.yaml and release checklist are archived before their active paths move to v2. All v2 gates start pending.",
            "",
            "## Legacy gate states",
            "",
        ]
        lines.extend("- {}: {}".format(gate_id, state) for gate_id, state in legacy_states.items())
        lines.extend(["", "## Detected legacy artifacts", ""])
        lines.extend("- `{}` → `{}`".format(source, archived) for source, archived in detected.items())
        lines.extend(["", "## Created v2 artifacts", ""])
        lines.extend("- `{}`".format(path) for path in created)
        lines.extend(["", "## Preserved existing paths", ""])
        lines.extend("- `{}`".format(path) for path in preserved)
        report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        created.append("audit/migration-v2.md")
    else:
        preserved.append("audit/migration-v2.md")

    require_yaml()
    (folder / "paper.yaml").write_text(
        yaml.safe_dump(config, allow_unicode=True, sort_keys=False, default_flow_style=False), encoding="utf-8"
    )
    print("Migrated papers/{} to Workflow v2.".format(args.paper_id))
    print("Created: {}".format(", ".join(created) if created else "none"))
    print("Preserved: {}".format(", ".join(preserved) if preserved else "none"))
    print("Legacy gate states are recorded in migration_v2; all v2 gates are pending.")
    return 0


def gate_states(config: Dict[str, Any]) -> Dict[str, str]:
    gates = config["workflow"]["gates"]
    return {gate_id: gates[key]["status"] for gate_id, key, _label in GATES}


def stage_states(config: Dict[str, Any]) -> Dict[str, str]:
    stages = config["workflow"]["stages"]
    return {stage_id: stages[key]["status"] for stage_id, key, _label in STAGES}


def recommended_stage(states: Dict[str, str]) -> str:
    for stage_id, _key, label in STAGES:
        if states.get(stage_id) != "complete":
            return "{} {}".format(stage_id, label)
    return "No remaining stage"


def recommended_gate(states: Dict[str, str]) -> str:
    for gate_id, _key, label in GATES:
        if states.get(gate_id) not in ("complete", "skipped"):
            return "{} {}".format(gate_id, label)
    return "No remaining gate"


def cmd_status(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") == 3:
        states = stage_states(config)
        print("Paper: {}".format(args.paper_id))
        print("Title: {}".format(" ".join(config["title"].split())))
        print("Current Stage: {}".format(config["workflow"]["current_stage"]))
        print("\nStages")
        for stage_id, _key, label in STAGES:
            print("{} {:<36} {}".format(stage_id, label, states[stage_id].upper()))
        print("\nArtifacts")
        for stage_id, (_kind, relative) in V3_STAGE_ARTIFACTS.items():
            if stage_id == "W10":
                target = ROOT / config["release"]["output"]
                relative = config["release"]["output"]
            else:
                target = folder / relative
            exists = target.is_dir() and any(target.iterdir()) if target.is_dir() else target.is_file()
            print("[{}] {}".format("PRESENT" if exists else "MISSING", relative))
        print("Next Recommended Stage: {}".format(recommended_stage(states)))
        return 0
    states = gate_states(config)
    current = config["workflow"]["current_gate"]
    print("Paper: {}".format(args.paper_id))
    print("Title: {}".format(" ".join(config["title"].split())))
    print("Current Gate: {}".format(current))
    print("\nGates")
    labels = LEGACY_GATE_LABELS if config.get("schema_version") == 1 else [gate[2] for gate in GATES]
    for (gate_id, _key, _label), label in zip(GATES, labels):
        print("{} {:<26} {}".format(gate_id, label, states[gate_id].upper()))
    print("\nArtifacts")
    mapping = artifact_map(config)
    artifact_rows = [(gate_id, path, kind) for gate_id, (kind, path) in mapping.items()]
    artifact_rows.append(("G7", "audit/release-check.md", "file"))
    has_legacy = "legacy" in states.values()
    for gate_id, relative, kind in artifact_rows:
        target = folder / relative
        exists = target.is_dir() and any(target.iterdir()) if kind == "dir" and target.is_dir() else target.is_file()
        if exists:
            mark = "PRESENT"
        elif states[gate_id] == "legacy" or (gate_id == "G3" and states[gate_id] == "complete" and has_legacy):
            mark = "LEGACY"
        else:
            mark = "MISSING"
        print("[{}] {}".format(mark, relative))
    print("Next Recommended Gate: {}".format(recommended_gate(states)))
    return 0


def cmd_paths(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") == 3:
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
            "release_output": config["release"]["output"],
        }
        labels = [(key, key.replace("_", " ").title()) for key in values]
    elif config.get("schema_version") == 2:
        values = {
            "workspace": "papers/{}/".format(args.paper_id),
            "paper_pdf": "papers/{}/source/paper.pdf".format(args.paper_id),
            "learning_contract": "papers/{}/design/learning-contract.md".format(args.paper_id),
            "paper_model": "papers/{}/research/01_paper_model.md".format(args.paper_id),
            "evidence_registry": "papers/{}/research/02_evidence_registry.yaml".format(args.paper_id),
            "learning_architecture": "papers/{}/design/learning-architecture.md".format(args.paper_id),
            "scenes": "papers/{}/design/scenes".format(args.paper_id),
            "terms": "papers/{}/knowledge/terms.yaml".format(args.paper_id),
            "canonical": "papers/{}/web/canonical".format(args.paper_id),
            "enhanced": "papers/{}/web/enhanced".format(args.paper_id),
        }
        labels = [(key, key.replace("_", " ").title()) for key in values]
    else:
        values = {
        "workspace": "papers/{}".format(args.paper_id),
        "paper_pdf": "papers/{}/source/paper.pdf".format(args.paper_id),
        "review": "papers/{}/research/01_review.md".format(args.paper_id),
        "evidence_audit": "papers/{}/research/02_evidence_audit.md".format(args.paper_id),
        "storyboard": "papers/{}/design/storyboard.md".format(args.paper_id),
        "interaction_plan": "papers/{}/design/interaction-plan.md".format(args.paper_id),
        "canonical": "papers/{}/web/canonical".format(args.paper_id),
        "enhanced": "papers/{}/web/enhanced".format(args.paper_id),
        }
        labels = [
            ("workspace", "Workspace"), ("paper_pdf", "Paper PDF"), ("review", "Review"),
            ("evidence_audit", "Evidence Audit"), ("storyboard", "Storyboard"),
            ("interaction_plan", "Interaction Plan"), ("canonical", "Canonical"), ("enhanced", "Enhanced"),
        ]
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


def cmd_gate(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") == 3:
        raise PaperError("Workflow v3 uses 'stage <paper-id> W0..W10 <status>' instead of gate")
    if args.gate is None and args.status is None:
        print("Paper: {}".format(args.paper_id))
        print("Current Gate: {}".format(config["workflow"]["current_gate"]))
        labels = LEGACY_GATE_LABELS if config.get("schema_version") == 1 else [gate[2] for gate in GATES]
        for (gate_id, gate_key, _label), label in zip(GATES, labels):
            print("{} {:<26} {}".format(gate_id, label, config["workflow"]["gates"][gate_key]["status"].upper()))
        return 0
    if args.gate is None or args.status is None:
        raise PaperError("Provide both <gate> and <status> when changing a gate")
    if args.gate not in GATE_BY_ID:
        raise PaperError("Unknown gate '{}'; expected G0 through G7".format(args.gate))
    if args.status not in STATUSES:
        raise PaperError("Unknown status '{}'; expected: {}".format(args.status, ", ".join(sorted(STATUSES))))
    if args.status == "skipped" and not (args.reason and args.reason.strip()):
        raise PaperError("--reason is required when setting a gate to skipped")
    if args.status != "skipped" and args.reason:
        raise PaperError("--reason can only be used with skipped")

    problems: List[str] = []
    if args.status == "complete":
        problems.extend(gate_order_problems(config, args.gate))
        problems.extend(gate_completion_problems(folder, args.gate, config))
    if problems:
        raise PaperError("Cannot mark {} complete:\n- {}".format(args.gate, "\n- ".join(problems)))

    gate_key = GATE_BY_ID[args.gate][1]
    entry = config["workflow"]["gates"][gate_key]
    entry["status"] = args.status
    if args.status == "skipped":
        entry["reason"] = args.reason.strip()
    else:
        entry.pop("reason", None)
    if args.status == "in_progress":
        config["workflow"]["current_gate"] = args.gate
    elif args.status == "complete":
        index = GATE_IDS.index(args.gate)
        config["workflow"]["current_gate"] = GATE_IDS[min(index + 1, len(GATE_IDS) - 1)]
    validate_or_raise(config, args.paper_id)
    require_yaml()
    output = yaml.safe_dump(config, allow_unicode=True, sort_keys=False, default_flow_style=False)
    (folder / "paper.yaml").write_text(output, encoding="utf-8")
    print("Updated {} to {} for {}.".format(args.gate, args.status, args.paper_id))
    return 0


def cmd_stage(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") != 3:
        raise PaperError("stage applies to Workflow v3 workspaces only")
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
        problems.extend(v3_stage_completion_problems(folder, args.stage, config))
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


def directory_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    for item in sorted(candidate for candidate in path.rglob("*") if candidate.is_file()):
        digest.update(item.relative_to(path).as_posix().encode("utf-8"))
        digest.update(b"\0")
        with item.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    return digest.hexdigest()


def summarize_process(result: Any, temp_root: Optional[Path] = None) -> str:
    output = "\n".join(str(getattr(result, key, "") or "") for key in ("stdout", "stderr")).strip()
    if temp_root is not None:
        output = output.replace(str(temp_root), "<temporary-upstream>")
    output = ABSOLUTE_LOCAL_PATH_RE.sub("<local-path>", output)
    lines = [line.strip() for line in output.splitlines() if line.strip()]
    return " | ".join(lines[-3:])[-600:]


def save_upstream_report(folder: Path, report: Dict[str, Any]) -> None:
    path = folder / "audit/upstream-preflight.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def install_upstream_export(source: Path, target: Path, replace_output: bool) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_symlink():
        raise PaperError("release output must not be a symbolic link")
    if target.exists() and not replace_output:
        raise PaperError("release output already exists; rerun with --replace-output to replace this generated export")
    with tempfile.TemporaryDirectory(prefix="paper-export-stage-", dir=str(target.parent)) as staging_dir:
        staging = Path(staging_dir) / "export"
        shutil.copytree(source, staging)
        backup = Path(staging_dir) / "previous-export"
        if target.exists():
            os.replace(str(target), str(backup))
        try:
            os.replace(str(staging), str(target))
        except OSError:
            if backup.exists() and not target.exists():
                os.replace(str(backup), str(target))
            raise


def porcelain_changed_paths(output: str) -> List[str]:
    fields = output.split("\0")
    paths: List[str] = []
    index = 0
    while index < len(fields):
        entry = fields[index]
        index += 1
        if not entry:
            continue
        if len(entry) < 4:
            raise PaperError("could not parse isolated Git status")
        status, path = entry[:2], entry[3:]
        paths.append(path.replace("\\", "/"))
        if "R" in status or "C" in status:
            if index >= len(fields) or not fields[index]:
                raise PaperError("could not parse isolated Git rename status")
            paths.append(fields[index].replace("\\", "/"))
            index += 1
    return sorted(set(paths))


def run_upstream_check(
    folder: Path,
    config: Dict[str, Any],
    paperskill_repo: Path,
    participant: str,
    pinyin: str = "",
    github: str = "",
    replace_output: bool = False,
    process_runner: Optional[Callable[..., Any]] = None,
) -> int:
    runner = process_runner or subprocess.run
    release = config.get("release", {})
    paper = config.get("paper", {})
    report: Dict[str, Any] = {
        "upstream_commit": "",
        "temporary_commit": "",
        "paper_name": release.get("upstream_paper_name", ""),
        "version": release.get("upstream_version", ""),
        "changed_paths": [],
        "unexpected_paths": [],
        "commands": [],
        "status": "FAIL",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    paperskill_repo = paperskill_repo.expanduser().resolve()

    def invoke(command: List[str], cwd: Path, temp_root: Optional[Path] = None) -> Any:
        return runner(command, cwd=str(cwd), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)

    try:
        if not paperskill_repo.is_dir() or not (paperskill_repo / ".git").exists():
            raise PaperError("--paperskill-repo must point to a Git checkout")
        status = invoke([
            "git", "-c", "safe.directory={}".format(paperskill_repo), "-C", str(paperskill_repo),
            "status", "--porcelain", "--untracked-files=all",
        ], paperskill_repo)
        if status.returncode != 0:
            raise PaperError("cannot read the PaperSkill working-tree status: {}".format(summarize_process(status)))
        if str(getattr(status, "stdout", "") or "").strip():
            raise PaperError("PaperSkill checkout has uncommitted changes; upstream-check requires a clean upstream commit")
        head = invoke([
            "git", "-c", "safe.directory={}".format(paperskill_repo), "-C", str(paperskill_repo),
            "rev-parse", "HEAD",
        ], paperskill_repo)
        if head.returncode != 0:
            raise PaperError("cannot read the PaperSkill commit: {}".format(summarize_process(head)))
        upstream_commit = str(getattr(head, "stdout", "") or "").strip()
        if not re.fullmatch(r"[0-9a-fA-F]{40,64}", upstream_commit):
            raise PaperError("PaperSkill did not return a valid commit SHA")
        report["upstream_commit"] = upstream_commit

        paper_url = paper.get("url", "")
        if not isinstance(paper_url, str) or not paper_url.startswith("https://"):
            raise PaperError("paper.url must be an https:// URL for the official PaperSkill import")
        if not participant.strip() or "\n" in participant or "\r" in participant:
            raise PaperError("--participant must be a non-empty single line")
        if any(ord(character) > 127 for character in participant) and not pinyin.strip():
            raise PaperError("--pinyin is required for a non-ASCII --participant")

        with tempfile.TemporaryDirectory(prefix="paperskill-workflow-") as temp_dir:
            temp_root = Path(temp_dir)
            temp_repo = temp_root / "PaperSkill"
            clone = invoke([
                "git", "-c", "safe.directory={}".format(paperskill_repo), "clone", "--shared", "--no-hardlinks",
                str(paperskill_repo), str(temp_repo),
            ], temp_root, temp_root)
            if clone.returncode != 0:
                raise PaperError("could not create an isolated PaperSkill checkout: {}".format(summarize_process(clone, temp_root)))

            def isolated_git(arguments: List[str]) -> Any:
                return invoke(["git", "-C", str(temp_repo)] + arguments, temp_repo, temp_root)

            branch = isolated_git(["checkout", "-b", "paperskillwork-preflight"])
            if branch.returncode != 0:
                raise PaperError("could not create a temporary upstream test branch: {}".format(summarize_process(branch, temp_root)))
            for key, value in (("user.name", "PaperSkillWork Preflight"), ("user.email", "paperskillwork-preflight@example.invalid")):
                configured = isolated_git(["config", key, value])
                if configured.returncode != 0:
                    raise PaperError("could not set temporary Git identity: {}".format(summarize_process(configured, temp_root)))

            source = folder / "web/enhanced"
            if not source.is_dir():
                raise PaperError("web/enhanced is missing")
            source_copy = temp_repo / ".paperskillwork-source"
            shutil.copytree(source, source_copy, ignore=shutil.ignore_patterns("node_modules", "dist", "dist-ssr", ".vite"))

            npm = "npm.cmd" if os.name == "nt" else "npm"
            import_command = [
                npm, "run", "import", "--", source_copy.name, release["upstream_paper_name"],
                "--title", config["title"], "--paper-url", paper_url,
                "--participant", participant, "--version", release["upstream_version"],
            ]
            if pinyin.strip():
                import_command.extend(["--pinyin", pinyin.strip()])
            if github.strip():
                import_command.extend(["--github", github.strip()])
            if isinstance(paper.get("year"), int) and not isinstance(paper.get("year"), bool):
                import_command.extend(["--year", str(paper["year"])])
            if isinstance(paper.get("venue"), str) and paper["venue"].strip():
                import_command.extend(["--venue", paper["venue"].strip()])

            def run_official_command(label: str, command: List[str]) -> None:
                try:
                    result = invoke(command, temp_repo, temp_root)
                    exit_code = result.returncode
                    summary = summarize_process(result, temp_root)
                except OSError as exc:
                    exit_code = 127
                    summary = str(exc)
                report["commands"].append({"command": label, "exit_code": exit_code, "summary": summary})
                if exit_code != 0:
                    raise PaperError("{} failed: {}".format(label, summary or "exit code {}".format(exit_code)))

            run_official_command("npm run import", import_command)
            shutil.rmtree(source_copy, ignore_errors=True)

            imported = temp_repo / release["output"]
            if not imported.is_dir():
                raise PaperError("official import did not create the configured output directory")

            status = isolated_git(["status", "--porcelain=v1", "-z", "--untracked-files=all"])
            if status.returncode != 0:
                raise PaperError("cannot inspect isolated import changes: {}".format(summarize_process(status, temp_root)))
            changed_paths = porcelain_changed_paths(str(getattr(status, "stdout", "") or ""))
            report["changed_paths"] = changed_paths
            expected_prefix = release["output"].replace("\\", "/").strip("/") + "/"
            report["unexpected_paths"] = [path for path in changed_paths if not path.startswith(expected_prefix)]
            if report["unexpected_paths"]:
                raise PaperError("official import changed paths outside {}: {}".format(
                    expected_prefix.rstrip("/"), ", ".join(report["unexpected_paths"]),
                ))
            if not changed_paths:
                raise PaperError("official import produced no changed tutorial files to commit")

            added = isolated_git(["add", "-A", "--", release["output"]])
            if added.returncode != 0:
                raise PaperError("could not stage the imported tutorial: {}".format(summarize_process(added, temp_root)))
            staged_status = isolated_git(["status", "--porcelain=v1", "-z", "--untracked-files=all"])
            if staged_status.returncode != 0:
                raise PaperError("cannot inspect staged tutorial changes: {}".format(summarize_process(staged_status, temp_root)))
            staged_paths = porcelain_changed_paths(str(getattr(staged_status, "stdout", "") or ""))
            staged_unexpected = [path for path in staged_paths if not path.startswith(expected_prefix)]
            if staged_unexpected or not staged_paths:
                raise PaperError("temporary commit scope is invalid{}".format(
                    ": " + ", ".join(staged_unexpected) if staged_unexpected else " (no staged tutorial changes)",
                ))
            commit = isolated_git(["commit", "-m", "Preflight tutorial {}/{}".format(
                release["upstream_paper_name"], release["upstream_version"],
            )])
            if commit.returncode != 0:
                raise PaperError("could not create a temporary tutorial commit: {}".format(summarize_process(commit, temp_root)))
            temporary_head = isolated_git(["rev-parse", "HEAD"])
            if temporary_head.returncode != 0:
                raise PaperError("cannot read the temporary tutorial commit: {}".format(summarize_process(temporary_head, temp_root)))
            temporary_commit = str(getattr(temporary_head, "stdout", "") or "").strip()
            if not re.fullmatch(r"[0-9a-fA-F]{40,64}", temporary_commit) or temporary_commit == upstream_commit:
                raise PaperError("temporary tutorial commit is invalid or matches upstream HEAD")
            report["temporary_commit"] = temporary_commit

            after_commit = isolated_git(["status", "--porcelain=v1", "-z", "--untracked-files=all"])
            if after_commit.returncode != 0:
                raise PaperError("cannot verify the temporary checkout after commit: {}".format(summarize_process(after_commit, temp_root)))
            if porcelain_changed_paths(str(getattr(after_commit, "stdout", "") or "")):
                raise PaperError("temporary tutorial commit left uncommitted changes")

            run_official_command("npm run validate", [npm, "run", "validate"])
            run_official_command("npm run build:paper", [
                npm, "run", "build:paper", "--", "{}/{}".format(release["upstream_paper_name"], release["upstream_version"]),
            ])
            before_preflight_status = isolated_git(["status", "--porcelain=v1", "-z", "--untracked-files=all"])
            if before_preflight_status.returncode != 0:
                raise PaperError("cannot verify the isolated checkout before preflight: {}".format(summarize_process(before_preflight_status, temp_root)))
            build_changes = porcelain_changed_paths(str(getattr(before_preflight_status, "stdout", "") or ""))
            if build_changes:
                raise PaperError("validation/build left uncommitted changes before preflight: {}".format(", ".join(build_changes)))
            preflight_head = isolated_git(["rev-parse", "HEAD"])
            if preflight_head.returncode != 0 or str(getattr(preflight_head, "stdout", "") or "").strip() != temporary_commit:
                raise PaperError("upstream preflight is not positioned at the temporary tutorial commit")
            run_official_command("npm run preflight", [npm, "run", "preflight"])

            target = ROOT / release["output"]
            try:
                install_upstream_export(imported, target, replace_output)
                report["export_sha256"] = directory_sha256(target)
                report["status"] = "PASS"
            except (OSError, PaperError) as exc:
                report["error"] = str(exc)
        if report["status"] == "PASS":
            save_upstream_report(folder, report)
            completion_problems = v3_stage_completion_problems(folder, "W10", config)
            if completion_problems:
                report["status"] = "FAIL"
                report["error"] = "; ".join(completion_problems)
        save_upstream_report(folder, report)
    except (OSError, PaperError) as exc:
        report["error"] = str(exc)
        save_upstream_report(folder, report)
    print("Upstream preflight {}.".format(report["status"]))
    if report.get("error"):
        print("[FAIL] {}".format(report["error"]))
    for command in report["commands"]:
        print("[{}] {} (exit {})".format("PASS" if command["exit_code"] == 0 else "FAIL", command["command"], command["exit_code"]))
        if command.get("summary"):
            print("  {}".format(command["summary"]))
    return 0 if report["status"] == "PASS" else 1


def cmd_upstream_check(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") != 3:
        raise PaperError("upstream-check applies to Workflow v3 workspaces only")
    problems = stage_order_problems(config, "W10")
    if problems:
        raise PaperError("Cannot run upstream-check:\n- {}".format("\n- ".join(problems)))
    return run_upstream_check(
        folder,
        config,
        Path(args.paperskill_repo),
        args.participant,
        args.pinyin or "",
        args.github or "",
        args.replace_output,
    )


def gate_order_problems(config: Dict[str, Any], gate_id: str) -> List[str]:
    """Require every earlier gate to be accepted before completing this gate."""
    index = GATE_IDS.index(gate_id)
    gates = config["workflow"]["gates"]
    paper_id = config.get("id")
    problems = []
    for prior_id, prior_key, prior_label in GATES[:index]:
        status = gates[prior_key]["status"]
        if status in ("complete", "skipped"):
            continue
        if paper_id == "phyagentos" and status == "legacy":
            continue
        problems.append("{} {} is {}; must be complete or skipped".format(prior_id, prior_label, status))
    return problems


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


def registry_ids(registry: Dict[str, Any], label: str, nested_sections: bool = False) -> Tuple[set, List[str]]:
    ids = set()
    errors: List[str] = []
    if nested_sections:
        candidates = []
        for section, entries in registry.items():
            if not isinstance(entries, dict):
                errors.append("{} section '{}' must be a mapping".format(label, section))
                continue
            candidates.extend(entries.items())
    else:
        candidates = list(registry.items())
    for entry_id, entry in candidates:
            if not isinstance(entry_id, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", entry_id):
                errors.append("{} has invalid id '{}'".format(label, entry_id))
                continue
            if entry_id in ids:
                errors.append("{} has duplicate canonical knowledge id '{}'".format(label, entry_id))
            ids.add(entry_id)
            if not isinstance(entry, dict):
                errors.append("{} entry '{}' must be a mapping".format(label, entry_id))
    return ids, errors


def read_registry_ids(folder: Path, relative: str, label: str, nested_sections: bool = False) -> Tuple[set, List[str]]:
    path = folder / relative
    if not path.is_file():
        return set(), ["{} is missing: {}".format(label, relative)]
    try:
        registry = load_yaml(path)
    except PaperError as exc:
        return set(), ["{}: {}".format(label, exc)]
    return registry_ids(registry, label, nested_sections)


def scene_reference_problems(folder: Path) -> Tuple[List[Path], List[str]]:
    scene_dir = folder / "design/scenes"
    scenes = sorted(scene_dir.glob("*.md")) if scene_dir.is_dir() else []
    evidence_ids, evidence_errors = read_registry_ids(folder, "research/02_evidence_registry.yaml", "evidence registry", True)
    term_ids, term_errors = read_registry_ids(folder, "knowledge/terms.yaml", "term registry")
    problems = evidence_errors + term_errors
    duplicate_ids = evidence_ids & term_ids
    problems.extend("duplicate canonical knowledge id '{}' across registries".format(item) for item in sorted(duplicate_ids))
    terms_path = folder / "knowledge/terms.yaml"
    if terms_path.is_file():
        try:
            terms = load_yaml(terms_path)
            for term_id, term in terms.items():
                if not isinstance(term, dict):
                    continue
                prerequisites = term.get("prerequisites", [])
                if not isinstance(prerequisites, list):
                    problems.append("term '{}' prerequisites must be a list".format(term_id))
                else:
                    for prerequisite in prerequisites:
                        if prerequisite not in term_ids:
                            problems.append("term '{}' references unknown prerequisite '{}'".format(term_id, prerequisite))
                source_ref = term.get("source_ref")
                if source_ref is not None and source_ref not in evidence_ids:
                    problems.append("term '{}' references unknown evidence id '{}'".format(term_id, source_ref))
        except PaperError:
            pass
    for scene_path in scenes:
        try:
            markdown = scene_path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            problems.append("cannot read scene spec: {}".format(scene_path.relative_to(folder).as_posix()))
            continue
        paper_refs = re.findall(r"`([A-Za-z][A-Za-z0-9_-]*)`", markdown_section(markdown, "Paper Evidence"))
        term_refs = re.findall(r"`([A-Za-z][A-Za-z0-9_-]*)`", markdown_section(markdown, "Prerequisite Terms"))
        for reference in paper_refs:
            if reference not in evidence_ids:
                problems.append("{} references unknown evidence id '{}'".format(scene_path.relative_to(folder).as_posix(), reference))
        for reference in term_refs:
            if reference not in term_ids:
                problems.append("{} references unknown prerequisite term '{}'".format(scene_path.relative_to(folder).as_posix(), reference))
    return scenes, problems


def v2_structure_problems(folder: Path) -> List[str]:
    required_files = [
        "source/paper.url", "design/learning-contract.md", "research/01_paper_model.md",
        "research/02_evidence_registry.yaml", "design/learning-architecture.md",
        "knowledge/terms.yaml", "audit/final-check.md", "audit/release-check.md",
    ]
    problems = ["required v2 artifact missing or empty: {}".format(path) for path in required_files
                if not (folder / path).is_file() or not (folder / path).read_text(encoding="utf-8").strip()]
    _scenes, reference_problems = scene_reference_problems(folder)
    return problems + reference_problems


def scene_acceptance_problems(folder: Path) -> List[str]:
    scenes, problems = scene_reference_problems(folder)
    if not scenes:
        problems.append("no scene specifications found in design/scenes/")
    required_sections = (
        "Reconstruction Test", "Implementation Trace Test", "Global Dependency Test",
        "Deletion Test", "Acceptance Questions",
    )
    for scene_path in scenes:
        markdown = scene_path.read_text(encoding="utf-8")
        for heading in required_sections:
            body = markdown_section(markdown, heading)
            normalized = re.sub(r"[`*_>#-]", "", body).strip()
            if not normalized or normalized.startswith("What can the learner") or normalized.startswith("If an interaction is removed"):
                problems.append("{} has an empty {}".format(scene_path.relative_to(folder).as_posix(), heading))
        dependency_body = markdown_section(markdown, "Global Dependency Test")
        for field in ("Consumes", "Produces", "Used later by"):
            match = re.search(r"(?im)^\s*(?:[-*]\s*)?\*?\*?{}\*?\*?\s*:\s*(.+)$".format(field), dependency_body)
            if not match or not match.group(1).strip() or match.group(1).strip() in ("—", "-"):
                problems.append("{} is missing Global Dependency Test field {}".format(scene_path.relative_to(folder).as_posix(), field))
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


def v3_implementation_data(folder: Path, evidence_ids: set) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    plan, problems = fenced_yaml(folder / "design/implementation-plan.md")
    if plan is None:
        return None, problems
    implementation = plan.get("implementation")
    if not isinstance(implementation, dict):
        return plan, problems + ["implementation-plan YAML must define an implementation mapping"]

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


def v3_implementation_coverage(folder: Path, stage_id: str, implementation_plan: Dict[str, Any]) -> List[str]:
    problems: List[str] = []
    manifest, manifest_problems = read_json_object(
        folder / "web/enhanced/implementation-manifest.json",
        "web/enhanced/implementation-manifest.json",
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
    export_root: Optional[Path] = None,
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
            local_web_asset = folder / "web/enhanced" / web_path
            if not local_web_asset.is_file():
                problems.append("selected asset '{}' is missing from web/enhanced: {}".format(item_id, web_path))
            if export_root is not None and not (export_root / web_path).is_file():
                problems.append("export is missing selected asset: {}".format(web_path))
    if selected:
        readme = (export_root or (folder / "web/enhanced")) / "README.md"
        if not readme.is_file():
            problems.append("{} is missing asset provenance README.md".format("export" if export_root else "web/enhanced"))
        else:
            readme_text = readme.read_text(encoding="utf-8")
            if not re.search(r"asset\s+(provenance|sources)|image\s+(provenance|sources)", readme_text, re.IGNORECASE):
                problems.append("{} README.md must document asset provenance".format("export" if export_root else "web/enhanced"))
    return data, problems


def upstream_preflight_problems(folder: Path, config: Dict[str, Any]) -> List[str]:
    report, problems = read_json_object(folder / "audit/upstream-preflight.json", "audit/upstream-preflight.json")
    if report is None:
        return problems
    if report.get("status") != "PASS":
        problems.append("audit/upstream-preflight.json status must be PASS")
    commit = report.get("upstream_commit")
    if not isinstance(commit, str) or not re.fullmatch(r"[0-9a-fA-F]{40,64}", commit):
        problems.append("upstream preflight report needs the upstream commit SHA")
    temporary_commit = report.get("temporary_commit")
    if not isinstance(temporary_commit, str) or not re.fullmatch(r"[0-9a-fA-F]{40,64}", temporary_commit):
        problems.append("upstream preflight report needs the temporary tutorial commit SHA")
    elif isinstance(commit, str) and temporary_commit == commit:
        problems.append("temporary tutorial commit must differ from the upstream commit")
    release = config.get("release", {})
    if report.get("paper_name") != release.get("upstream_paper_name"):
        problems.append("upstream preflight paper_name does not match paper.yaml")
    if report.get("version") != release.get("upstream_version"):
        problems.append("upstream preflight version does not match paper.yaml")
    changed_paths = report.get("changed_paths")
    if not isinstance(changed_paths, list) or not changed_paths:
        problems.append("upstream preflight changed_paths must list the committed tutorial files")
    else:
        output = release.get("output")
        expected_prefix = output.replace("\\", "/").strip("/") + "/" if isinstance(output, str) else ""
        if any(not isinstance(path, str) or not path.replace("\\", "/").startswith(expected_prefix) for path in changed_paths):
            problems.append("upstream preflight changed_paths must stay within release.output")
        normalized_paths = [path.replace("\\", "/") for path in changed_paths if isinstance(path, str)]
        if len(normalized_paths) != len(set(normalized_paths)):
            problems.append("upstream preflight changed_paths must not contain duplicates")
    unexpected_paths = report.get("unexpected_paths")
    if not isinstance(unexpected_paths, list) or unexpected_paths:
        problems.append("upstream preflight unexpected_paths must be an empty list")
    export_hash = report.get("export_sha256")
    if not isinstance(export_hash, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", export_hash):
        problems.append("upstream preflight report needs the exported tutorial SHA-256")
    else:
        output = release.get("output")
        export_path = ROOT / output if isinstance(output, str) else None
        if export_path is None or not export_path.is_dir():
            problems.append("upstream preflight export hash cannot be verified because release.output is missing")
        elif directory_sha256(export_path).lower() != export_hash.lower():
            problems.append("upstream preflight export SHA-256 does not match release.output")
    commands = report.get("commands")
    if not isinstance(commands, list):
        problems.append("upstream preflight commands must be a list")
        return problems
    expected = {"npm run import", "npm run validate", "npm run build:paper", "npm run preflight"}
    successful = set()
    seen = set()
    for index, command in enumerate(commands):
        if not isinstance(command, dict) or not isinstance(command.get("command"), str):
            problems.append("upstream preflight command {} needs a command name".format(index + 1))
            continue
        name = command["command"]
        if name in seen:
            problems.append("upstream preflight '{}' must appear only once".format(name))
        seen.add(name)
        exit_code = command.get("exit_code")
        if type(exit_code) is not int:
            problems.append("upstream preflight '{}' needs an integer exit_code".format(name))
        elif exit_code != 0:
            problems.append("upstream preflight '{}' failed with exit code {}".format(name, exit_code))
        elif name in expected:
            successful.add(name)
    for name in sorted(expected - successful):
        problems.append("upstream preflight report is missing successful '{}'".format(name))
    return problems


def v3_stage_completion_problems(folder: Path, stage_id: str, config: Dict[str, Any]) -> List[str]:
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
        web = folder / "web/enhanced"
        package = web / "package.json"
        if not package.is_file():
            problems.append("web/enhanced/package.json is missing")
        elif stage_id == "W8" and not (web / "package-lock.json").is_file():
            problems.append("web/enhanced/package-lock.json is missing")
        if not any((web / path).is_file() for path in ("src/App.tsx", "src/main.tsx")):
            problems.append("web/enhanced needs src/App.tsx or src/main.tsx")
        evidence_ids, _entries, evidence_problems = evidence_registry_ids_v3(folder)
        problems.extend(evidence_problems)
        implementation_plan, implementation_problems = v3_implementation_data(folder, evidence_ids)
        problems.extend(implementation_problems)
        if isinstance(implementation_plan, dict):
            problems.extend(v3_implementation_coverage(folder, stage_id, implementation_plan))
        if stage_id == "W8":
            source_manifest, source_problems = v3_cache_data(folder)
            problems.extend(source_problems)
            _assets, asset_problems = validate_asset_materialization(folder, source_manifest, evidence_ids)
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
        release = config.get("release", {})
        if not all(release.get(key) for key in ("upstream_paper_name", "upstream_version", "output")):
            problems.append("release.upstream_paper_name, release.upstream_version, and output must be set before W10")
            problems.extend(upstream_preflight_problems(folder, config))
            return problems
        output = ROOT / release["output"]
        required = ("paper.json", "README.md", "package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json", "src/App.tsx", "src/data/tutorial.ts", "src/modules/registry.tsx", "src/styles/paper.css")
        problems.extend("upstream export is missing {}".format(path) for path in required if not (output / path).is_file())
        for name in ("paper.json", "package.json"):
            value, json_problems = read_json_object(output / name, name)
            problems.extend(json_problems)
            if name == "paper.json" and isinstance(value, dict):
                if value.get("paperName") != release["upstream_paper_name"]:
                    problems.append("export paper.json paperName does not match release.upstream_paper_name")
                if value.get("version") != release["upstream_version"]:
                    problems.append("export paper.json version does not match release.upstream_version")
        readme = output / "README.md"
        if readme.is_file():
            readme_text = readme.read_text(encoding="utf-8")
            for image_path in re.findall(r"!\[[^\]]*\]\(([^)]+)\)", readme_text):
                path_issue = path_problem(image_path.strip())
                if path_issue:
                    problems.append("export README image path '{}' {}".format(image_path, path_issue))
        if output.is_dir():
            absolute_image_ref = re.compile(r"(?:src|poster)\s*=\s*['\"]/(?!/)|url\(\s*['\"]?/(?!/)", re.IGNORECASE)
            for source_file in output.rglob("*"):
                if source_file.is_file() and source_file.suffix.lower() in {".tsx", ".ts", ".jsx", ".js", ".html", ".css"}:
                    try:
                        source_text = source_file.read_text(encoding="utf-8")
                    except (OSError, UnicodeError):
                        continue
                    if absolute_image_ref.search(source_text):
                        problems.append("export has a root-relative image/media path in {}".format(source_file.relative_to(output).as_posix()))
        if output.is_dir() and any(path.suffix.lower() == ".pdf" for path in output.rglob("*")):
            problems.append("upstream export must not include a PDF")
        asset_manifest, source_problems = v3_cache_data(folder)
        problems.extend(source_problems)
        evidence_ids, _entries, evidence_problems = evidence_registry_ids_v3(folder)
        problems.extend(evidence_problems)
        _assets, materialization_problems = validate_asset_materialization(folder, asset_manifest, evidence_ids, output)
        problems.extend(materialization_problems)
        problems.extend(upstream_preflight_problems(folder, config))
        return problems
    return problems


def v3_cross_reference_problems(folder: Path, stage_index: int) -> List[str]:
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
    return problems


def cmd_check_v3(folder: Path, config: Dict[str, Any], paper_id: str) -> int:
    states = stage_states(config)
    failures: List[str] = []
    warnings: List[str] = []
    for stage_id, _key, label in STAGES:
        print("[STAGE] {} {}: {}".format(stage_id, label, states[stage_id].upper()))
        issues = v3_stage_completion_problems(folder, stage_id, config)
        if states[stage_id] == "complete":
            failures.extend("{}: {}".format(stage_id, issue) for issue in issues)
        elif stage_id == config["workflow"]["current_stage"]:
            warnings.extend("{}: {}".format(stage_id, issue) for issue in issues)
    current_stage_index = STAGE_IDS.index(config["workflow"]["current_stage"])
    for issue in v3_cross_reference_problems(folder, current_stage_index):
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


def cmd_learning_check(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") != 2:
        raise PaperError("learning-check requires schema_version 2; run migrate-v2 first")
    problems = scene_acceptance_problems(folder)
    if problems:
        for problem in problems:
            print("[FAIL] {}".format(problem))
        print("STRUCTURAL LEARNING CHECK FAILED")
        return 1
    print("[PASS] scene specs, reconstruction tests, acceptance questions, and registry references")
    print("STRUCTURAL LEARNING CHECK PASS")
    print("Human learning acceptance still required.")
    return 0


def cmd_check(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    errors = validate_config(config, args.paper_id)
    if errors:
        for error in errors:
            print("[FAIL] {}".format(error))
        return 1
    if config.get("schema_version") == 3:
        return cmd_check_v3(folder, config, args.paper_id)
    states = gate_states(config)
    legacy = config.get("schema_version") == 1
    artifact_definitions = artifact_map(config)
    labels = LEGACY_GATE_LABELS if legacy else [gate[2] for gate in GATES]
    has_legacy = "legacy" in states.values()
    warnings: List[str] = []
    failures: List[str] = []

    url_file = folder / "source/paper.url"
    if url_file.is_file() and url_file.read_text(encoding="utf-8").strip():
        print("[PASS] source/paper.url")
    else:
        failures.append("source/paper.url missing or empty")

    local_pdf = config.get("paper", {}).get("local_pdf")
    if local_pdf and not (folder / local_pdf).is_file():
        warnings.append("declared local PDF is not present: {}".format(local_pdf))

    for (gate_id, _gate_key, _label), label in zip(GATES, labels):
        state = states[gate_id]
        satisfied, relative = artifact_satisfied(folder, gate_id, config)
        artifact_target = folder / relative
        if gate_id == "G0":
            contract_ok = artifact_satisfied(folder, gate_id, config)[0]
            paper_url_ok = url_file.is_file() and bool(url_file.read_text(encoding="utf-8").strip())
            satisfied = contract_ok and paper_url_ok
            artifact_present = (folder / "paper.yaml").is_file() and paper_url_ok and contract_ok
        if gate_id == "G7":
            content_check = folder / ("audit/final-check.md" if not legacy else "audit/content-check.md")
            release_check = folder / "audit/release-check.md"
            artifact_present = content_check.is_file() and release_check.is_file()
            relative = content_check.relative_to(folder).as_posix() + " + audit/release-check.md"
            satisfied = artifact_present
            if satisfied and state == "complete":
                check_marker = "Overall: PASS" if not legacy else "PASS"
                satisfied = marker_present(content_check, check_marker) and marker_present(release_check, "READY")
        elif gate_id != "G0":
            kind = artifact_definitions[gate_id][0]
            artifact_present = (artifact_target.is_dir() and any(artifact_target.iterdir())) if kind == "dir" and artifact_target.is_dir() else artifact_target.is_file()

        print("[GATE] {} {}: {}".format(gate_id, label, state.upper()))
        legacy_missing = state == "legacy" or (gate_id == "G3" and state == "complete" and has_legacy)
        artifact_mark = "PRESENT" if artifact_present else ("LEGACY" if legacy_missing else "MISSING")
        print("[{}] {} artifact: {}".format(artifact_mark, gate_id, relative))
        if satisfied:
            pass
        elif legacy_missing:
            warnings.append("{} marked {} but standard artifact is not archived locally: {}".format(gate_id, state, relative))
        elif state == "complete":
            failures.append("{} marked complete but required artifact is missing or incomplete: {}".format(gate_id, relative))
        else:
            warnings.append("{} {} artifact is empty or not yet present: {}".format(gate_id, label, relative))

    enhanced_package = folder / "web/enhanced/package.json"
    if states["G6"] == "complete" and not enhanced_package.is_file():
        if has_legacy and states["G6"] == "legacy":
            pass
        else:
            failures.append("G6 is complete but web/enhanced/package.json is missing")
    if enhanced_package.is_file():
        try:
            package = json.loads(enhanced_package.read_text(encoding="utf-8"))
            scripts = package.get("scripts", {}) if isinstance(package, dict) else {}
            if scripts:
                print("Available Enhanced scripts: {}".format(", ".join(sorted(scripts))))
        except (OSError, UnicodeError, json.JSONDecodeError):
            warnings.append("web/enhanced/package.json is not valid JSON")

    if not legacy:
        structure_problems = v2_structure_problems(folder)
        failures.extend(structure_problems)
        scenes = sorted((folder / "design/scenes").glob("*.md")) if (folder / "design/scenes").is_dir() else []
        if not scenes:
            warnings.append("no scene specifications yet; learning-check will remain blocked")

    warnings.extend(hygiene_warnings(folder))
    failures.extend(hygiene_failures(args.paper_id))
    for warning in warnings:
        print("[WARN] {}".format(warning))
    for failure in failures:
        print("[FAIL] {}".format(failure))
    print("CHECK {}".format("FAILED" if failures else "PASS"))
    return 1 if failures else 0


def cmd_release_check(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    errors = validate_config(config, args.paper_id)
    if errors:
        print("NOT READY\n\nBLOCKERS:")
        for error in errors:
            print("- Invalid paper.yaml: {}".format(error))
        return 1
    if config.get("schema_version") == 3:
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
    states = gate_states(config)
    blockers: List[str] = []
    legacy = config.get("schema_version") == 1
    labels = LEGACY_GATE_LABELS if legacy else [gate[2] for gate in GATES]
    for (gate_id, _key, _label), label in zip(GATES[:7], labels[:7]):
        if states[gate_id] != "complete":
            blockers.append("{} {} not complete".format(gate_id, label))
    for gate_id in GATE_IDS[:7]:
        for problem in gate_completion_problems(folder, gate_id, config):
            blockers.append(problem)
    content_check = folder / ("audit/final-check.md" if not legacy else "audit/content-check.md")
    release_check = folder / "audit/release-check.md"
    content_marker = "Overall: PASS" if not legacy else "PASS"
    if not marker_present(content_check, content_marker):
        blockers.append("{} is not {}".format(content_check.name, content_marker))
    if not marker_present(release_check, "READY"):
        blockers.append("release-check.md is not READY")
    if blockers:
        print("NOT READY\n\nBLOCKERS:")
        for blocker in dict.fromkeys(blockers):
            print("- {}".format(blocker))
        return 1
    print("RELEASE READY")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage PaperSkillWork paper workspaces and Workflow v1–v3 state.")
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

    for name, help_text, handler in (
        ("status", "show paper metadata, workflow states, and artifacts", cmd_status),
        ("check", "run mechanical workspace checks", cmd_check),
        ("learning-check", "check legacy v2 scene specs and registry references", cmd_learning_check),
        ("release-check", "check whether the paper meets release prerequisites", cmd_release_check),
    ):
        command = subparsers.add_parser(name, help=help_text)
        command.add_argument("paper_id")
        command.set_defaults(func=handler)

    migrate = subparsers.add_parser("migrate-v2", help="non-destructively scaffold Workflow v2 artifacts for a v1 paper")
    migrate.add_argument("paper_id")
    migrate.set_defaults(func=cmd_migrate_v2)

    gate = subparsers.add_parser("gate", help="read or explicitly update a legacy v1/v2 workflow gate")
    gate.add_argument("paper_id")
    gate.add_argument("gate", nargs="?", choices=GATE_IDS)
    gate.add_argument("status", nargs="?", choices=sorted(STATUSES))
    gate.add_argument("--reason", help="required explanation when marking a gate skipped")
    gate.set_defaults(func=cmd_gate)

    stage = subparsers.add_parser("stage", help="read or explicitly update a Workflow v3 stage")
    stage.add_argument("paper_id")
    stage.add_argument("stage", nargs="?", choices=STAGE_IDS)
    stage.add_argument("status", nargs="?", choices=("in_progress", "complete"))
    stage.add_argument("--reviewed-by", help="human reviewer name, required only for W2, W4, W7, and W9 completion")
    stage.add_argument("--note", help="human review note, required only for W2, W4, W7, and W9 completion")
    stage.set_defaults(func=cmd_stage)

    upstream = subparsers.add_parser("upstream-check", help="run the official PaperSkill import, validation, build, and preflight in an isolated checkout")
    upstream.add_argument("paper_id")
    upstream.add_argument("--paperskill-repo", required=True, help="path to a clean PaperSkill Git checkout")
    upstream.add_argument("--participant", required=True, help="public participant name for the official import")
    upstream.add_argument("--pinyin", help="required by PaperSkill when participant contains non-ASCII characters")
    upstream.add_argument("--github", help="optional public GitHub username")
    upstream.add_argument("--replace-output", action="store_true", help="replace the configured generated export if it already exists")
    upstream.set_defaults(func=cmd_upstream_check)

    paths = subparsers.add_parser("paths", help="show standard workspace paths")
    paths.add_argument("paper_id")
    paths.add_argument("--json", action="store_true")
    paths.set_defaults(func=cmd_paths)

    open_web = subparsers.add_parser("open", help="install web dependencies and open a paper tutorial locally")
    open_web.add_argument("paper_id")
    open_web.add_argument("--edition", choices=("enhanced", "canonical"), default="enhanced")
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
