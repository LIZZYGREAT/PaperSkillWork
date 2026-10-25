import json
from pathlib import Path

import pytest

from test_paper_cli import make_project, create_paper, invoke, snapshot_files, load_paper_module


def setup_copy(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    return root, root / 'papers/demo-paper/web/enhanced/src/shared'


def copy(root, names, *extra):
    return invoke(root, 'scaffold-kit', 'demo-paper', '--select', names, '--allow-unapproved', *extra)


def test_exact_closure_dry_run_and_idempotence(tmp_path):
    root, shared = setup_copy(tmp_path)
    result = copy(root, 'MiniNetworkGlyph', '--dry-run')
    assert result.returncode == 0, result.stderr
    files = json.loads(result.stdout)['files']
    assert files == ['foundation/neural-network/MiniNetworkGlyph.tsx', 'foundation/neural-network/mini-network-glyph.css', 'foundation/styles/kit.css']
    assert not shared.exists()
    assert copy(root, 'MiniNetworkGlyph').returncode == 0
    before = snapshot_files(shared)
    assert copy(root, 'MiniNetworkGlyph').returncode == 0
    assert snapshot_files(shared) == before
    assert len(before) == 5  # three files plus version and provenance


def test_incremental_copy_retains_user_edits_and_records_union(tmp_path):
    root, shared = setup_copy(tmp_path)
    assert copy(root, 'MiniNetworkGlyph').returncode == 0
    css = shared / 'foundation/styles/kit.css'
    css.write_text(css.read_text(encoding='utf-8') + '\n/* paper-owned edit */', encoding='utf-8')
    before = css.read_bytes()
    result = copy(root, 'ResponseMeter')
    assert result.returncode == 0, result.stderr
    assert '[KEEP] Local edit retained' in result.stdout
    assert css.read_bytes() == before
    manifest = json.loads((shared / 'KIT_SELECTION.json').read_text(encoding='utf-8'))
    assert set(manifest['components']) == {'MiniNetworkGlyph', 'ResponseMeter'}
    assert not (shared / 'foundation/controls/Button.tsx').exists()


def test_changed_upstream_dependency_conflicts_before_any_write(tmp_path):
    root, shared = setup_copy(tmp_path)
    assert copy(root, 'MiniNetworkGlyph').returncode == 0
    (root / 'reusable-kit/foundation/styles/kit.css').write_text('/* changed source */', encoding='utf-8')
    before = snapshot_files(shared)
    result = copy(root, 'ResponseMeter')
    assert result.returncode != 0
    assert 'foundation/styles/kit.css' in result.stderr and 'no files were written' in result.stderr
    assert snapshot_files(shared) == before


@pytest.mark.parametrize('dependency', ['mini-network-glyph.css', 'MissingHook.ts', 'MissingTypes.ts'])
def test_missing_css_hook_or_type_dependency_fails_without_partial_copy(tmp_path, dependency):
    root, shared = setup_copy(tmp_path)
    glyph = root / 'reusable-kit/foundation/neural-network/MiniNetworkGlyph.tsx'
    if dependency.endswith('.css'):
        (glyph.parent / dependency).unlink()
    else:
        glyph.write_text(glyph.read_text(encoding='utf-8') + '\nimport "./' + dependency + '";', encoding='utf-8')
    result = copy(root, 'MiniNetworkGlyph')
    assert result.returncode != 0
    assert dependency in result.stderr
    assert not shared.exists()


def test_unmanaged_collision_and_blocked_parent_are_atomic(tmp_path):
    root, shared = setup_copy(tmp_path)
    shared.mkdir()
    (shared / 'foundation').write_text('paper content', encoding='utf-8')
    before = snapshot_files(shared)
    result = copy(root, 'ResponseMeter')
    assert result.returncode != 0 and 'conflicts' in result.stderr
    assert snapshot_files(shared) == before


@pytest.mark.parametrize('relative', ['../escape.ts', 'C:/escape.ts', 'C:escape.ts', '/escape.ts', 'foundation\\escape.ts'])
def test_paths_cannot_escape_kit(tmp_path, relative):
    module = load_paper_module(make_project(tmp_path))
    with pytest.raises(module.PaperError):
        module.kit_file(tmp_path, relative)


def test_no_implicit_preset(tmp_path):
    root, shared = setup_copy(tmp_path)
    result = invoke(root, 'scaffold-kit', 'demo-paper', '--allow-unapproved')
    assert result.returncode != 0 and 'Choose --select' in result.stderr
    assert not shared.exists()
