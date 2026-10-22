from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).absolute().parents[1]
SKILLS = sorted((ROOT / ".agents" / "skills").glob("*/SKILL.md"))
DOCS = sorted((ROOT / "docs").glob("*.md"))
ENTRY_DOCS = [ROOT / "README.md", ROOT / "AGENTS.md"]
MARKDOWN_FILES = [*ENTRY_DOCS, *DOCS, *SKILLS]
CASE_CATEGORIES = {
    "语义准确性",
    "状态与动画",
    "布局与可读性",
    "交互可用性",
    "图像坐标与缩放",
    "实施范围与回归",
}


def _prose(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    return re.sub(r"(?ms)^```.*?^```\s*", "", text)


def _local_target(source: Path, target: str) -> Path | None:
    target = target.strip()
    if target.startswith("<") and ">" in target:
        target = target[1 : target.index(">")]
    else:
        target = target.split(maxsplit=1)[0]
    if not target or target.startswith(("http://", "https://", "mailto:", "data:", "#")):
        return None
    target = unquote(target.split("#", 1)[0].split("?", 1)[0])
    if not target:
        return None
    return (source.parent / target).absolute()


def test_markdown_links_in_repository_guidance_resolve():
    broken = []
    link_pattern = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
    for source in MARKDOWN_FILES:
        for target in link_pattern.findall(_prose(source)):
            resolved = _local_target(source, target)
            if resolved is not None and not resolved.exists():
                broken.append(f"{source.relative_to(ROOT)} -> {target}")
    assert not broken, "Broken local Markdown links:\n" + "\n".join(broken)


def test_skills_reference_existing_repository_documents_and_templates():
    missing = []
    root_paths = re.compile(r"(?:docs|templates|tools|reusable-kit|\.agents)/[^\s`<>]+")
    code_span = re.compile(r"`([^`\n]+)`")
    for skill in SKILLS:
        for span in code_span.findall(_prose(skill)):
            match = root_paths.match(span)
            if not match:
                continue
            relative = match.group(0).rstrip(".,;:)")
            resolved = ROOT / relative.split("#", 1)[0]
            if not resolved.exists():
                missing.append(f"{skill.relative_to(ROOT)} -> {relative}")
    assert not missing, "Missing repository paths referenced by skills:\n" + "\n".join(missing)


def test_ui_case_ids_status_targets_and_categories_are_consistent():
    path = ROOT / "docs" / "ui-teaching-lessons.md"
    text = path.read_text(encoding="utf-8")
    headings = list(re.finditer(r"^### (UI-\d{3}) \| .+$", text, re.MULTILINE))
    ids = [match.group(1) for match in headings]
    assert ids, "The case index must contain at least one stable UI case ID."
    assert len(ids) == len(set(ids)), "UI case IDs must be unique."

    records = {}
    for index, heading in enumerate(headings):
        end = headings[index + 1].start() if index + 1 < len(headings) else len(text)
        records[heading.group(1)] = text[heading.start() : end]

    for case_id, record in records.items():
        category = re.search(r"^- \*\*类别\*\*：(.+)$", record, re.MULTILINE)
        status = re.search(r"^- \*\*状态\*\*：`?(active|merged|superseded)`?\s*$", record, re.MULTILINE)
        assert category and category.group(1).strip() in CASE_CATEGORIES, f"{case_id} needs one recognized category."
        assert status, f"{case_id} needs an explicit active/merged/superseded status."

        target = re.search(r"^- \*\*(?:替代案例|合并目标)\*\*：`?(UI-\d{3})`?\s*$", record, re.MULTILINE)
        state = status.group(1)
        if state == "active":
            assert not target, f"Active case {case_id} must not point to a replacement target."
        else:
            assert target, f"{state} case {case_id} must point to its target ID."
            target_id = target.group(1)
            assert target_id in records, f"{case_id} points to missing case {target_id}."
            assert target_id != case_id, f"{case_id} cannot target itself."
            target_status = re.search(r"^- \*\*状态\*\*：`?(active|merged|superseded)`?\s*$", records[target_id], re.MULTILINE)
            assert target_status and target_status.group(1) == "active", f"{case_id} should resolve to an active case."


def test_ui_case_index_anchors_match_github_heading_slugs():
    path = ROOT / "docs" / "ui-teaching-lessons.md"
    text = path.read_text(encoding="utf-8")
    case_index = text.split("## 案例", 1)[0]
    headings = re.findall(r"^### (UI-\d{3}) \| (.+)$", text, re.MULTILINE)
    indexed_slugs = re.findall(r"\[UI-\d{3}\]\(#([^)]+)\)", case_index)

    def github_heading_slug(title: str) -> str:
        return re.sub(r"[^\w -]", "", title.lower()).replace(" ", "-")

    heading_slugs = {
        github_heading_slug("{} | {}".format(case_id, title))
        for case_id, title in headings
    }
    assert indexed_slugs, "The UI case index must link to its cases."
    assert len(indexed_slugs) == len(set(indexed_slugs)), "The UI case index must not duplicate anchors."
    assert set(indexed_slugs) == heading_slugs, "Every case index anchor must match a GitHub-style heading slug."
