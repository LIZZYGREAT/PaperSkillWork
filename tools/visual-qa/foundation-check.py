"""Build a generated, independent paper and run the foundation browser regression."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, help='Keep review screenshots at this explicit path')
    parser.add_argument('--compare-der', action='store_true', help='Compare with an already-built DER project')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='paper-foundation-') as scratch:
        root = Path(scratch) / 'workspace'
        (root / 'tools').mkdir(parents=True)
        (root / 'papers').mkdir()
        shutil.copy2(ROOT / 'tools/paper.py', root / 'tools/paper.py')
        shutil.copytree(ROOT / 'templates', root / 'templates', ignore=shutil.ignore_patterns('node_modules', 'dist', '__pycache__'))
        shutil.copytree(ROOT / 'reusable-kit', root / 'reusable-kit', ignore=shutil.ignore_patterns('node_modules', 'dist'))
        def run(command, cwd=root):
            print('+', ' '.join(map(str, command)), flush=True)
            subprocess.run(command, cwd=cwd, check=True)
        run([sys.executable, 'tools/paper.py', 'new', 'baseline-test', '--title', 'Foundation Test', '--url', 'https://example.org/test'])
        standalone = Path(scratch) / 'standalone'
        shutil.copytree(root / 'papers/baseline-test/web/enhanced', standalone)
        npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm')
        run([npm, 'ci'], standalone)
        run([npm, 'run', 'build'], standalone)
        production = '\n'.join(path.read_text(encoding='utf-8') for path in (standalone / 'dist').rglob('*.js'))
        assert 'Notation preview' not in production, 'Development fixture leaked into production'
        assert '长正文测试段落' not in production, 'Development fixture leaked into production'
        output = args.output.resolve() if args.output else Path(scratch) / 'screenshots'
        command = ['node', str(ROOT / 'tools/visual-qa/foundation-browser.mjs'), str(standalone), str(output)]
        if args.compare_der:
            command.append(str(ROOT / 'papers/der/web/enhanced'))
        run(command)

if __name__ == '__main__':
    main()
