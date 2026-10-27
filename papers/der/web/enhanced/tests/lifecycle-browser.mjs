import assert from "node:assert/strict";

export async function lifecycleBrowserChecks({page,base,check,shot}) {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()));
  await page.goto(`${base}?review=1#review-lifecycle`,{waitUntil:"networkidle"});
  // A hash-only navigation can retain the earlier reduced-motion component.
  await page.reload({waitUntil:"networkidle"});
  const scene=page.locator("[data-scene=lifecycle]");
  const canvasBox=await scene.locator("svg").boundingBox(),readingBox=await page.locator(".reading-layout").boundingBox();
  check(canvasBox.width>=readingBox.width*.95,"Scene uses the reading width even in short windows");
  const labelPx=await scene.locator("svg .lc-small").first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)*Math.hypot(el.getScreenCTM().a,el.getScreenCTM().b));
  check(labelPx>=14,"Diagram labels retain readable screen size instead of shrinking with viewport height");
  const tick=ms=>page.clock.runFor(ms);
  const state=()=>scene.evaluate(el=>({clip:Number(el.dataset.clip),p:Number(el.dataset.progress),status:el.dataset.status}));
  const at=async(clip,p)=>{
    for(let n=0;n<1400;n++){
      const s=await state();if(s.clip===clip&&s.p>=p)return;
      await tick(50);
    }
    throw Error(`Lifecycle did not reach ${clip}:${p}`);
  };
  const geometry=async()=>{
    const result=await scene.locator("svg").evaluate(svg=>{
      const root=svg.getBoundingClientRect();
      const visible=el=>{let alpha=1;for(let n=el;n&&n!==svg.parentElement;n=n.parentElement)alpha*=Number(getComputedStyle(n).opacity);return alpha>.12;};
      const labels=[...svg.querySelectorAll("[data-layout-label]")].filter(visible).map(el=>{
        const b=el.getBoundingClientRect();return {text:el.textContent,x:b.x-root.x,y:b.y-root.y,w:b.width,h:b.height};
      });
      const outside=labels.filter(b=>b.x<-.5||b.y<-.5||b.x+b.w>root.width+.5||b.y+b.h>root.height+.5);
      const pairs=[];
      for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
        const a=labels[i],b=labels[j];
        if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2)pairs.push([a.text,b.text]);
      }
      // Paths have declared empty corridors. Verify their strokes do not cross text.
      const crossed=[];
      for(const path of svg.querySelectorAll(".lc-gradient,.lc-data-guide,.lc-loss-merge")){
        if(!visible(path))continue;
        const matrix=path.getScreenCTM(),len=path.getTotalLength();
        for(let n=0;n<=100;n++){
          const p=path.getPointAtLength(len*n/100),q=new DOMPoint(p.x,p.y).matrixTransform(matrix);
          const label=labels.find(b=>q.x-root.x>b.x-1&&q.x-root.x<b.x+b.w+1&&q.y-root.y>b.y-1&&q.y-root.y<b.y+b.h+1);
          if(label){crossed.push(label.text);break;}
        }
      }
      const imageCrossings=[];
      for(const sample of svg.querySelectorAll("[data-sample-object]")){
        if(!visible(sample))continue;
        const b=sample.getBoundingClientRect();
        for(const a of labels){
          if(Math.min(a.x+a.w,b.right-root.x)-Math.max(a.x,b.left-root.x)>2&&Math.min(a.y+a.h,b.bottom-root.y)-Math.max(a.y,b.top-root.y)>2)imageCrossings.push([sample.dataset.sampleObject,a.text]);
        }
      }
      return {outside,pairs,crossed,imageCrossings};
    });
    check(result.outside.length===0,`Lifecycle labels remain inside canvas: ${JSON.stringify(result.outside)}`);
    check(result.pairs.length===0,`Lifecycle labels do not overlap: ${JSON.stringify(result.pairs)}`);
    check(result.crossed.length===0,`Data/gradient corridors avoid labels at ${JSON.stringify(await state())}: ${JSON.stringify(result.crossed)}`);
    check(result.imageCrossings.length===0,`Moving samples avoid labels at ${JSON.stringify(await state())}: ${JSON.stringify(result.imageCrossings)}`);
  };
  check((await state()).status==="playing","Lifecycle starts a complete playback automatically");
  await scene.locator("[data-replay]").click();
  let record;
  const copyCoordinates=[];
  for(let clip=0;clip<8;clip++)for(const p of [.1,.25,.4,.5,.6,.7,.75,.9,1]){
    await at(clip,p);await geometry();
    check(await scene.locator("[data-current-model]").count()===1,"Exactly one trainable model");
    if(clip<2)check(await scene.locator("[data-record-id]").count()===0,"No frozen target before copying");
    if(clip===2){
      const r=scene.locator("[data-record-id]");
      copyCoordinates.push(await r.getAttribute("transform"));
      record??=await r.elementHandle();
      check(await scene.locator("[data-source-output]").isVisible(),"Original output stays visible throughout copying");
    }
    if(clip>=2){
      check(await scene.locator("[data-history-z]").getAttribute("data-history-z")==="2,1,0","Frozen z is exact through every phase");
      check(await record.evaluate(el=>el===document.querySelector("[data-scene=lifecycle] [data-record-id]")),"Record DOM identity is continuous");
    }
    if(clip===3)check(await scene.getAttribute("data-memory-count")==="0","Parameter update precedes memory write");
    if(clip>=5){
      check(await scene.getAttribute("data-memory-count")==="1"&&await scene.getAttribute("data-seen")==="1","Stored source and N persist into replay");
      check(await scene.getAttribute("data-replay-source")==="record:x1:i","Replay reads the existing record");
    }
    if((clip===2&&p===.5)||(clip===4&&p===1)||(clip===5&&p===.5)||(clip===6&&p===1)||(clip===7&&p===1))await shot(`lifecycle-${clip}-${p}`,"[data-scene=lifecycle] svg");
  }
  check(new Set(copyCoordinates).size===9,"Copy moves continuously through the inspected coordinates");
  await tick(2300);
  check((await state()).status==="finished","A complete run finishes with its final result");
  check(await scene.getAttribute("data-update-count")==="2","Exactly one update per shown training step");
  check(await scene.getAttribute("data-loss-sources")==="current-ce,historical-squared","Two sources enter one later update");
  check(await scene.locator("[data-loss]").getAttribute("data-loss")==="2","Live comparison has the computed squared loss");
  check(await scene.locator("[data-history-reference='2']").evaluate(el=>getComputedStyle(el).fill==="none"),"Coincident zero-difference marks show both the historical outline and current dot");
  await scene.locator("[data-replay]").click();await at(2,.5);
  await scene.locator("[data-play]").focus();await page.keyboard.press("Enter");
  const paused=await scene.locator("svg").innerHTML();await tick(800);
  check(await scene.locator("svg").innerHTML()===paused,"Pause freezes actual objects and labels");
  await scene.locator("[data-play]").click();const before=(await state()).p;await tick(120);
  check((await state()).p>before,"Continue resumes the same copy position");
  await scene.locator("select").selectOption("4");
  check((await state()).p===1,"Jump exposes the complete selected result");
  await scene.locator("[data-back]").click();
  check((await state()).clip===3&&await scene.getAttribute("data-memory-count")==="0","Back restores before-write state");
  await page.emulateMedia({reducedMotion:"reduce"});await tick(50);
  for(let clip=0;clip<8;clip++){
    await scene.locator("select").selectOption(String(clip));
    check((await state()).p===1&&(await state()).status==="paused","Reduced motion has a complete, stable semantic result");
    await geometry();
  }
  check(await scene.locator("[data-history-z]").getAttribute("data-history-z")==="2,1,0","Reduced motion retains the historical record");
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Lifecycle has no page horizontal overflow");
  const fontSize=await scene.locator(".lifecycle-reading p").evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  assert.ok(fontSize>=16);
  await page.clock.resume();
}
