"""Copy, compile and operate the documented Kit example deliveries in isolation."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


REPO = Path(__file__).resolve().parents[3]


def run(args, cwd):
    print('COMMAND:', subprocess.list2cmdline([str(arg) for arg in args]), flush=True)
    subprocess.run([str(arg) for arg in args], cwd=cwd, check=True)


def output(args, cwd):
    print('COMMAND:', subprocess.list2cmdline([str(arg) for arg in args]), flush=True)
    return subprocess.run([str(arg) for arg in args], cwd=cwd, text=True, capture_output=True, check=True)


def main():
    qa = REPO / '.qa'
    qa.mkdir(exist_ok=True)
    root = Path(tempfile.mkdtemp(prefix='kit-advanced-scaffold-', dir=qa)).resolve()
    print('ISOLATED_ROOT:', root, flush=True)
    succeeded = False
    try:
        for name in ('tools', 'templates', 'reusable-kit'):
            shutil.copytree(REPO / name, root / name, ignore=shutil.ignore_patterns('node_modules', 'dist', 'test-results', 'playwright-report', '__pycache__', 'demo'))
        shutil.copy2(REPO / '.gitignore', root / '.gitignore')
        (root / 'papers').mkdir()
        cli = [sys.executable, root / 'tools/paper.py']
        run([*cli, 'new', 'copy-check', '--title', 'Independent example delivery check', '--url', 'https://example.org/copy-check'], root)
        web = root / 'papers/copy-check/web/enhanced'
        shared = web / 'src/shared'

        for example in ('shared-input-models', 'vector-retrieval'):
            preview = output([*cli, 'scaffold-kit', 'copy-check', '--example', example, '--allow-unapproved', '--dry-run'], root)
            plan = json.loads(preview.stdout)
            assert plan['examples'] == [example]
            assert plan['destination'] == str(shared.resolve())
            assert f'examples/{example}/README.md' in plan['example_files']
            assert f'examples/{example}/index.ts' in plan['example_files']
            run([*cli, 'scaffold-kit', 'copy-check', '--example', example, '--allow-unapproved'], root)
            for relative in plan['files']:
                assert (shared / relative).is_file(), f'Missing copied delivery file: {relative}'
                if relative.startswith(f'examples/{example}/'):
                    assert (shared / relative).read_bytes() == (root / 'reusable-kit' / relative).read_bytes(), f'Delivery source drift: {relative}'

        manifest = json.loads((shared / 'KIT_SELECTION.json').read_text(encoding='utf-8'))
        assert set(manifest['examples']) == {'shared-input-models', 'vector-retrieval'}
        assert {'MiniNetworkGlyph', 'SampleToken', 'FlowConnector', 'SemanticMark', 'RepresentationVector', 'ResponseMeter'}.issubset(set(manifest['components']))
        assert not (shared / 'foundation/controls/Button.tsx').exists()
        assert not (shared / 'pattern-gallery.css').exists()
        assert (shared / 'examples/shared-input-models/network-examples.css').is_file()
        assert (shared / 'examples/vector-retrieval/retrieval-example.css').is_file()

        app = '''import './shared/foundation/styles/kit.css';
import { ParallelModelsExample } from './shared/examples/shared-input-models';
import { RetrievalExample } from './shared/examples/vector-retrieval';

export default function App() {
  return <main><ParallelModelsExample /><RetrievalExample /></main>;
}
'''
        (web / 'src/App.tsx').write_text(app, encoding='utf-8')
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
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok){ready=true;break;}}catch{} await delay(100);}
 assert(ready,'isolated preview server did not become ready');
 browser=await chromium.launch({headless:true,...(process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE?{executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto(url);
 const models=page.locator('[data-network-example="parallel"]');
 assert.equal(await models.locator('[data-model-path="teacher"][data-from="x"]').count(),1);
 assert.equal(await models.locator('[data-model-path="student"][data-from="x"]').count(),1);
 assert.equal(await models.locator('.pg-model[data-model-identity="frozen"] .rk-mini-network').count(),1);
 assert.equal(await models.locator('.pg-model[data-model-identity="trainable"] .rk-mini-network').count(),1);
 assert.equal(await models.locator('.pg-model-output').count(),2);
 assert.equal(await models.locator('.pg-shared-input').evaluate(el=>getComputedStyle(el,'::after').height),'18px');
 assert.equal(await models.locator('.pg-model-paths').evaluate(el=>getComputedStyle(el,'::before').height),'1px');
 const retrieval=page.locator('[data-retrieval-query]');
 assert.deepEqual(await retrieval.locator('meter').evaluateAll(ns=>ns.map(n=>n.value)),[2,-0.5]);
 await retrieval.getByRole('button',{name:'切换查询向量'}).click();
 assert.equal(await retrieval.getAttribute('data-retrieval-query'),'1');
 assert.deepEqual(await retrieval.locator('meter').evaluateAll(ns=>ns.map(n=>n.value)),[-1,1.5]);
 assert.match(await retrieval.locator('p[role="status"]').innerText(),/候选 b，1\.5/);
 for(const width of __WIDTHS__){await page.setViewportSize({width,height:width===1920?1080:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 assert.deepEqual(errors,[]);
 console.log('EXAMPLE_DELIVERY=PASS: exact package source/CSS, resolved copy target, shared input reaches both model paths, interactive dot-product retrieval, viewports='+JSON.stringify(__WIDTHS__)+' and no Gallery CSS');
}finally{await browser?.close(); server.kill();}
'''.replace('__WIDTHS__', '[1440,1920,390]' if '--mobile' in sys.argv else '[1440,1920]').replace('__PLAYWRIGHT__', json.dumps((REPO / 'reusable-kit/demo/node_modules/playwright/index.mjs').as_uri())).replace('__WEB__', json.dumps(str(web)))
        (root / 'check-browser.mjs').write_text(script, encoding='utf-8')
        run([node, root / 'check-browser.mjs'], root)
        succeeded = True
    finally:
        if succeeded:
            assert root.parent == qa.resolve() and root.name.startswith('kit-advanced-scaffold-') and not root.is_symlink()
            shutil.rmtree(root)
            assert not root.exists()
            print('SCAFFOLD_CLEANED:', root, flush=True)
        else:
            print('FAILURE_EVIDENCE_RETAINED:', root, flush=True)


if __name__ == '__main__':
    main()
