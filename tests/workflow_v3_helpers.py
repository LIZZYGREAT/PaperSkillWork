import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).resolve().parents[1]
PAPER_SCRIPT = REPO_ROOT / "tools" / "paper.py"
TEMPLATES = REPO_ROOT / "templates"
HUMAN_STAGES = {"W2", "W4", "W7", "W9"}
STAGES = ["W0", "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10"]
STAGE_KEYS = {
    "W0": "W0_source_intake",
    "W1": "W1_source_cache",
    "W2": "W2_paper_model",
    "W3": "W3_evidence_assets",
    "W4": "W4_learning_spine",
    "W5": "W5_interaction_plan",
    "W6": "W6_vertical_slice",
    "W7": "W7_human_review",
    "W8": "W8_full_implementation",
    "W9": "W9_final_audit",
    "W10": "W10_upstream_preflight",
}


def invoke(root, *args):
    return subprocess.run(
        [sys.executable, str(root / "tools" / "paper.py"), *args],
        cwd=root,
        text=True,
        capture_output=True,
        check=False,
    )


def make_project(tmp_path, selected_asset=False):
    root = tmp_path / "project"
    shutil.copytree(REPO_ROOT / "tools", root / "tools")
    shutil.copytree(TEMPLATES, root / "templates")
    shutil.copy2(REPO_ROOT / ".gitignore", root / ".gitignore")
    (root / "papers").mkdir()
    result = invoke(
        root,
        "new", "demo-paper", "--title", "A Sample Paper",
        "--url", "https://example.org/paper",
        "--author", "Ada Author", "--venue", "Example Venue", "--year", "2026",
        "--source-type", "arxiv", "--source-location", "https://example.org/paper",
        "--source-hash", "abc123",
    )
    assert result.returncode == 0, result.stderr
    paper = root / "papers" / "demo-paper"
    config_path = paper / "paper.yaml"
    config = yaml.safe_load(config_path.read_text(encoding="utf-8"))

    source_manifest = {
        "paper": {
            "title": "A Sample Paper", "authors": ["Ada Author"], "venue": "Example Venue",
            "year": 2026, "source_type": "arxiv", "source_location": "https://example.org/paper",
            "source_hash": "abc123",
        },
        "extraction": "Complete systematic read of the paper",
        "cache_status": "complete",
        "figures": [{
            "id": "F01", "locator": "Figure 1, page 3", "caption": "System overview",
            "type": "ARCHITECTURE", "candidate_role": "Shows the main mechanism",
            "image_path": "source-cache/figures/F01.png",
        }],
    }
    (paper / "source-cache/content.md").write_text("Complete cached source text.\n", encoding="utf-8")
    (paper / "source-cache/manifest.json").write_text(json.dumps(source_manifest, indent=2), encoding="utf-8")
    (paper / "source-cache/evidence.json").write_text(json.dumps({"source_notes": []}, indent=2), encoding="utf-8")
    (paper / "source-cache/figures/F01.png").write_bytes(b"source-figure")
    evidence_registry = {
        "claims": {"E01": {
            "claim": "The method uses a shared representation.", "type": "PAPER_FACT",
            "source_locator": "Section 3, Figure 1", "conditions": "In the described setup",
            "allowed_wording": "The paper describes a shared representation.",
        }},
        "results": {}, "author_interpretations": {}, "our_interpretations": {},
        "implementation_mappings": {}, "background": {}, "teaching_examples": {},
        "review": {
            "unresolved_source_conflicts": [], "unresolved_evidence_conflicts": [],
            "unsafe_claim_wording": [],
        },
    }
    (paper / "research/evidence-registry.yaml").write_text(yaml.safe_dump(evidence_registry, sort_keys=False), encoding="utf-8")
    paper_model = "# Paper Model\n\n" + "\n".join(
        "## {}\n\nGrounded content.".format(section)
        for section in (
            "Core Explanation", "Problem", "Core Insight", "Prerequisites", "Objects and Variables",
            "Architecture and Ownership", "Data Flow", "State and Time", "Training", "Inference / Runtime",
            "Core Equations", "Results", "Limitations",
        )
    )
    (paper / "research/paper-model.md").write_text(paper_model, encoding="utf-8")

    spine = {
        "stages": [
            {"id": "S1", "question": "What problem is being solved?"},
            {"id": "S2", "question": "How does the method work?"},
        ],
        "items": [
            {"id": "C01", "title": "Problem", "priority": "CORE", "stage": "S1", "placement": "mainline", "evidence_refs": ["E01"]},
            {"id": "C02", "title": "Architecture", "priority": "CORE", "stage": "S2", "placement": "mainline", "evidence_refs": ["E01"]},
            {"id": "C03", "title": "Mechanism", "priority": "CORE", "stage": "S2", "placement": "mainline", "evidence_refs": ["E01"]},
            {"id": "S11", "title": "Training detail", "priority": "SUPPORTING", "stage": "S2", "placement": "compact-inline", "evidence_refs": ["E01"]},
            {"id": "R03", "title": "Extended proof", "priority": "REFERENCE", "stage": None, "placement": "Reference Hub", "evidence_refs": ["E01"]},
            {"id": "D01", "title": "Peripheral detail", "priority": "DELETE", "stage": None, "placement": "none", "evidence_refs": []},
        ],
    }
    write_fenced_yaml(paper / "design/learning-spine.md", "Learning Spine", spine)

    if selected_asset:
        asset = {
            "id": "A01", "paper_figure_id": "F01", "page": "3", "caption": "System overview",
            "source_path": "source-cache/figures/F01.png", "source_locator": "Figure 1, page 3",
            "type": "ARCHITECTURE", "teaching_role": "Explain shared and task-specific paths",
            "decision": "USE_DIRECTLY", "processing": "Use the original figure without modification",
            "derivative_path": "assets/figures/web/F01.png", "web_path": "public/images/F01.png",
            "evidence_refs": ["E01"], "source_paper_version": "arXiv v1",
            "source_location": "https://example.org/paper", "attribution": "Source: Figure 1",
            "reuse_rights": "Permission granted by the authors", "explanation": "Shows the method overview",
        }
    else:
        asset = {"id": "A01", "paper_figure_id": "F01", "type": "ARCHITECTURE", "decision": "REFERENCE_ONLY", "reason": "The source image is only retained for reference."}
    write_fenced_yaml(paper / "design/asset-plan.md", "Asset Plan", {"assets": [asset]})

    implementation = {
        "implementation": {
            "stages": [
                {"id": "S1", "page": "problem", "core_items": ["C01"], "evidence_refs": ["E01"], "primary_vehicle": "problem-map", "reusable_pattern": None, "reason": "Shows the task constraints."},
                {"id": "S2", "page": "mechanism", "core_items": ["C02", "C03"], "evidence_refs": ["E01"], "primary_vehicle": "architecture-explorer", "reusable_pattern": "ArchitectureExplorer", "reason": "Makes the data paths visible."},
            ],
            "assets": [{"asset": "A01", "stage": "S2", "rendering": "original"}] if selected_asset else [],
            "supporting": [{"item": "S11", "placement": "compact-inline"}],
            "reference": [{"item": "R03", "placement": "Reference Hub"}],
            "vertical_slice": {"stages": ["S1", "S2"], "required_core_items": ["C01", "C02"]},
        }
    }
    write_fenced_yaml(paper / "design/implementation-plan.md", "Implementation Plan", implementation)
    with (paper / "design/implementation-plan.md").open("a", encoding="utf-8") as handle:
        handle.write("\n## Primary Spine Mapping\n\n## Reusable Pattern Library\n\n## Vertical Slice (W6)\n\n### Vertical Slice Review (W7)\n\nVertical Slice Review: PASS\n")
    write_manifest(paper, complete_core={"C01": ("S1", "Problem", "complete"), "C02": ("S2", "ArchitectureExplorer", "complete"), "C03": ("S2", "ArchitectureExplorer", "planned")})
    (paper / "web/enhanced/src").mkdir(parents=True, exist_ok=True)
    (paper / "web/enhanced/package.json").write_text(json.dumps({"name": "demo-paper", "scripts": {"build": "vite build"}}), encoding="utf-8")
    (paper / "web/enhanced/package-lock.json").write_text("{}\n", encoding="utf-8")
    (paper / "web/enhanced/src/App.tsx").write_text("export default function App() { return <main />; }\n", encoding="utf-8")

    save_config(config_path, config)
    module = load_paper_module(root)
    return root, paper, config_path, module


