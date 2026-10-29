import {formulaLessonChecks} from "./formula-lessons.mjs";
import {reviewFeedbackChecks} from "./review-feedback.mjs";
import {fullW8Checks} from "./w8-browser.mjs";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,dirname,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {lifecycleBrowserChecks,lifecycleFocusBrowserChecks} from "./lifecycle-browser.mjs";
import {RESERVOIR_STEPS} from "../src/modules/reservoir-model.ts";
import {probabilityComparison,logitComparison} from "../src/modules/math-model.ts";
const require=createRequire(new URL("../../../../../reusable-kit/demo/package.json",import.meta.url));
const {chromium}=require("playwright");
const source=resolve(dirname(fileURLToPath(import.meta.url)),".."),dist=resolve(source,"dist");
const output=process.env.DER_REVIEW_DIR;
let browser,count=0;
const check=(v,msg)=>{count++;assert.ok(v,msg);};
const near=(a,b,msg)=>check(Math.abs(a-b)<1e-8,msg);
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost"),relative=url.pathname.replace(/^\/der-review\//,"");
  if(!url.pathname.startsWith("/der-review/"))throw Error("Outside base");
  const file=resolve(dist,relative||"index.html");
  if(!file.startsWith(dist+sep))throw Error("Outside dist");
  const data=await readFile(file);res.setHeader("Content-Type",({".js":"application/javascript",".css":"text/css",".html":"text/html",".svg":"image/svg+xml"})[extname(file)]||"application/octet-stream");res.end(data);
 }catch{res.writeHead(404);res.end();}
});
try{
 await new Promise((r,j)=>{server.once("error",j);server.listen(0,"127.0.0.1",r)});
 const base=`http://127.0.0.1:${server.address().port}/der-review/`;
 const launchOptions={headless:true};
 if(process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE)launchOptions.executablePath=process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE;
 browser=await chromium.launch(launchOptions);
 console.log(`Browser ${browser.version()} Node ${process.version}`);
 if(output)await mkdir(output,{recursive:true});
 for(const [width,height] of [[1440,900],[1920,1080]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1}),page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));page.on("requestfailed",r=>errors.push(r.url()));page.on("response",r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.clock.install();await page.clock.pauseAt(new Date());
  const shot=async(name,selector)=>{if(!output)return;const target=selector?page.locator(selector):page;await target.screenshot({path:resolve(output,`${name}-${width}.png`)});};
  if(process.argv.includes("--formula-only")){await formulaLessonChecks({page,base,check,shot});check(!errors.length,`No browser errors: ${errors}`);console.log(`FORMULA_BROWSER_PASS ${width}x${height} assertions=${count}`);await context.close();continue;}
  if(process.argv.includes("--review-feedback")){await reviewFeedbackChecks({page,base,check,shot});check(!errors.length,`No browser errors: ${errors}`);console.log(`FEEDBACK_BROWSER_PASS ${width}x${height} assertions=${count}`);await context.close();continue;}
  if(process.argv.includes("--w8-only")){await fullW8Checks({page,base,check,shot});check(!errors.length,`No browser errors: ${errors}`);console.log(`W8_BROWSER_PASS ${width}x${height} assertions=${count}`);await context.close();continue;}
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  check(await page.locator("[data-design]").count()===2,"Approved scenes are in real reading source");
  check(await page.locator("iframe").count()===0,"Production does not bridge local services");
  check(await page.locator("#reservoir").count()===1,"Reservoir is in reading spine");
  if(!process.argv.includes("--reservoir-only")){
  for(const name of ["kl","logits"]){
   const scene=page.locator(`[data-design=${name}]`);
   check(await scene.getAttribute("data-status")==="paused","Initial scene is paused");
   for(const c of name==="kl"?["near","equal","reversed"]:["swapped","shifted"]){
    await scene.locator(`[data-case=${c}]`).click();
    for(let i=0;i<(name==="kl"?6:4);i++){
     await scene.locator(`[data-frame="${i}"]`).click();
     await scene.locator("[data-play]").click();await page.clock.runFor(1900);await scene.locator("[data-play]").click();
     const data=await scene.locator(".scene-canvas").evaluate(el=>({...el.dataset}));
     if(name==="kl"){const p=data.p.split(",").map(Number),q=data.q.split(",").map(Number);near(+data.loss,probabilityComparison(p,q).kl,"KL source math remains equal");}
     else{const result=logitComparison(data.z.split(",").map(Number),data.a.split(",").map(Number));near(+data.loss,result.squaredDistance,"Scores and displayed sum share model");if(c==="shifted")near(result.probabilityKL,0,"Common shift preserves probabilities");}
     if(c===(name==="kl"?"near":"shifted")&&[1,2,3].includes(i))await shot(`${name}-${i}`,`[data-design=${name}]`);
    }
   }
   const bad=await scene.evaluate(el=>[...el.querySelectorAll(".frames button,.stage math,.formula-lesson math,.source-tag,.narration")].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.className||e.tagName));
   check(!bad.length,`Core math and labels fit ${name}: ${bad}`);
   await scene.locator("[data-frame='0']").click();await scene.locator("[data-play]").click();await page.clock.runFor(600);await scene.locator("[data-play]").click();
   const paused=await scene.getAttribute("data-progress");await page.clock.runFor(500);check(paused===await scene.getAttribute("data-progress"),"Pause holds exact frame");
   await scene.locator("[data-back]").click();near(+(await scene.getAttribute("data-progress")),0,"Back first reaches current stage start");
  }
  await page.locator(".site-header .text-button").click();
  await page.locator("[data-reference-term=reservoir]").click();
  check((await page.locator("[data-reference-detail]").innerText()).includes("K/n"),"Probability explanation lives in Reference");
  await page.keyboard.press("Escape");check(!await page.locator("dialog").isVisible(),"Reference closes with Escape");
  // Existing protected lifecycle tests are retained unchanged.
  await lifecycleBrowserChecks({page,base,check,shot});
  await lifecycleFocusBrowserChecks({page,base,check,shot});
  }
  await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(base+"?focus=reservoir");const scene=page.locator("[data-scene=reservoir]");
  for(let i=0;i<4;i++){
   await scene.locator("select").selectOption(String(i));
   check(+(await scene.getAttribute("data-seen"))===i,"Stage navigation restores inherited pre-insertion N");
   const before=RESERVOIR_STEPS[i];
   check(await scene.getAttribute("data-memory")===before.before.M.map(r=>r.id).join(","),"Stage snapshot derives from prior exact memory");
   await scene.locator("[data-play]").click();
   const duration=i<2?6500:8000;
   await page.clock.runFor(duration*.7);
   near(+(await scene.getAttribute("data-seen")),i,"Count changes only at completed write/reject");
   await scene.locator("[data-play]").click();
   const position=await scene.locator(`[data-record="${before.candidate.id}"]`).getAttribute("transform");
   await page.clock.runFor(500);
   check(position===await scene.locator(`[data-record="${before.candidate.id}"]`).getAttribute("transform"),"Moving record pauses in place");
   if(i>=2)await shot(`reservoir-${i}-motion`);
   await scene.locator("[data-play]").click();await page.clock.runFor(duration*.31);await scene.locator("[data-play]").click();
   near(+(await scene.getAttribute("data-seen")),i+1,"Every input increments N including rejection");
   check(await scene.getAttribute("data-memory")===before.after.M.map(r=>r.id).join(","),"Append/replacement/rejection ends in model state");
   for(const r of before.after.M)check(await scene.locator(`[data-record="${r.id}"][data-frozen="${r.z.join(",")}"]`).count()===1,"Record identity and frozen values persist");
   await shot(`reservoir-${i}-result`);
   await scene.locator("[data-back]").click();check(await scene.getAttribute("data-committed")==="false","Back restores pre-insertion state");
  }
  await scene.locator("[data-replay]").click();await page.clock.runFor(40000);
  check(await scene.getAttribute("data-status")==="finished","Whole four-item sequence plays through and stops");
  check(await scene.getAttribute("data-seen")==="4","Whole sequence increments N exactly four times");
  check(await scene.locator("[data-time-readout]").innerText()==="播放结束","Reservoir omits debug times by default");
  const geometry=await scene.locator(".rv-canvas").evaluate(svg=>{
   const outer=svg.getBoundingClientRect();
   return [...svg.querySelectorAll("text,rect")].filter(el=>{if(+getComputedStyle(el).opacity===0)return false;const b=el.getBoundingClientRect();return b.x<outer.x-1||b.right>outer.right+1||b.y<outer.y-1||b.bottom>outer.bottom+1}).map(el=>el.textContent||el.tagName);
  });check(!geometry.length,`Reservoir graphics stay inside actual canvas ${geometry}`);
  await page.emulateMedia({reducedMotion:"reduce"});await page.reload();
  for(let i=0;i<4;i++){
   await scene.locator("select").selectOption(String(i));
   near(+(await scene.getAttribute("data-progress")),1,"Reduced motion uses complete semantic result");
   check(+(await scene.getAttribute("data-seen"))===i+1,"Reduced motion retains count and outcomes");
   const snapshot=await scene.getAttribute("data-memory");await page.clock.runFor(2000);check(snapshot===await scene.getAttribute("data-memory"),"Reduced motion has no drift");
  }
  await scene.locator("[data-back]").focus();const focus=await scene.locator("[data-back]").evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));check(focus.style!=="none"&&focus.width>=2,"Keyboard focus is visible");
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"No page overflow in desktop layouts");
  if(!process.argv.includes("--reservoir-only")){await formulaLessonChecks({page,base,check,shot});await fullW8Checks({page,base,check,shot});await reviewFeedbackChecks({page,base,check,shot});}
  check(!errors.length,`No production or subpath resource errors: ${errors}`);
  console.log(`BROWSER_PASS ${width}x${height}, assertions=${count}`);await context.close();
 }
 console.log(`BROWSER_ASSERTIONS_PASS: ${count}; FULLSCREEN_REAL=NOT_RUN (headless layout only)`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
