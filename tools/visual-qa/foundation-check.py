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
    parser.add_argument('--upstream-root', type=Path, help='Run current PaperSkill syntax and output validators against a temporary valid fixture')
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
        assert 'Formula and reading layout' not in production, 'Development fixture leaked into production'
        assert '40 项求和排版示例' not in production, 'Development fixture leaked into production'
        output = args.output.resolve() if args.output else Path(scratch) / 'screenshots'
        command = ['node', str(ROOT / 'tools/visual-qa/foundation-browser.mjs'), str(standalone), str(output)]
        if args.compare_der:
            command.append(str(ROOT / 'papers/der/web/enhanced'))
        run(command)
        if args.upstream_root:
            scripts = args.upstream_root.resolve() / 'paper-skill/scripts'
            syntax_check = scripts / 'syntax-check.js'
            validate_output = scripts / 'validate-output.js'
            for script in (syntax_check, validate_output):
                if not script.is_file():
                    raise FileNotFoundError('Required PaperSkill validator not found: {}'.format(script))
            (standalone / 'src/data/tutorial.ts').write_text('''import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: { titleEn: "Compatibility fixture", titleZh: "兼容性样例" },
  references: [{
    id: "compatibility-reference",
    name: "兼容性资料",
    definition: "仅用于临时验证默认页面可以打开资料面板。",
    source: "临时 Foundation 兼容检查。",
  }],
  chapters: [{
    kind: "chapter",
    id: "compatibility-chapter",
    title: "兼容性验证章节",
    titleHighlight: "验证",
    summary: "仅用于临时验证上游输出结构。",
    modules: [{
      kind: "module",
      id: "compatibility-module",
      title: "注册模块",
      desc: "此模块只用于结构兼容检查。",
      componentId: "compatibility-module",
    }],
  }],
};
''', encoding='utf-8')
            (standalone / 'src/modules/registry.tsx').write_text('''import type { ComponentType } from "react";
import type { WidgetProps } from "../types";

function CompatibilityModule({ chapterId, moduleId }: WidgetProps) {
  return <p>{chapterId}: {moduleId}</p>;
}

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  "compatibility-module": CompatibilityModule,
};
''', encoding='utf-8')
            run([npm, 'run', 'build'], standalone)
            run(['node', str(syntax_check), str(standalone), '--require-parser'])
            run(['node', str(validate_output), str(standalone)])
            populated_output = output / 'populated'
            run(['node', str(ROOT / 'tools/visual-qa/foundation-browser.mjs'), str(standalone), str(populated_output), '--populated'])

if __name__ == '__main__':
    main()
