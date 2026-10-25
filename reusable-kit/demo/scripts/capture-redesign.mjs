import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [stage = 'baseline', output = '../../../.qa/kit-redesign-20261025'] = process.argv.slice(2);
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
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 900 });
    await page.goto('http://127.0.0.1:4186/?demo=gallery');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(directory, `hero-${width}.png`) });
    for (const [name, selector] of [['network','[data-network-example="local"]'], ['parallel','[data-network-example="parallel"]'], ['forward','[data-timeline-example="forward"]'], ['specimen','#gallery-specimen']]) {
      const target = page.locator(selector);
      if (await target.count()) await target.screenshot({ path: resolve(directory, `${name}-${width}.png`) });
    }
    console.log(JSON.stringify({ width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }));
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`CAPTURE_PASS: ${directory}`);
} finally {
  await browser?.close();
  server.kill();
}
