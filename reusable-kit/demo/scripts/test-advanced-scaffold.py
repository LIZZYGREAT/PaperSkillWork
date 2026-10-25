"""Verify the two candidate recipes in a fresh, independent CLI-created workspace."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

REPO = Path(__file__).resolve().parents[3]


def run(args, cwd):
    print("COMMAND:", subprocess.list2cmdline([str(arg) for arg in args]), flush=True)
    subprocess.run([str(arg) for arg in args], cwd=cwd, check=True)


def main():
    # The test never creates a paper under the real repository.
    temp_parent = Path(tempfile.gettempdir()).resolve()
    root = Path(tempfile.mkdtemp(prefix="kit-advanced-scaffold-", dir=temp_parent)).resolve()
    print("ISOLATED_ROOT:", root, flush=True)
    succeeded = False
    try:
        for name in ("tools", "templates", "reusable-kit"):
            shutil.copytree(REPO / name, root / name, ignore=shutil.ignore_patterns(
                "node_modules", "dist", "test-results", ".playwright", "__pycache__", "demo"))
        (root / "papers").mkdir()
        cli = [sys.executable, root / "tools/paper.py"]
        run([*cli, "new", "copy-check", "--title", "Independent candidate copy check", "--url", "https://example.org/copy-check"], root)
        run([*cli, "scaffold-kit", "copy-check", "--add", "MiniNetworkGlyph,useAnimationTimeline", "--allow-unapproved"], root)
        web = root / "papers/copy-check/web/enhanced"
        # Compile and execute the actual recipe code, not a substitute fixture.
        exports = []
        for recipe, filename, names in [
            ("mini-network-glyph", "NetworkExamples", ["LocalNetworkExample", "ParallelModelsExample"]),
            ("animation-timeline", "ForwardTimelineExample", ["ForwardTimelineExample"]),
        ]:
            text = (REPO / f"reusable-kit/recipes/{recipe}.md").read_text(encoding="utf-8")
            source = text.split("```tsx\n", 1)[1].split("```", 1)[0]
            actual = (REPO / f"reusable-kit/demo/src/examples/{filename}.tsx").read_text(encoding="utf-8").replace("../../../foundation/", "./shared/foundation/")
            assert source == actual, f"Recipe {recipe} drifted from the compiled Gallery example"
            (web / f"src/{filename}.tsx").write_text(source, encoding="utf-8")
            exports.append((filename, names))
        imports = "\n".join(f'import {{ {", ".join(names)} }} from "./{file}";' for file, names in exports)
        components = "".join(f"<{name} />" for _, names in exports for name in names)
        css = (REPO / "reusable-kit/demo/src/pattern-gallery.css").read_text(encoding="utf-8")
        (web / "src/review.css").write_text(css, encoding="utf-8")
        (web / "src/App.tsx").write_text(imports + '\nimport "./shared/foundation/styles/kit.css";\nimport "./review.css";\nexport default function App() { return <main>' + components + '</main>; }\n', encoding="utf-8")
        npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
        node = shutil.which("node")
        assert npm and node
        run([npm, "ci", "--prefer-offline", "--no-audit", "--no-fund"], web)
        run([npm, "run", "build"], web)
        playwright_uri = (REPO / "reusable-kit/demo/node_modules/playwright/index.mjs").as_uri()
        browser_script = '''
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:net";
import { chromium } from __PLAYWRIGHT_IMPORT__;
const probe = createServer();
await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: __WEB_DIR__, stdio: "inherit" });
const exited = new Promise(resolve => server.once("exit", resolve));
let browser;
try {
  const url = `http://127.0.0.1:${port}/`;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch {}
    await delay(100);
  }
  assert(ready, "Fresh scaffold preview failed to start");
  browser = await chromium.launch({headless:true, ...(process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE } : {})});
  const page = await browser.newPage({ viewport: {width:1440,height:900}, reducedMotion:"reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(url);
  await page.waitForSelector("[data-network-example='local']");
  assert.equal(await page.locator(".rk-mini-network").count(), 3);
  await page.getByRole("button",{name:"聚焦局部连接",exact:true}).click();
  assert.equal(await page.locator("[data-network-edge].is-focused").count(),2);
  for (const id of ["sample","extractor","representation","scores","responses"]) {
    await page.locator(`[data-stage-target='${id}']`).click();
    for (const selector of [".pg-forward", ".pg-forward-system", ".pg-forward-note", ".pg-forward-output"]) assert.equal(await page.locator(selector).getAttribute("data-stage"),id);
  }
  const values = await page.locator("meter").evaluateAll(nodes => nodes.map(n=>n.value));
  assert.deepEqual(values, [2,0,-1].map(n=>1/(1+Math.exp(-n))));
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"Narrow scaffold overflowed");
  assert.deepEqual(errors,[]);
  console.log("SCAFFOLD_BROWSER=PASS: three Glyphs, focus, five synchronized stages, computed sigmoid, 390px, no browser/resource errors");
} finally {
  await browser?.close();
  server.kill();
  await Promise.race([exited,delay(3000)]);
}
'''.replace("__PLAYWRIGHT_IMPORT__", json.dumps(playwright_uri)).replace("__WEB_DIR__", json.dumps(str(web)))
        (root / "check-browser.mjs").write_text(browser_script, encoding="utf-8")
        run([node, root / "check-browser.mjs"], root)
        succeeded = True
    finally:
        if succeeded:
            # Verify the exact absolute target and its original parent before recursive deletion.
            assert root.parent == temp_parent and root.name.startswith("kit-advanced-scaffold-")
            assert not root.is_symlink()
            print("CLEANUP_TARGET:", root, flush=True)
            shutil.rmtree(root)
            assert not root.exists()
            print("SCAFFOLD_CLEANED:", root, flush=True)
        else:
            print("FAILURE_EVIDENCE_RETAINED:", root, flush=True)


if __name__ == "__main__":
    main()
