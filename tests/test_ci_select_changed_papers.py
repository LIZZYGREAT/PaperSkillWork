"""Git-diff selection tests using local temporary repositories only."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).absolute().parents[1]
SELECTOR = ROOT / "tools" / "ci" / "select-changed-papers.py"
ZERO_SHA = "0" * 40


class GitFixture:
    def __init__(self, root: Path):
        self.root = root
        self._git("init", "-b", "main")
        self._git("config", "user.name", "PaperSkillWork Tests")
        self._git("config", "user.email", "tests@example.invalid")

    def _git(self, *args: str) -> str:
        result = subprocess.run(
            ["git", "-C", str(self.root), *args],
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()

    def write(self, relative: str, content: str = "fixture\n") -> None:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def commit(self, message: str) -> str:
        self._git("add", "-A")
        self._git("commit", "-m", message)
        return self._git("rev-parse", "HEAD")

    def paper(self, paper_id: str, *, web_variant: str | None = None) -> None:
        self.write(f"papers/{paper_id}/paper.yaml", f"id: {paper_id}\n")
        self.write(f"papers/{paper_id}/research/notes.md")
        if web_variant:
            web = f"papers/{paper_id}/web/{web_variant}"
            self.write(f"{web}/package.json", '{"scripts":{"build":"vite build"}}\n')
            self.write(f"{web}/src/main.ts", "export {};\n")


class ChangedPaperSelectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(dir=ROOT)
        self.repo_path = Path(self.temporary.name) / "fixture"
        self.repo_path.mkdir()
        self.repo = GitFixture(self.repo_path)
        self.repo.write("README.md", "Fixture repository\n")
        self.base = self.repo.commit("initial")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def select(self, base: str | None = None, *, head: str = "HEAD", fallback: str | None = None):
        command = [
            sys.executable,
            str(SELECTOR),
            "--repo",
            str(self.repo_path),
            "--base",
            base or self.base,
            "--head",
            head,
        ]
        if fallback:
            command.extend(("--fallback-ref", fallback))
        return subprocess.run(command, capture_output=True, text=True, check=False)

    def payload(self, result: subprocess.CompletedProcess[str]):
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_single_paper_change_selects_workspace_but_not_web(self) -> None:
        self.repo.write("papers/ewc/research/notes.md", "updated\n")
        head = self.repo.commit("update one paper")
        result = self.payload(self.select(head=head))
        self.assertEqual(result["changed_papers"], ["ewc"])
        self.assertEqual(result["changed_web_projects"], [])

    def test_two_papers_are_both_selected(self) -> None:
        self.repo.write("papers/ewc/research/notes.md", "ewc\n")
        self.repo.write("papers/icarl/design/notes.md", "icarl\n")
        head = self.repo.commit("update two papers")
        result = self.payload(self.select(head=head))
        self.assertEqual(result["changed_papers"], ["ewc", "icarl"])

    def test_paper_research_change_does_not_select_browser_project(self) -> None:
        self.repo.paper("icarl", web_variant="enhanced")
        base = self.repo.commit("add iCaRL")
        self.repo.write("papers/icarl/research/notes.md", "paper-only edit\n")
        head = self.repo.commit("edit research notes")
        result = self.payload(self.select(base, head=head))
        self.assertEqual(result["changed_papers"], ["icarl"])
        self.assertEqual(result["changed_web_projects"], [])

    def test_only_web_source_selects_its_web_project(self) -> None:
        self.repo.paper("icarl", web_variant="enhanced")
        base = self.repo.commit("add iCaRL")
        self.repo.write("papers/icarl/web/enhanced/src/main.ts", "export const changed = true;\n")
        head = self.repo.commit("edit iCaRL page")
        result = self.payload(self.select(base, head=head))
        self.assertEqual(result["changed_web_projects"], [{"paper_id": "icarl", "dir": "papers/icarl/web/enhanced"}])

    def test_new_paper_and_web_project_are_selected_on_first_add(self) -> None:
        self.repo.paper("new-study", web_variant="enhanced")
        head = self.repo.commit("add new paper")
        result = self.payload(self.select(head=head))
        self.assertEqual(result["changed_papers"], ["new-study"])
        self.assertEqual(result["changed_web_projects"], [{"paper_id": "new-study", "dir": "papers/new-study/web/enhanced"}])

    def test_multi_commit_range_includes_all_changes(self) -> None:
        first = self.base
        self.repo.write("papers/ewc/research/one.md", "one\n")
        self.repo.commit("first paper change")
        self.repo.write("papers/icarl/research/two.md", "two\n")
        head = self.repo.commit("second paper change")
        result = self.payload(self.select(first, head=head))
        self.assertEqual(result["changed_papers"], ["ewc", "icarl"])

    def test_rename_accounts_for_old_and_new_paper_paths(self) -> None:
        self.repo.paper("old-study", web_variant="enhanced")
        base = self.repo.commit("add old paper")
        new_web = self.repo_path / "papers/new-study/web/enhanced"
        shutil.move(str(self.repo_path / "papers/old-study"), str(new_web.parent.parent))
        head = self.repo.commit("rename paper directory")
        result = self.payload(self.select(base, head=head))
        self.assertEqual(result["changed_papers"], ["new-study", "old-study"])
        self.assertEqual(result["deleted_papers"], ["old-study"])
        self.assertEqual(result["changed_web_projects"], [{"paper_id": "new-study", "dir": "papers/new-study/web/enhanced"}])

    def test_kit_change_is_reported_without_paper_matrix(self) -> None:
        self.repo.write("reusable-kit/core/example.ts", "export {};\n")
        head = self.repo.commit("edit kit")
        result = self.payload(self.select(head=head))
        self.assertTrue(result["kit_changed"])
        self.assertFalse(result["shared_qa_changed"])
        self.assertEqual(result["changed_web_projects"], [])

    def test_shared_qa_change_adds_only_ewc_and_icarl_smoke(self) -> None:
        self.repo.paper("ewc", web_variant="enhanced")
        self.repo.paper("icarl", web_variant="enhanced")
        base = self.repo.commit("add representative web projects")
        self.repo.write("tools/visual-qa/cli.mjs", "// changed\n")
        head = self.repo.commit("edit visual QA")
        result = self.payload(self.select(base, head=head))
        self.assertTrue(result["shared_qa_changed"])
        self.assertEqual(
            result["changed_web_projects"],
            [
                {"paper_id": "ewc", "dir": "papers/ewc/web/enhanced"},
                {"paper_id": "icarl", "dir": "papers/icarl/web/enhanced"},
            ],
        )

    def test_unknown_baseline_fails_without_trusted_fallback(self) -> None:
        result = self.select("missing-base")
        self.assertEqual(result.returncode, 2)
        self.assertIn("refusing to return an empty selection", result.stderr)

    def test_first_push_uses_trusted_target_merge_base(self) -> None:
        self.repo.write("docs/target-base.md", "trusted target\n")
        target = self.repo.commit("target branch base")
        self.repo._git("branch", "target")
        self.repo.write("papers/ewc/research/notes.md", "branch change\n")
        head = self.repo.commit("first pushed commit")
        result = self.payload(self.select(ZERO_SHA, head=head, fallback="target"))
        self.assertEqual(result["base"], target)
        self.assertEqual(result["base_source"], "merge-base:target")
        self.assertEqual(result["changed_papers"], ["ewc"])

    def test_unrelated_file_change_selects_no_paper_or_web(self) -> None:
        self.repo.write("docs/notes.md", "docs only\n")
        head = self.repo.commit("edit docs")
        result = self.payload(self.select(head=head))
        self.assertEqual(result["changed_papers"], [])
        self.assertEqual(result["changed_web_projects"], [])
        self.assertFalse(result["kit_changed"])
        self.assertFalse(result["shared_qa_changed"])


if __name__ == "__main__":
    unittest.main()
