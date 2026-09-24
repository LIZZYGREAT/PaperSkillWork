#!/usr/bin/env python3
"""Mechanical workspace and gate checks for PaperSkillWork."""

import argparse
import json
import re
import subprocess
import sys
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
PAPER_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
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
    if isinstance(schema_version, bool) or schema_version not in (1, 2):
        errors.append("schema_version must be 1 or 2")
    configured_id = config.get("id")
    if not isinstance(configured_id, str) or not PAPER_ID_RE.fullmatch(configured_id):
        errors.append("id is invalid")
    elif configured_id != expected_id:
        errors.append("id '{}' does not match workspace directory '{}'".format(configured_id, expected_id))
    if not isinstance(config.get("title"), str) or not config["title"].strip():
        errors.append("title must be non-empty")

    paper = config.get("paper")
    if not isinstance(paper, dict) or not isinstance(paper.get("url"), str) or not paper["url"].strip():
        errors.append("paper.url must be non-empty")
    elif "local_pdf" in paper and paper["local_pdf"] is not None:
        problem = path_problem(paper["local_pdf"])
        if problem:
            errors.append("paper.local_pdf {}".format(problem))

    workflow = config.get("workflow")
    if not isinstance(workflow, dict) or workflow.get("current_gate") not in GATE_IDS:
        errors.append("workflow.current_gate must be one of G0 through G7")
    if schema_version == 2 and isinstance(workflow, dict) and workflow.get("version") != 2:
        errors.append("workflow.version must be 2 for schema_version 2")
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


def render_template(template_name: str, replacements: Dict[str, str]) -> str:
    template_path = ROOT / "templates" / template_name
    if not template_path.is_file():
        raise PaperError("Required template is missing: templates/{}".format(template_name))
    template = template_path.read_text(encoding="utf-8")
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
    url = args.url.strip()
    arxiv_id = (args.arxiv_id or "").strip()
    if not title or "\n" in title or "\r" in title:
        raise PaperError("--title must be a non-empty single line")
    if not url:
        raise PaperError("--url must be non-empty")
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
    for template_name, relative_output in TEMPLATE_OUTPUTS.items():
        template_replacements = dict(replacements)
        if template_name == "paper.yaml":
            template_replacements["paper_title"] = quote_yaml(title)
        rendered[relative_output] = render_template(template_name, template_replacements)

    require_yaml()
    try:
        config = yaml.safe_load(rendered["paper.yaml"])
    except yaml.YAMLError as exc:
        raise PaperError("Rendered paper.yaml is invalid: {}".format(exc))
    if not isinstance(config, dict):
        raise PaperError("Rendered paper.yaml must be a mapping")
    validate_or_raise(config, args.paper_id)
    rendered["source/paper.url"] = url + "\n"

    try:
        folder.mkdir(parents=False)
        for directory in ("source", "research", "design/scenes", "knowledge", "audit", "assets/figures", "assets/screenshots"):
            (folder / directory).mkdir(parents=True, exist_ok=True)
        for relative, content in rendered.items():
            target = folder / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
    except OSError as exc:
        raise PaperError("Could not create workspace papers/{}: {}".format(args.paper_id, exc))

    print("Created papers/{}".format(args.paper_id))
    print("Next: complete design/learning-contract.md, then build research/01_paper_model.md with $paper-review.")
    return 0


def cmd_migrate_v2(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if config.get("schema_version") != 1:
        raise PaperError("Only schema_version 1 workspaces can be migrated to v2")

    legacy_states = gate_states(config)
    legacy_config = dict(config.get("artifacts", {}))
    detected: Dict[str, str] = {}
    for _gate_id, (_kind, relative) in LEGACY_GATE_ARTIFACTS.items():
        if (folder / relative).exists():
            detected[relative] = relative

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
    }

    replacements = {
        "paper_id": args.paper_id,
        "paper_title": " ".join(config["title"].split()),
        "paper_url": quote_yaml(config["paper"]["url"]),
        "arxiv_id": quote_yaml(str(config.get("paper", {}).get("arxiv_id", "") or "")),
    }
    created: List[str] = []
    preserved: List[str] = []
    directories = ("source", "research", "design/scenes", "knowledge", "audit")
    for relative in directories:
        (folder / relative).mkdir(parents=True, exist_ok=True)
    for template_name, relative in TEMPLATE_OUTPUTS.items():
        if template_name == "paper.yaml":
            continue
        target = folder / relative
        if target.exists():
            preserved.append(relative)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(render_template(template_name, replacements), encoding="utf-8")
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
            "Migration created v2 workspace artifacts without deleting or replacing existing paper files.",
            "Canonical and Enhanced paths were left untouched. All v2 gates start as pending.",
            "",
            "## Legacy gate states",
            "",
        ]
        lines.extend("- {}: {}".format(gate_id, state) for gate_id, state in legacy_states.items())
        lines.extend(["", "## Detected legacy artifacts", ""])
        lines.extend("- `{}`".format(path) for path in detected)
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


def recommended_gate(states: Dict[str, str]) -> str:
    for gate_id, _key, label in GATES:
        if states.get(gate_id) not in ("complete", "skipped"):
            return "{} {}".format(gate_id, label)
    return "No remaining gate"


def cmd_status(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
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
    if config.get("schema_version") == 2:
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


def cmd_gate(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
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
    parser = argparse.ArgumentParser(description="Manage PaperSkillWork paper workspaces and gate state.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    new = subparsers.add_parser("new", help="create a paper workspace from the standard templates")
    new.add_argument("paper_id")
    new.add_argument("--title", required=True)
    new.add_argument("--url", required=True)
    new.add_argument("--arxiv-id", default="")
    new.set_defaults(func=cmd_new)

    for name, help_text, handler in (
        ("status", "show paper metadata, gate states, and artifacts", cmd_status),
        ("check", "run mechanical workspace checks", cmd_check),
        ("learning-check", "check structural learning artifacts and registry references", cmd_learning_check),
        ("release-check", "check whether the paper meets release prerequisites", cmd_release_check),
    ):
        command = subparsers.add_parser(name, help=help_text)
        command.add_argument("paper_id")
        command.set_defaults(func=handler)

    migrate = subparsers.add_parser("migrate-v2", help="non-destructively scaffold Workflow v2 artifacts for a v1 paper")
    migrate.add_argument("paper_id")
    migrate.set_defaults(func=cmd_migrate_v2)

    gate = subparsers.add_parser("gate", help="read or explicitly update a workflow gate")
    gate.add_argument("paper_id")
    gate.add_argument("gate", nargs="?", choices=GATE_IDS)
    gate.add_argument("status", nargs="?", choices=sorted(STATUSES))
    gate.add_argument("--reason", help="required explanation when marking a gate skipped")
    gate.set_defaults(func=cmd_gate)

    paths = subparsers.add_parser("paths", help="show standard workspace paths")
    paths.add_argument("paper_id")
    paths.add_argument("--json", action="store_true")
    paths.set_defaults(func=cmd_paths)
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except PaperError as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    except OSError as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
