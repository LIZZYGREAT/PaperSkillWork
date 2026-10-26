import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const args = process.argv.slice(2);
const [stage = 'baseline', output = '../../../.qa/kit-redesign-20261025'] = args.filter(arg => !arg.startsWith('--'));
const sections = (args.find(arg => arg.startsWith('--sections='))?.split('=')[1] || 'network').split(',');
const targets = [['network','#gallery-mini-network [data-network-example="local"]'], ['parallel','#gallery-mini-network [data-network-example="parallel"]'], ['forward','#gallery-timeline [data-timeline-example="forward"]'], ['specimen','#gallery-specimen'], ['parts','#gallery-parts'], ['catalog','#gallery-catalog'], ['retrieval','#gallery-retrieval [data-retrieval-query]']];
if (sections.some(name => name !== 'all' && !targets.some(([id]) => id === name))) throw new Error('Unknown --sections target');
const directory = resolve(output, stage);
await mkdir(directory, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186', '--strictPort'], { stdio: 'inherit' });
let browser;
try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error('Preview exited');
    try { if ((await fetch('http://127.0.0.1:4186')).ok) break; } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ executablePath: process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const heroCandidate = stage === 'candidate-b' ? 'b' : stage === 'candidate-a' ? 'a' : null;
  for (const width of args.includes('--mobile') ? [1440, 1920, 390] : [1440, 1920]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 900 });
    await page.goto(`http://127.0.0.1:4186/?demo=gallery${heroCandidate ? `&hero=${heroCandidate}` : ''}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(directory, `hero-${width}.png`) });
    if (heroCandidate) {
      const opening = page.locator('#gallery-opening');
      if (await opening.getAttribute('data-hero-candidate') !== heroCandidate) throw new Error(`Expected hero candidate ${heroCandidate} at ${width}px`);
      await opening.screenshot({ path: resolve(directory, `opening-full-${width}.png`) });
      await opening.locator('.pg-model-composition').screenshot({ path: resolve(directory, `mechanism-${width}.png`) });
    }
    const positions = {};
    for (const [name, selector] of targets.filter(([id]) => sections.includes('all') || sections.includes(id))) {
      const target = page.locator(selector);
      if (await target.count()) {
        positions[name] = await target.evaluate(el => { const b = el.getBoundingClientRect(); return { x:b.x, y:b.y+scrollY, width:b.width, height:b.height }; });
        await target.screenshot({ path: resolve(directory, `${name}-${width}.png`) });
      }
    }
    await writeFile(resolve(directory, `positions-${width}.json`), JSON.stringify(positions));
    if (stage === 'final' && (sections.includes('all') || sections.includes('network'))) {
      await page.locator('#gallery-mini-network [data-network-example="local"] button').click();
      await page.locator('#gallery-mini-network [data-network-example="local"]').screenshot({ path: resolve(directory, `focus-${width}.png`) });
    }
    if (stage === 'final' && (sections.includes('all') || sections.includes('parts'))) {
      await page.locator('#gallery-parts summary').click();
      await page.locator('#gallery-parts details').screenshot({ path: resolve(directory, `inspect-${width}.png`) });
    }
    if (stage === 'final' && (sections.includes('all') || sections.includes('retrieval'))) {
      await page.locator('#gallery-retrieval [data-retrieval-query] button').click();
      await page.locator('#gallery-retrieval [data-retrieval-query]').screenshot({ path: resolve(directory, `retrieval-changed-${width}.png`) });
    }
    if (stage === 'final' && (sections.includes('all') || sections.includes('forward'))) {
      await page.locator('[data-stage-target="responses"]').click();
      await page.locator('[data-timeline-example="forward"]').screenshot({ path: resolve(directory, `responses-${width}.png`) });
    }
    console.log(JSON.stringify({ width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), parts: await page.locator('#gallery-parts').evaluateAll(nodes => nodes.map(el => ({ client: el.clientWidth, scroll: el.scrollWidth, offenders: [...el.querySelectorAll('*')].filter(n => n.scrollWidth > n.clientWidth + 1).map(n => [n.className, n.clientWidth, n.scrollWidth]) }))) }));
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`CAPTURE_PASS: ${directory}`);
} finally {
  await browser?.close();
  server.kill();
}