def write_fenced_yaml(path, title, data):
    path.write_text("# {}\n\n```yaml\n{}\n```\n".format(title, yaml.safe_dump(data, sort_keys=False)), encoding="utf-8")


def write_manifest(paper, complete_core=None):
    complete_core = complete_core or {
        "C01": ("S1", "Problem", "complete"),
        "C02": ("S2", "ArchitectureExplorer", "complete"),
        "C03": ("S2", "ArchitectureExplorer", "planned"),
    }
    data = {
        "implemented_core": {
            item_id: {"stage": stage, "component": component, "status": status}
            for item_id, (stage, component, status) in complete_core.items()
        },
        "supporting": {"S11": {"placement": "compact-inline"}},
        "reference": {"R03": {"placement": "Reference Hub"}},
    }
    (paper / "web/enhanced/implementation-manifest.json").write_text(json.dumps(data, indent=2), encoding="utf-8")


def load_paper_module(root):
    module_path = root / "tools" / "paper.py"
    name = "paper_workflow_v3_{}".format(abs(hash(str(root))))
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_config(path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def save_config(path, config):
    path.write_text(yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")


def mark_prior_stages_complete(config, target_stage):
    for stage in STAGES[:STAGES.index(target_stage)]:
        entry = config["workflow"]["stages"][STAGE_KEYS[stage]]
        entry["status"] = "complete"
        if stage in HUMAN_STAGES:
            entry["reviewed_by"] = "Earlier reviewer"
            entry["note"] = "Previously accepted."
            entry.pop("completed_by", None)
        else:
            entry["completed_by"] = "automation"
            entry.pop("reviewed_by", None)
            entry.pop("note", None)
    config["workflow"]["current_stage"] = target_stage


def set_stage(config, stage, status="complete", reviewer="Reviewer"):
    entry = config["workflow"]["stages"][STAGE_KEYS[stage]]
    entry["status"] = status
    if stage in HUMAN_STAGES:
        entry["reviewed_by"] = reviewer
        entry["note"] = "Human review accepted."
    else:
        entry["completed_by"] = "automation"


def write_export(root, config, paper, with_asset=False):
    config["release"] = {
        "upstream_paper_name": "sample_paper_name",
        "upstream_version": "ada0926",
        "output": "html_output/sample_paper_name/ada0926",
    }
    output = root / config["release"]["output"]
    required = [
        "README.md", "package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json",
        "src/App.tsx", "src/data/tutorial.ts", "src/modules/registry.tsx", "src/styles/paper.css",
    ]
    for relative in required:
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("## Asset provenance\n" if relative == "README.md" else "{}\n", encoding="utf-8")
    (output / "paper.json").write_text(json.dumps({"paperName": "sample_paper_name", "version": "ada0926"}), encoding="utf-8")
    (output / "package.json").write_text("{}\n", encoding="utf-8")
    if with_asset:
        (output / "public/images").mkdir(parents=True, exist_ok=True)
        (output / "public/images/F01.png").write_bytes(b"exported-figure")
    return output


def write_upstream_report(paper, config, exit_code=0):
    report = {
        "upstream_commit": "a" * 40,
        "paper_name": config["release"]["upstream_paper_name"],
        "version": config["release"]["upstream_version"],
        "commands": [
            {"command": "npm run import", "exit_code": 0},
            {"command": "npm run validate", "exit_code": 0},
            {"command": "npm run build:paper", "exit_code": 0},
            {"command": "npm run preflight", "exit_code": exit_code},
        ],
        "status": "PASS" if exit_code == 0 else "FAIL",
    }
    (paper / "audit/upstream-preflight.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report
