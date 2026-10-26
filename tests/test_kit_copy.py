import json
from pathlib import Path

import pytest

from test_paper_cli import make_project, create_paper, invoke, snapshot_files, load_paper, save_paper, load_paper_module


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
    preview = json.loads(result.stdout)
    assert preview['publish_source'] == str((root / 'papers/demo-paper/web/enhanced').resolve())
    assert preview['destination'] == str(shared.resolve())
    files = preview['files']
    assert files == ['foundation/neural-network/MiniNetworkGlyph.tsx', 'foundation/neural-network/mini-network-glyph.css', 'foundation/styles/kit.css']
    assert not shared.exists()
    assert copy(root, 'MiniNetworkGlyph').returncode == 0
    before = snapshot_files(shared)
    assert copy(root, 'MiniNetworkGlyph').returncode == 0
    assert snapshot_files(shared) == before
    assert len(before) == 5  # three files plus version and provenance


def test_scaffold_kit_uses_resolved_final_source_for_dry_run_and_copy(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / 'papers/demo-paper'
    final_source = paper / 'web/final'
    (final_source / 'src').mkdir(parents=True)
    (final_source / 'src/App.tsx').write_text('export const finalSource = true;\n', encoding='utf-8')
    config_path, config = load_paper(root)
    config['web']['final'] = 'web/final'
    save_paper(config_path, config)

    dry_run = copy(root, 'MiniNetworkGlyph', '--dry-run')
    assert dry_run.returncode == 0, dry_run.stderr
    preview = json.loads(dry_run.stdout)
    final_shared = final_source / 'src/shared'
    enhanced_shared = paper / 'web/enhanced/src/shared'
    assert preview['publish_source'] == str(final_source.resolve())
    assert preview['destination'] == str(final_shared.resolve())
    assert not final_shared.exists() and not enhanced_shared.exists()

    result = copy(root, 'MiniNetworkGlyph')
    assert result.returncode == 0, result.stdout + result.stderr
    assert str(final_shared.relative_to(root / 'papers/demo-paper')).replace('\\', '/') in result.stdout
    assert (final_shared / 'foundation/neural-network/MiniNetworkGlyph.tsx').is_file()
    assert not enhanced_shared.exists()
    paths = invoke(root, 'paths', 'demo-paper', '--json')
    assert paths.returncode == 0, paths.stderr
    assert json.loads(paths.stdout)['publish_source'] == preview['publish_source']


def test_scaffold_kit_does_not_fall_back_when_configured_final_is_missing(tmp_path):
    root, enhanced_shared = setup_copy(tmp_path)
    config_path, config = load_paper(root)
    config['web']['final'] = 'web/final'
    save_paper(config_path, config)

    result = copy(root, 'MiniNetworkGlyph', '--dry-run')

    assert result.returncode != 0
    assert 'configured web.final source is missing: web/final' in result.stderr
    assert not enhanced_shared.exists()


def test_scaffold_kit_does_not_create_src_for_resolved_final_project(tmp_path):
    root = make_project(tmp_path)
    assert create_paper(root).returncode == 0
    paper = root / 'papers/demo-paper'
    final_source = paper / 'web/final'
    final_source.mkdir(parents=True)
    config_path, config = load_paper(root)
    config['web']['final'] = 'web/final'
    save_paper(config_path, config)

    result = copy(root, 'MiniNetworkGlyph', '--dry-run')

    assert result.returncode != 0
    assert 'Resolved publish source has no src directory' in result.stderr
    assert not (final_source / 'src').exists()
    assert not (paper / 'web/enhanced/src/shared').exists()


@pytest.mark.parametrize('example, assets, entry', [
    ('shared-input-models', {'MiniNetworkGlyph', 'SampleToken', 'FlowConnector', 'SemanticMark'}, 'NetworkExamples.tsx'),
    ('vector-retrieval', {'SampleToken', 'RepresentationVector', 'ResponseMeter'}, 'RetrievalExample.tsx'),
])
def test_complete_example_copies_real_source_css_docs_and_asset_closure(tmp_path, example, assets, entry):
    root, shared = setup_copy(tmp_path)
    dry_run = invoke(root, 'scaffold-kit', 'demo-paper', '--example', example, '--allow-unapproved', '--dry-run')
    assert dry_run.returncode == 0, dry_run.stderr
    preview = json.loads(dry_run.stdout)
    package_files = [path for path in preview['files'] if path.startswith('examples/{}/'.format(example))]
    assert preview['destination'] == str(shared.resolve())
    assert preview['examples'] == [example]
    assert entry in {Path(path).name for path in package_files}
    assert 'examples/{}/index.ts'.format(example) in package_files
    assert 'examples/{}/README.md'.format(example) in package_files
    assert 'examples/{}/example.yaml'.format(example) not in preview['files']
    assert assets.issubset(set(preview['included']))
    assert 'foundation/styles/kit.css' in preview['files']
    assert not shared.exists()

    result = invoke(root, 'scaffold-kit', 'demo-paper', '--example', example, '--allow-unapproved')
    assert result.returncode == 0, result.stdout + result.stderr
    package_root = shared / 'examples' / example
    assert (package_root / entry).is_file()
    assert (package_root / 'README.md').is_file()
    assert any(path.suffix == '.css' for path in package_root.iterdir())
    assert not (root / 'papers/demo-paper/web/enhanced/src/shared/foundation/controls/Button.tsx').exists()
    manifest = json.loads((shared / 'KIT_SELECTION.json').read_text(encoding='utf-8'))
    assert manifest['examples'] == [example]
    before = snapshot_files(shared)
    repeated = invoke(root, 'scaffold-kit', 'demo-paper', '--example', example, '--allow-unapproved')
    assert repeated.returncode == 0, repeated.stderr
    assert '0 new' in repeated.stdout
    assert snapshot_files(shared) == before


def test_complete_example_cannot_be_mixed_with_component_selection(tmp_path):
    root, shared = setup_copy(tmp_path)
    result = invoke(root, 'scaffold-kit', 'demo-paper', '--example', 'vector-retrieval', '--select', 'MiniNetworkGlyph', '--allow-unapproved')
    assert result.returncode != 0
    assert 'cannot be combined with --select or --preset' in result.stderr
    assert not shared.exists()


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
