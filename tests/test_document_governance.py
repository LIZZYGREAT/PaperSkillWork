from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).absolute().parents[1]
SKILLS = sorted((ROOT / ".agents" / "skills").glob("*/SKILL.md"))
DOCS = sorted((ROOT / "docs").glob("*.md"))
ENTRY_DOCS = [ROOT / "README.md", ROOT / "AGENTS.md"]
MARKDOWN_FILES = [*ENTRY_DOCS, *DOCS, *SKILLS]


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


def test_reading_note_relative_links_resolve_unicode_names_and_attachments(tmp_path):
    notes = tmp_path / "source" / "notes"
    attachments = notes / "attachments"
    attachments.mkdir(parents=True)
    source = notes / "DER论文笔记.md"
    source.write_text("![示意图](attachments/example%20plot.png)\n[前置知识](DER前置知识.md#推导)\n", encoding="utf-8")
    image = attachments / "example plot.png"
    image.write_bytes(b"attachment")
    prerequisite = notes / "DER前置知识.md"
    prerequisite.write_text("# 推导\n", encoding="utf-8")
    assert _local_target(source, "attachments/example%20plot.png") == image
    assert _local_target(source, "DER前置知识.md#推导") == prerequisite


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
