import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import {resolve, dirname, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {REFERENCE_P, PROBABILITY_CASES, HISTORY_Z, LOGIT_CASES, probabilityComparison, logitComparison} from '../../../web/enhanced/src/modules/math-model.ts';
const here=dirname(fileURLToPath(import.meta.url)), repo=resolve(here,'../../../../..');
const require=createRequire(resolve(repo,'reusable-kit/demo/package.json'));
const {chromium}=require('playwright');
const output=resolve(repo,process.env.DER_S2_OUTPUT||'.visual-qa/der-s2-r3/review');
const design=resolve(repo,'.visual-qa/der-s2/design-build');
const source=resolve(here,'../../../web/enhanced/dist');
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname), lc=path.startsWith('/lifecycle/');
    const root=lc?source:design, file=resolve(root,(lc?path.slice(11):path.slice(1))||'index.html');
    if(!file.startsWith(root+sep))throw Error('Outside preview');
    const body=await readFile(file);res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(body);
  }catch{res.writeHead(404);res.end();}
});
let browser, count=0;
const check=(ok,message)=>{count++;assert.ok(ok,message);};
const near=(a,b,message,tol=1e-9)=>check(Math.abs(a-b)<tol,`${message}: ${a} vs ${b}`);
try{
 await mkdir(output,{recursive:true});await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)});
 const base=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({headless:true,executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const report={browser:browser.version(),build:'independent S2 production dist',fullscreenReal:'NOT_RUN',runs:[]};
 for(const [width,height] of [[1440,900],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page=await context.newPage(), errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
   await page.clock.install();await page.clock.pauseAt(new Date());
   const state=()=>page.locator('[data-design]').evaluate(e=>({clip:+e.dataset.clip,p:+e.dataset.progress,status:e.dataset.status}));
   const data=()=>page.locator('.scene-canvas').evaluate(e=>Object.fromEntries(Object.entries(e.dataset).map(([k,v])=>[k,k==='loss'?+v:v.split(',').map(Number)])));
   const go=async scene=>{await page.goto(`${base}?scene=${scene}`);await page.evaluate(()=>document.fonts.ready)};
   const seek=async(i,t=0)=>{await page.locator(`[data-frame="${i}"]`).click();if(t){await page.locator('[data-play]').click();await page.clock.runFor(t);await page.locator('[data-play]').click()}};
   const shot=async name=>page.screenshot({path:resolve(output,`${name}-${width}.png`),fullPage:true});
   const geometry=async()=>{
     const g=await page.evaluate(()=>{
       const outside=[],small=[];
       for(const e of document.querySelectorAll('.stage math,.mainline-math math,.frames button,.source-tag,.response-card h3,.projection-cell,.narration')){
         const b=e.getBoundingClientRect();if(b.x<0||b.right>innerWidth+.5||e.scrollWidth>e.clientWidth+2)outside.push(e.className||e.tagName);
       }
       for(const e of document.querySelectorAll('.sheet-code,.source-name,.pair-caption,.calculation-steps span,.frames button,.difference-row>span,.square-receipt>div>span')){if(parseFloat(getComputedStyle(e).fontSize)<12)small.push(e.textContent)}
       return {outside,small,overflow:document.documentElement.scrollWidth>innerWidth,inner:[innerWidth,innerHeight]};
     });
     check(!g.overflow&&!g.outside.length,`No clipped core content: ${JSON.stringify(g)}`);check(!g.small.length,'Core labels >=12px');
   };
   for(const scene of ['kl','logits']){
     await go(scene);check((await state()).status==='paused','Clear paused initial state');
     check(await page.locator('.time,[data-time-readout],.design-note').count()===0,'No default debug seconds or author notes');
     await geometry();await shot(`${scene}-initial`);
     const frames=scene==='kl'?6:4;
     for(let i=0;i<frames;i++){await seek(i);const s=await state();check(s.clip===i&&s.p===0&&s.status==='paused','Every stage selects its paused start');}
     await seek(1,1400);const mid=await state(), before=await data();check(mid.clip===1&&mid.p>0&&mid.p<1,'Real intermediate motion state');
     await page.clock.runFor(500);check(JSON.stringify(before)===JSON.stringify(await data()),'Pause freezes data');
     await page.locator('[data-back]').click();check((await state()).clip===1&&(await state()).p===0,'Back returns to current start');await page.locator('[data-back]').click();check((await state()).clip===0,'Second back returns prior stage');
   }
   await go('kl');
   for(const c of PROBABILITY_CASES){
     await page.locator(`[data-case="${c.id}"]`).click();check((await state()).clip===0&&(await state()).p===0,'KL preset resets');
     for(const [i,ms] of [[1,1400],[2,1900],[2,3800],[3,1900],[3,3800],[4,2700],[5,1400],[5,3100]]){
       await seek(i,ms);const d=await data(), expected=probabilityComparison(d.p,d.q);
       check(d.p.every((p,k)=>p===REFERENCE_P[k]),'p remains fixed');near(d.q.reduce((a,b)=>a+b,0),1,'q normalized');near(d.loss,expected.kl,'KL computed from displayed p/q');
       for(let k=0;k<2;k++){
         const masses=await page.locator(`.distribution-sheet:nth-child(2) [data-probability-category="${['Claude','GPT'][k]}"]`).getAttribute('data-mass');near(+masses,d.q[k],'Area sourced from q');
         near(+(await page.locator(`[data-origin-kl="${k}"]`).getAttribute('data-focused-contribution')),expected.terms[k],'Signed answer sourced from same math');
       }
       await geometry();
       if(c.id==='near'&&((i===2&&ms===1900)||(i===3&&ms===3800)||i===4||(i===5&&ms===3100)))await shot(`kl-${i}-${ms}`);
     }
     near((await data()).loss,0,'Return q to p reaches KL zero');
   }
   await seek(4,2700);await page.locator('.background-note summary').click();await geometry();await shot('kl-proof');
   await go('logits');
   for(const c of LOGIT_CASES){
     await page.locator(`[data-case="${c.id}"]`).click();check((await state()).clip===0,'Logit preset resets');
     const persistent=await page.locator('[data-current-marker]').evaluateAll(es=>{es.forEach((e,i)=>e.setAttribute('data-identity',String(i)));return es.length});check(persistent===3,'Three continuing markers');
     for(const [i,ms] of [[1,900],[1,1900],[1,3300],[2,1200],[2,2600],[2,4100],[3,1600],[3,3200]]){
       await seek(i,ms);const d=await data(),expected=logitComparison(HISTORY_Z,d.a);
       check(d.z.every((z,k)=>z===HISTORY_Z[k]),'Historical z fixed');near(d.loss,expected.squaredDistance,'Same-source square distance');
       near(+(await page.locator('[data-probability-kl]').getAttribute('data-probability-kl')),expected.probabilityKL,'Same-source probability KL');
       if(c.id==='shifted'){for(let k=0;k<3;k++)near(d.a[k]-d.z[k],d.a[0]-d.z[0],'All logits move together');near(expected.probabilityKL,0,'Probabilities identical throughout common shift');}
       for(let k=0;k<3;k++){
         const card=page.locator(`[data-coordinate="${k}"]`), track=card.locator('.score-track');
         near(+(await track.getAttribute('data-current-position')),d.a[k],'Track identity and live data');near(+(await track.locator('[data-current-marker]').getAttribute('cx')),30+d.a[k]*84,'Common score scale');
         check(await track.locator(`[data-current-marker][data-identity="${k}"]`).count()===1,'Same moving DOM marker across stages');
         const projected=page.locator('.projection-cell').nth(k);
         near(+(await projected.locator('[data-projection-p]').getAttribute('data-projection-p')),expected.p[k],'p from z');near(+(await projected.locator('[data-projection-q]').getAttribute('data-projection-q')),expected.q[k],'q from a');
         if(c.id==='shifted'){const x=+(await projected.locator('circle').getAttribute('cx')),old=+(await projected.locator('rect').getAttribute('x'))+8;near(x,old,'Actual probability markers overlap');}
       }
       const svgText=await page.locator('.score-track').evaluateAll(svgs=>svgs.flatMap(svg=>{const labels=[...svg.querySelectorAll('text')].map(e=>({t:e.textContent,b:e.getBoundingClientRect()}));return labels.flatMap((a,i)=>labels.slice(i+1).filter(c=>Math.min(a.b.right,c.b.right)-Math.max(a.b.left,c.b.left)>1&&Math.min(a.b.bottom,c.b.bottom)-Math.max(a.b.top,c.b.top)>1).map(c=>[a.t,c.t]));}));check(svgText.length===0,`Track labels do not collide ${JSON.stringify(svgText)}`);await geometry();if([1900,2600,3200].includes(ms))await shot(`${c.id}-${i}-${ms}`);
     }
     near((await data()).loss,c.id==='swapped'?2:3,'Final expected distance');
   }
   for(const scene of ['kl','logits']){
     await go(scene);await seek(scene==='kl'?2:3);
     await page.locator('[data-play]').click();
     for(let n=0;n<95;n++){
       await page.clock.runFor(50);
       const overlap=await page.evaluate(()=>[...document.querySelectorAll('.result-transfer')].flatMap((copy,k)=>{
         const target=document.querySelector(document.querySelector('[data-design=kl]')?`[data-target-kl="${k}"]`:`[data-target-square="${k}"]`);
         return parseFloat(getComputedStyle(copy).opacity)>.05&&parseFloat(getComputedStyle(target).opacity)>.05?[copy.dataset.transfer]:[];
       }));check(overlap.length===0,`No doubled value at receiving handoff: ${overlap}`);
     }
   }
   // Reduced motion has complete manually readable semantic frames; no drift.
   for(const scene of ['kl','logits']){
     await page.emulateMedia({reducedMotion:'reduce'});await go(scene);await page.locator(`[data-frame="${scene==='kl'?4:3}"]`).click();
     check((await state()).p===1&&(await state()).status==='paused','Reduced motion complete semantic result');
     const before=await data();await page.clock.runFor(5000);check(JSON.stringify(before)===JSON.stringify(await data()),'Reduced motion no autoplay');await geometry();
   }
   check(errors.length===0,`No browser errors: ${errors.join(',')}`);
   report.runs.push({width,height,inner:await page.evaluate(()=>[innerWidth,innerHeight]),errors});await context.close();
   console.log(`S2_BROWSER_PASS ${width}x${height} assertions=${count}`);
 }
 if(process.env.DER_S2_RECORD==='1'){
   for(const [scene,variant] of [['kl','near'],['logits','swapped'],['logits','shifted']]){
     const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,recordVideo:{dir:output,size:{width:1920,height:1080}}});
     const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
     await page.goto(`${base}?scene=${scene}`);await page.evaluate(()=>document.fonts.ready);await page.locator(`[data-case="${variant}"]`).click();
     await page.locator('[data-replay]').click();await page.locator('.stage').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-80));
     const samples=[],start=Date.now(),seen=new Set();
     while(Date.now()-start<45000){
       const s=await page.locator('[data-design]').evaluate(e=>({clip:+e.dataset.clip,p:+e.dataset.progress,status:e.dataset.status}));
       const d=await page.locator('.scene-canvas').evaluate(e=>({...e.dataset}));const parsed=Object.fromEntries(Object.entries(d).map(([k,v])=>[k,k==='loss'?+v:v.split(',').map(Number)]));const expected=scene==='kl'?probabilityComparison(parsed.p,parsed.q):logitComparison(parsed.z,parsed.a);near(parsed.loss,scene==='kl'?expected.kl:expected.squaredDistance,'Real playback same-source loss');if(variant==='shifted')near(expected.probabilityKL,0,'Real common shift keeps probabilities identical');samples.push({ms:Date.now()-start,...s,...d});
       if(s.p>.35&&!seen.has(s.clip)){seen.add(s.clip);await page.screenshot({path:resolve(output,`play-${scene}-${variant}-${s.clip}.png`)});}
       if(s.status==='finished')break;await page.waitForTimeout(180);
     }
     check(samples.at(-1).status==='finished','Real requestAnimationFrame completes');check(errors.length===0,'Real playback no errors');
     const video=page.video();await page.close();await context.close();await rename(await video.path(),resolve(output,`${scene}-${variant}-1920.webm`));
     await writeFile(resolve(output,`${scene}-${variant}-playback.json`),JSON.stringify({process:'real rAF, no virtual clock',samples,errors},null,2));
     console.log(`S2_REAL_PLAYBACK_PASS ${scene}/${variant} ${Date.now()-start}ms`);
   }
 }
 report.assertions=count;await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log(`PASS ${count} assertions. Evidence: ${output}`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
