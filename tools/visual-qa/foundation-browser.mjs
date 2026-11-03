import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'node:net';

const [project, output, ...options] = process.argv.slice(2);
const der = options.find(option => option !== '--populated');
const populated = options.includes('--populated');
if (!project || !output) throw Error('Usage: node foundation-browser.mjs <standalone-project> <screenshots> [DER-project]');
const children = [];
async function serve(cwd, preview = false) {
  const probe = createServer();
  await new Promise(r => probe.listen(0, '127.0.0.1', r));
  const port = probe.address().port;
  await new Promise(r => probe.close(r));
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...(preview ? ['preview'] : []), '--configLoader', 'runner', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd, stdio: 'pipe', windowsHide: true });
  children.push(child);
  let log = '';
  child.stdout.on('data', b => { log += b; }); child.stderr.on('data', b => { log += b; });
  const base = `http://127.0.0.1:${port}/`;
  for (let i=0; i<150; i++) {
    if (child.exitCode !== null) throw Error(log);
    try { if ((await fetch(base)).ok) return base; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw Error(`Server timeout: ${log}`);
}
await mkdir(output, { recursive:true });
let browser;
try {
  const base = await serve(resolve(project));
  const derBase = der ? await serve(resolve(der), true) : null;
  browser = await chromium.launch({headless:true, ...(process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE ? {executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE} : {})});
  const results = [];
  for (const [width,height] of [[1440,900],[1920,1080]]) {
    const page = await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message)); page.on('requestfailed',r=>errors.push(r.url()));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    const shot = name => page.screenshot({path:resolve(output,`${name}-${width}.png`)});
    const geometry = () => page.locator('.reference-dialog').evaluate(el => {
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      const shell=getComputedStyle(el.querySelector('.reference-shell'));
      const heading=getComputedStyle(el.querySelector('header h2'));
      const eyebrow=getComputedStyle(el.querySelector('.eyebrow'));
      const close=el.querySelector('.close-button').getBoundingClientRect();
      const label=el.querySelector('.close-button-label').getBoundingClientRect();
      return {width:r.width,right:r.right,height:r.height,background:s.backgroundColor,padding:shell.padding,font:s.fontFamily,headingLeading:heading.lineHeight,eyebrowSize:eyebrow.fontSize,eyebrowLeading:eyebrow.lineHeight,closeButton:{width:close.width,height:close.height,labelCenterOffset:Math.abs((label.left+label.width/2)-(close.left+close.width/2))}};
    });
    let incumbent;
    let defaultHeading;
    const headingStyles = selector => page.locator(selector).first().evaluate(el => {
      const s=getComputedStyle(el);
      return {font:s.fontFamily,size:s.fontSize,leading:s.lineHeight,tracking:s.letterSpacing,color:s.color};
    });
    if (derBase) {
      await page.goto(derBase); await page.evaluate(()=>document.fonts.ready); await shot('der-closed');
      await page.locator('.site-header .text-button').click();
      incumbent=await geometry(); await shot('der-reference');
      for (const id of ['reservoir','kl']) {
        const tab=page.locator(`[data-reference-term="${id}"]`);
        if(await tab.count()) {await tab.click(); await shot(`der-reference-${id}`);}
      }
      await page.locator('.reference-dialog').evaluate(el=>el.scrollTop=el.scrollHeight); await shot('der-reference-scroll');
      await page.keyboard.press('Escape');
      const term=page.locator('.rk-term-ref:visible').first();
      if (await term.count()) { await term.hover(); await page.locator('.rk-term-popover').waitFor(); await shot('der-hover'); }
      else console.log('DER_HOVER=NOT_RUN: incumbent reading page has no visible TermRef trigger');
    }
    await page.goto(base);
    if (populated) {
      assert.equal(await page.locator('main h1').innerText(),'兼容性验证章节');
      assert.equal(await page.locator('main h1 mark.rk-highlight').innerText(),'验证');
      assert.equal(await page.locator('.site-header nav button').count(),1);
      assert.equal(await page.locator('.site-header nav button').getAttribute('aria-pressed'),'true');
      assert.equal((await page.locator('.site-brand').innerText()).includes('兼容性样例'),true);
      assert.equal((await page.locator('main').innerText()).includes('compatibility-chapter: compatibility-module'),true);
      const pageReference=page.locator('.site-header .rk-reference-button');
      await pageReference.click(); await page.locator('dialog[open]').waitFor();
      assert.equal(await page.locator('[data-reference-detail]').getAttribute('data-reference-detail'),'compatibility-reference');
      await page.locator('.close-button').click();
      assert.equal(await pageReference.evaluate(el=>el===document.activeElement),true);
      await shot('foundation-populated');
    } else {
      assert.equal(await page.locator('h1').innerText(),'论文教程项目已初始化');
      assert.equal(await page.locator('.module-card').count(),0);
    }
    defaultHeading=await headingStyles('main h1');
    await page.goto(base+'?style-preview=1'); await page.evaluate(()=>document.fonts.ready);
    await page.locator('h1').waitFor(); await shot('foundation-closed');
    const staggered=page.locator('.rk-equation--staggered:visible').first();
    const formulaLayout=await staggered.evaluate(el=>({rows:el.querySelectorAll('math').length,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,offsets:[...el.querySelectorAll('math')].slice(0,2).map(row=>getComputedStyle(row).marginLeft)}));
    assert.equal(formulaLayout.rows,8); assert.equal(formulaLayout.scrollWidth<=formulaLayout.clientWidth,true); assert.notEqual(formulaLayout.offsets[0],formulaLayout.offsets[1]);
    await staggered.scrollIntoViewIfNeeded(); await shot('foundation-staggered-equation'); await page.evaluate(()=>window.scrollTo(0,0));
    assert.deepEqual(await headingStyles('h1'),defaultHeading);
    assert.equal(await page.locator('h1 mark.rk-highlight').count(),1);
    assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily.includes('Aptos')),true);
    assert.equal(await page.locator(':root').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(247, 247, 242)');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.ok(await page.locator('mfrac').first().evaluate(el=>el.getBoundingClientRect().height)>20);
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const {root}=await cdp.send('DOM.getDocument');
    const fonts={};
    for(const selector of ['main p','math mi']) {
      const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
      fonts[selector]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
    }
    await cdp.detach();
    const trigger=page.locator('main > .rk-section .text-button');
    await trigger.click(); await page.locator('dialog[open]').waitFor(); await shot('foundation-reference');
    assert.equal(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
    const actual=await geometry(); if(incumbent) assert.deepEqual(actual,incumbent);
    assert.ok(actual.closeButton.width>=160); assert.ok(actual.closeButton.height>=52); assert.ok(actual.closeButton.labelCenterOffset<=1);
    await page.locator('dialog').evaluate(el=>el.scrollTop=el.scrollHeight); await shot('foundation-reference-scroll');
    await page.locator('.related-terms button').click();
    assert.equal(await page.locator('[data-reference-detail]').getAttribute('data-reference-detail'),'layout');
    assert.equal(await page.locator('dialog').evaluate(el=>el.scrollTop),0);
    assert.equal(await page.locator('.source-note').count(),0);
    await shot('foundation-related');
    await page.locator('.reference-back').click();
    assert.equal(await page.locator('[data-reference-detail]').getAttribute('data-reference-detail'),'notation');
    await page.keyboard.press('Escape'); await page.locator('dialog[open]').waitFor({state:'hidden'});
    assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
    await trigger.click(); await page.locator('.close-button').click(); assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
    await trigger.click(); await page.mouse.click(10,100); assert.equal(await page.locator('dialog[open]').count(),0);
    const term=page.locator('.rk-term-ref'); await term.hover(); await page.locator('.rk-term-popover').waitFor(); await shot('foundation-hover');
    await page.mouse.move(5,5); await page.keyboard.press('Escape');
    await term.focus(); await page.locator('.rk-term-popover').waitFor();
    await page.locator('.rk-term-popover__link').focus(); await page.keyboard.press('Enter');
    await page.locator('dialog[open]').waitFor(); await page.keyboard.press('Escape');
    await page.goto(base+'?style-preview=1&empty-reference=1'); await page.locator('h1').waitFor();
    await page.locator('main .text-button').click(); assert.equal(await page.locator('dialog[open]').count(),0);
    assert.equal((await page.locator('body').innerText()).includes('undefined'),false);
    await page.goto(base+'?style-preview=1&source-link=1'); await page.locator('h1').waitFor();
    await page.locator('main .text-button').click();
    assert.equal(await page.locator('.source-note a').getAttribute('href'),'https://example.org/reference');
    assert.equal(await page.locator('.source-note a').getAttribute('target'),'_blank');
    assert.deepEqual(errors,[]);
    results.push({width,height,geometry:actual,fonts,status:'PASS'}); await page.close();
  }
  console.log(JSON.stringify({browser:browser.version(),results,FULLSCREEN_REAL:'NOT_RUN: headless layout only'},null,2));
} finally {
  await browser?.close();
  for(const child of children) {child.kill(); await new Promise(r=>{if(child.exitCode!==null)return r();child.once('exit',r);});}
}
