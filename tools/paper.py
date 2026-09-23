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


ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "papers"
PAPER_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
PLACEHOLDER_RE = re.compile(r"\{\{([A-Za-z0-9_]+)\}\}")
ALLOWED_PLACEHOLDERS = {"paper_id", "paper_title", "paper_url", "arxiv_id"}
STATUSES = {"pending", "in_progress", "complete", "skipped", "legacy"}
GATES: List[Tuple[str, str, str]] = [
    ("G0", "G0_workspace", "Workspace"),
    ("G1", "G1_research", "Research"),
    ("G2", "G2_evidence_audit", "Evidence Audit"),
    ("G3", "G3_canonical", "Canonical"),
    ("G4", "G4_narrative_design", "Narrative Design"),
    ("G5", "G5_interaction_design", "Interaction Design"),
    ("G6", "G6_enhanced", "Enhanced"),
    ("G7", "G7_release", "Final Audit & Release"),
]
GATE_IDS = [gate[0] for gate in GATES]
GATE_BY_ID = {gate[0]: gate for gate in GATES}
GATE_ARTIFACTS = {
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
    "research-review.md": "research/01_review.md",
    "evidence-audit.md": "research/02_evidence_audit.md",
    "storyboard.md": "design/storyboard.md",
    "interaction-plan.md": "design/interaction-plan.md",
    "content-check.md": "audit/content-check.md",
    "release-check.md": "audit/release-check.md",
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
        value = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, yaml.YAMLError) as exc:
        raise PaperError("Cannot read valid YAML from {}: {}".format(path, exc))
    if not isinstance(value, dict):
        raise PaperError("{} must contain a YAML mapping".format(path))
    return value


def validate_config(config: Dict[str, Any], expected_id: str) -> List[str]:
    errors: List[str] = []
    if config.get("schema_version") != 1 or isinstance(config.get("schema_version"), bool):
        errors.append("schema_version must be 1")
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
        if configured_id != "phyagentos" and any(
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


def artifact_satisfied(folder: Path, gate_id: str) -> Tuple[bool, str]:
    kind, relative = GATE_ARTIFACTS[gate_id]
    target = folder / relative
    if kind == "dir":
        return target.is_dir() and any(target.iterdir()), relative
    if not target.is_file():
        return False, relative
    if gate_id in ("G1", "G2", "G4", "G5"):
        try:
            return bool(target.read_text(encoding="utf-8").strip()), relative
        except (OSError, UnicodeError):
            return False, relative
    return True, relative


def gate_completion_problems(folder: Path, gate_id: str) -> List[str]:
    satisfied, relative = artifact_satisfied(folder, gate_id)
    if not satisfied:
        return ["required artifact missing or empty: {}".format(relative)]
    if gate_id == "G0":
        url_file = folder / "source/paper.url"
        if not url_file.is_file() or not url_file.read_text(encoding="utf-8").strip():
            return ["required artifact missing or empty: source/paper.url"]
    if gate_id == "G7":
        if not marker_present(folder / "audit/content-check.md", "PASS"):
            return ["audit/content-check.md must contain PASS"]
        if not marker_present(folder / "audit/release-check.md", "READY"):
            return ["audit/release-check.md must contain READY"]
    return []


def quote_yaml(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


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
        rendered[relative_output] = template

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
        for directory in ("source", "research", "design", "audit", "assets/figures", "assets/screenshots"):
            (folder / directory).mkdir(parents=True, exist_ok=True)
        for relative, content in rendered.items():
            target = folder / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
    except OSError as exc:
        raise PaperError("Could not create workspace papers/{}: {}".format(args.paper_id, exc))

    print("Created papers/{}".format(args.paper_id))
    print("Next: review research/01_review.md with $paper-review, then verify G1 before marking it complete.")
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
    for gate_id, _key, label in GATES:
        print("{} {:<26} {}".format(gate_id, label, states[gate_id].upper()))
    print("\nArtifacts")
    artifact_rows = [
        ("G1", "research/01_review.md", "file"),
        ("G2", "research/02_evidence_audit.md", "file"),
        ("G3", "web/canonical", "dir"),
        ("G4", "design/storyboard.md", "file"),
        ("G5", "design/interaction-plan.md", "file"),
        ("G6", "web/enhanced/package.json", "file"),
        ("G7", "audit/content-check.md", "file"),
        ("G7", "audit/release-check.md", "file"),
    ]
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
    if args.json:
        print(json.dumps(values, ensure_ascii=False, indent=2))
    else:
        labels = [
            ("workspace", "Workspace"), ("paper_pdf", "Paper PDF"), ("review", "Review"),
            ("evidence_audit", "Evidence Audit"), ("storyboard", "Storyboard"),
            ("interaction_plan", "Interaction Plan"), ("canonical", "Canonical"), ("enhanced", "Enhanced"),
        ]
        for key, label in labels:
            print("{}: {}".format(label, values[key]))
    return 0


def cmd_gate(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    validate_or_raise(config, args.paper_id)
    if args.gate is None and args.status is None:
        print("Paper: {}".format(args.paper_id))
        print("Current Gate: {}".format(config["workflow"]["current_gate"]))
        for gate_id, gate_key, label in GATES:
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
        problems.extend(gate_completion_problems(folder, args.gate))
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


def cmd_check(args: argparse.Namespace) -> int:
    folder, config = read_paper(args.paper_id)
    errors = validate_config(config, args.paper_id)
    if errors:
        for error in errors:
            print("[FAIL] {}".format(error))
        return 1
    states = gate_states(config)
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

    for gate_id, _gate_key, label in GATES:
        state = states[gate_id]
        satisfied, relative = artifact_satisfied(folder, gate_id)
        artifact_target = folder / relative
        if gate_id == "G0":
            satisfied = (folder / "paper.yaml").is_file() and url_file.is_file() and bool(url_file.read_text(encoding="utf-8").strip())
            artifact_present = (folder / "paper.yaml").is_file() and url_file.is_file() and bool(url_file.read_text(encoding="utf-8").strip())
        if gate_id == "G7":
            content_check = folder / "audit/content-check.md"
            release_check = folder / "audit/release-check.md"
            artifact_present = content_check.is_file() and release_check.is_file()
            relative = "audit/content-check.md + audit/release-check.md"
            satisfied = artifact_present
            if satisfied and state == "complete":
                satisfied = marker_present(content_check, "PASS") and marker_present(release_check, "READY")
        elif gate_id != "G0":
            artifact_present = artifact_target.is_dir() if GATE_ARTIFACTS[gate_id][0] == "dir" else artifact_target.is_file()

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
    for gate_id, _key, label in GATES[:7]:
        if states[gate_id] != "complete":
            blockers.append("{} {} not complete".format(gate_id, label))
    for gate_id in GATE_IDS[:7]:
        for problem in gate_completion_problems(folder, gate_id):
            blockers.append(problem)
    content_check = folder / "audit/content-check.md"
    release_check = folder / "audit/release-check.md"
    if not marker_present(content_check, "PASS"):
        blockers.append("content-check.md is not PASS")
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
        ("release-check", "check whether the paper meets release prerequisites", cmd_release_check),
    ):
        command = subparsers.add_parser(name, help=help_text)
        command.add_argument("paper_id")
        command.set_defaults(func=handler)

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
