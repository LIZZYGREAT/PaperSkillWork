"""W0 fixed foundation regression; historical selection is retired."""
from test_paper_cli import make_project, create_paper, invoke, snapshot_files, load_paper_module

def test_new_fixed_foundation_and_no_overwrite(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    shared = root / 'papers/demo-paper/web/enhanced/src/shared'
    module = load_paper_module(root)
    assert {p.relative_to(shared).as_posix() for p in shared.rglob('*') if p.is_file()} == set(module.FOUNDATION_FILES)
    for relative in module.FOUNDATION_FILES:
        assert (shared / relative).read_bytes() == (root / 'reusable-kit' / relative).read_bytes()
    before = snapshot_files(root / 'papers')
    assert create_paper(root).returncode != 0
    assert snapshot_files(root / 'papers') == before

def test_missing_source_leaves_no_partial_workspace(tmp_path):
    root = make_project(tmp_path)
    (root / 'reusable-kit/core/reference/TermRef.tsx').unlink()
    assert create_paper(root).returncode != 0
    assert not (root / 'papers/demo-paper').exists()

def test_template_collision_rolls_back(tmp_path):
    root = make_project(tmp_path)
    target = root / 'templates/web-project/src/shared/core/reference/TermRef.tsx'
    target.parent.mkdir(parents=True)
    target.write_text('custom', encoding='utf-8')
    assert create_paper(root).returncode != 0
    assert not (root / 'papers/demo-paper').exists()
    assert target.read_text(encoding='utf-8') == 'custom'

def test_copy_failure_rolls_back(tmp_path, monkeypatch):
    root = make_project(tmp_path)
    module = load_paper_module(root)
    def fail(*args, **kwargs):
        raise OSError('simulated disk failure')
    monkeypatch.setattr(module.shutil, 'copytree', fail)
    assert module.main(['new','demo-paper','--title','Test','--url','https://example.org']) == 2
    assert not (root / 'papers/demo-paper').exists()

def test_no_external_runtime_or_paper_facts(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    source = root / 'papers/demo-paper/web/enhanced/src'
    text = '\n'.join(p.read_text(encoding='utf-8') for p in source.rglob('*') if p.is_file())
    assert '../../reusable-kit' not in text
    hub = (source / 'shared/core/reference/ReferenceHub.tsx').read_text(encoding='utf-8')
    for forbidden in ['papers/der', 'term-data', '2004.07211', 'Buzzega', '"kl"']:
        assert forbidden not in hub
    assert 'reusable_pattern' not in (root / 'papers/demo-paper/design/implementation-plan.md').read_text(encoding='utf-8')
    assert 'scaffold-kit' not in invoke(root, '--help').stdout
