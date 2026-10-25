"""Compile and operate real recipes and every Registry minimal usage in isolation."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

import yaml

REPO = Path(__file__).resolve().parents[3]


def run(args, cwd):
    print('COMMAND:', subprocess.list2cmdline([str(a) for a in args]), flush=True)
    subprocess.run([str(a) for a in args], cwd=cwd, check=True)


def main():
    parent = Path(tempfile.gettempdir()).resolve()
    root = Path(tempfile.mkdtemp(prefix='kit-advanced-scaffold-', dir=parent)).resolve()
    print('ISOLATED_ROOT:', root, flush=True)
    succeeded = False
    try:
        for name in ('tools', 'templates', 'reusable-kit'):
            shutil.copytree(REPO / name, root / name, ignore=shutil.ignore_patterns('node_modules', 'dist', 'test-results', '__pycache__', 'demo'))
        (root / 'papers').mkdir()
        cli = [sys.executable, root / 'tools/paper.py']
        run([*cli, 'new', 'copy-check', '--title', 'Independent source copy check', '--url', 'https://example.org/copy-check'], root)
        run([*cli, 'scaffold-kit', 'copy-check', '--select', 'MiniNetworkGlyph', '--allow-unapproved'], root)
        web = root / 'papers/copy-check/web/enhanced'
        shared = web / 'src/shared'
        assert len([p for p in shared.rglob('*') if p.is_file()]) == 5, 'Minimal Glyph copied excess source'
        css = shared / 'foundation/styles/kit.css'
        css.write_text(css.read_text(encoding='utf-8') + '\n/* paper-owned local edit */\n', encoding='utf-8')
        owned_css = css.read_bytes()
        selected = 'SampleToken,FeatureBlocks,FeatureAggregation,RepresentationVector,ResponseMeter,FlowConnector,SemanticMark,useAnimationTimeline,MathTypography,EditorialTypography'
        run([*cli, 'scaffold-kit', 'copy-check', '--select', selected, '--allow-unapproved'], root)
        assert css.read_bytes() == owned_css, 'Incremental copy overwrote a local edit'
        assert not (shared / 'foundation/controls/Button.tsx').exists()

        exports = []
        for recipe, filename, style, names in [
            ('mini-network-glyph', 'NetworkExamples', 'network-examples', ['LocalNetworkExample', 'ParallelModelsExample']),
            ('animation-timeline', 'ForwardTimelineExample', 'forward-timeline-example', ['ForwardTimelineExample']),
            (None, 'RetrievalExample', 'retrieval-example', ['RetrievalExample']),
            (None, 'PartsSpecimen', 'parts-specimen', ['PartsSpecimen']),
            (None, 'VisualSpecimen', 'visual-specimen', ['VisualSpecimen']),
        ]:
            actual = (REPO / f'reusable-kit/demo/src/examples/{filename}.tsx').read_text(encoding='utf-8').replace('../../../foundation/', './shared/foundation/')
            style_source = (REPO / f'reusable-kit/demo/src/examples/{style}.css').read_text(encoding='utf-8')
            if recipe:
                text = (REPO / f'reusable-kit/recipes/{recipe}.md').read_text(encoding='utf-8')
                assert text.split('```tsx\n', 1)[1].split('```', 1)[0] == actual, f'{recipe} TSX drift'
                assert text.split('```css\n', 1)[1].split('```', 1)[0] == style_source, f'{recipe} CSS drift'
            (web / f'src/{filename}.tsx').write_text(actual, encoding='utf-8')
            (web / f'src/{style}.css').write_text(style_source, encoding='utf-8')
            exports.append((filename, names))
        registry = yaml.safe_load((root / 'reusable-kit/registry.yaml').read_text(encoding='utf-8'))['components']
        snippets, imports = [], []
        for name, entry in registry.items():
            if 'usage' in entry:
                source = entry['source'].rsplit('.', 1)[0]
                imports.append(f'import {{ {name} }} from "./shared/{source}";')
                snippets.append(entry['usage'])
        (web / 'src/RegistryExamples.tsx').write_text('\n'.join(imports) + '\nexport function RegistryExamples(){return <div data-registry-examples>' + ''.join(snippets) + '</div>}', encoding='utf-8')
        exports.append(('RegistryExamples', ['RegistryExamples']))
        imports = '\n'.join(f'import {{ {", ".join(names)} }} from "./{file}";' for file, names in exports)
        components = ''.join(f'<{name} />' for _, names in exports for name in names)
        (web / 'src/App.tsx').write_text(imports + '\nimport "./shared/foundation/styles/kit.css";\nexport default function App(){return <main style={{maxWidth:1160, margin:"24px auto", padding:20, fontFamily:"var(--rk-font-body)"}}>' + components + '</main>}', encoding='utf-8')
        npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm')
        node = shutil.which('node')
        assert npm and node
        run([npm, 'ci', '--prefer-offline', '--no-audit', '--no-fund'], web)
        run([npm, 'run', 'build'], web)
        script = r'''
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';
import {chromium} from __PLAYWRIGHT__;
const probe=createServer(); await new Promise(r=>probe.listen(0,'127.0.0.1',r)); const port=probe.address().port; await new Promise(r=>probe.close(r));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:__WEB__,stdio:'inherit'});
let browser;
try {
 const url=`http://127.0.0.1:${port}/`;
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{} await delay(100);}
 browser=await chromium.launch({headless:true,...(process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE?{executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto(url);
 const local=page.locator('[data-network-example="local"]');
 assert.equal(await local.locator('[data-network-edge]').count(),30);
 await local.getByRole('button').click();
 assert.equal(await local.locator('[data-network-edge].is-focused').count(),2);
 const forward=page.locator('[data-timeline-example="forward"]');
 for(const id of ['sample','extractor','representation','scores','responses']){
  await forward.locator(`[data-stage-target="${id}"]`).click();
  for(const selector of ['.pg-forward-system','.pg-forward-note','.pg-forward-output']) assert.equal(await forward.locator(selector).getAttribute('data-stage'),id);
 }
 assert.deepEqual(await forward.locator('.pg-class-scores meter').evaluateAll(ns=>ns.map(n=>n.value)),[2,0,-1]);
 assert.deepEqual(await forward.locator('.pg-class-responses meter').evaluateAll(ns=>ns.map(n=>n.value)),[2,0,-1].map(v=>1/(1+Math.exp(-v))));
 // A copied paper can theme the shared palette without any Gallery overrides.
 await page.evaluate(()=>{const el=document.documentElement;
  el.style.setProperty('--rk-accent-soft','rgb(220, 234, 214)');
  el.style.setProperty('--rk-warn-soft','rgb(250, 237, 211)');
 });
 for(const selector of ['.rk-vector-coordinate__positive i','.pg-class-scores [data-value="2"] .rk-response-meter__fill','.pg-class-responses .rk-response-meter__fill']){
  assert.equal(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(220, 234, 214)');
 }
 assert.equal(await page.locator('.rk-feature-aggregation__bar').first().evaluate(el=>getComputedStyle(el).fill),'rgb(220, 234, 214)');
 for(const selector of ['.rk-vector-coordinate__negative i','.pg-class-scores [data-value="-1"] .rk-response-meter__fill']){
  assert.equal(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(250, 237, 211)');
 }
 await page.evaluate(()=>{const el=document.documentElement;el.style.removeProperty('--rk-accent-soft');el.style.removeProperty('--rk-warn-soft');});
 const retrieval=page.locator('[data-retrieval-query]');
 await retrieval.getByRole('button').click();
 assert.deepEqual(await retrieval.locator('meter').evaluateAll(ns=>ns.map(n=>n.value)),[-1,1.5]);
 assert.equal(await page.locator('[data-registry-examples] > *').count(),__SNIPPETS__);
 assert.equal(await page.locator('[role="alert"]').count(),0);
 for(const width of [1440,1920,390]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 assert.deepEqual(errors,[]);
 console.log('SCAFFOLD_BROWSER=PASS: exact three-file Glyph, incremental edits, Registry usages, real scenes, shared palette theming, synchronized state, signed retrieval, 390/1440/1920 and no Gallery stylesheet');
}finally{await browser?.close(); server.kill();}
'''.replace('__PLAYWRIGHT__', json.dumps((REPO / 'reusable-kit/demo/node_modules/playwright/index.mjs').as_uri())).replace('__WEB__', json.dumps(str(web))).replace('__SNIPPETS__', str(len(snippets)))
        (root / 'check-browser.mjs').write_text(script, encoding='utf-8')
        run([node, root / 'check-browser.mjs'], root)
        succeeded = True
    finally:
        if succeeded:
            assert root.parent == parent and root.name.startswith('kit-advanced-scaffold-') and not root.is_symlink()
            shutil.rmtree(root)
            assert not root.exists()
            print('SCAFFOLD_CLEANED:', root, flush=True)
        else:
            print('FAILURE_EVIDENCE_RETAINED:', root, flush=True)


if __name__ == '__main__':
    main()
