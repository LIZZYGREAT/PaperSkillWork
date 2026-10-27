import { createServer } from "node:http";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { createRequire } from "node:module";
const require=createRequire(new URL("../../../../../reusable-kit/demo/package.json",import.meta.url));
const {chromium}=require("playwright");
const output=resolve(process.env.DER_ANIMATION_EVIDENCE || ".visual-qa/der-w7-animation/playback");
const root=resolve("papers/der/web/enhanced/dist");
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);const file=resolve(root,pathname==="/"?"index.html":pathname.slice(1));if(!file.startsWith(root+sep))throw Error();const data=await readFile(file);res.setHeader("Content-Type",file.endsWith(".js")?"application/javascript":file.endsWith(".css")?"text/css":"text/html");res.end(data)}catch{res.writeHead(404);res.end()}});
let browser;
try{
 await mkdir(output,{recursive:true});await new Promise(r=>server.listen(4195,"127.0.0.1",r));
 browser=await chromium.launch({headless:true,executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"});
 const report={browser:browser.version(),process:"real requestAnimationFrame, no virtual clock",runs:[]};
 const widths=(process.env.DER_ANIMATION_VIEWPORTS || "1440,1920").split(",").map(Number);
 for(const width of widths){
  const height=width===1440?900:1080;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,...(process.env.DER_RECORD_VIDEO?{recordVideo:{dir:output,size:{width,height}}}:{})});
  const page=await context.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));await page.goto("http://127.0.0.1:4195/?review=1");await page.evaluate(()=>document.fonts.ready);
  for(const id of (process.env.DER_ANIMATION_SCENES || "kl,logits,freeze").split(",")){
   const scene=page.locator(`[data-scene='${id}']`),canvas=scene.locator(".motion-canvas, .lifecycle-canvas");
   if(id==="logits")await scene.locator("[data-case=shifted]").click();
   if(id==="lifecycle")await scene.locator("#lifecycle-player").evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-100));
   else{await canvas.scrollIntoViewIfNeeded();await page.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-270),await canvas.elementHandle());}
   await scene.locator("[data-replay]").click();
   const frames=[],start=Date.now();let n=0;const dir=resolve(output,`${id}-${width}`);await mkdir(dir,{recursive:true});
   const deadline=Math.max(30000,Number(await scene.locator("progress").getAttribute("max"))+12000);
   const seen=new Set();
   while(true){
    const state=await scene.evaluate(el=>({clip:Number(el.dataset.clip),progress:Number(el.dataset.progress),status:el.dataset.status,time:el.querySelector('[data-time-readout]').textContent}));
    const name=`${String(n++).padStart(4,'0')}.png`;
    if(width===widths[0]){await canvas.screenshot({path:resolve(dir,name)});frames.push({file:name,ms:Date.now()-start,...state});}
    if(!seen.has(state.clip)&&state.progress>.4){seen.add(state.clip);await page.screenshot({path:resolve(output,`${id}-${width}-clip-${state.clip}-viewport.png`)});}
    if(state.status==="finished")break;
    if(Date.now()-start>deadline)throw new Error(`${id} failed to finish`);
    await page.waitForTimeout(width===widths[0]?130:60);
   }
   await writeFile(resolve(dir,"frames.json"),JSON.stringify(frames,null,2));
   await scene.screenshot({path:resolve(output,`${id}-${width}-complete.png`)});
   report.runs.push({id,width,height,inner:await page.evaluate(()=>[innerWidth,innerHeight]),elapsed:Date.now()-start,frames:frames.length,errors});
   console.log(`REAL_PLAYBACK_PASS ${id} ${width}x${height} ${Date.now()-start}ms frames=${frames.length}`);
  }
  const video=page.video();await page.close();await context.close();
  if(video)await rename(await video.path(),resolve(output,`playback-${width}.webm`));
 }
 await writeFile(resolve(output,process.env.DER_ANIMATION_SCENES ? `playback-${process.env.DER_ANIMATION_SCENES}.json` : "playback.json"),JSON.stringify(report,null,2));
}finally{await browser?.close();server.close()}
