export async function reviewFeedbackChecks({page,base,check,shot}){
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 const kl=page.locator("[data-design=kl]");
 const formula=kl.locator(".formula-spot");
 check(await kl.locator("[data-reading-unit=kl-math]").count()===1,"KL content owns its composition independently of the shared reading-unit wrapper");
 for(const id of ["near","equal","reversed"]){
  await kl.locator("[data-case="+id+"]").click();await kl.locator("[data-frame='4']").click();
  const boxes=await formula.locator(".equation,math").evaluateAll(nodes=>nodes.map(el=>({kind:el.tagName,scrollY:el.scrollHeight-el.clientHeight,scrollX:el.scrollWidth-el.clientWidth,ox:getComputedStyle(el).overflowX,oy:getComputedStyle(el).overflowY})));
  // MathML scrollHeight includes glyph ink beyond its line box; only a padded wrapper is a scroll container.
  check(boxes.every(b=>(b.kind==="math"||b.scrollY<=1)&&b.scrollX<=1&&b.ox==="visible"&&b.oy==="visible"),"Formula is naturally sized with no internal scrolling or clipping: "+JSON.stringify(boxes));
 }
 await shot("feedback-kl","[data-design=kl]");
 const caption=page.locator(".label-question>.caption"),ranking=page.locator(".rankings");
 const cb=await caption.boundingBox(),rb=await ranking.boundingBox();check(Math.abs(cb.x-rb.x)<1&&Math.abs(cb.width-rb.width)<1,"Caption exactly follows the upper diagram measure");
 check(await caption.locator("mark").count()===2,"Key teaching phrases use mark highlighting");check(!(await caption.innerText()).includes("不表示这些品牌模型参与论文实验"),"Crossed-out wording is removed");
 await shot("feedback-caption",".label-question");
 for(let i=0;i<4;i++){
  const ev=page.locator("[data-scene=evidence]");await ev.locator("[data-experiment-select='"+i+"']").click();
  const ranges=await ev.locator(".evidence-row").evaluateAll(rows=>rows.map(row=>{
   const track=row.querySelector(".evidence-track").getBoundingClientRect(),bar=row.querySelector(".evidence-bar").getBoundingClientRect(),band=row.querySelector(".evidence-error"),b=band.getBoundingClientRect(),dot=row.querySelector(".evidence-mean").getBoundingClientRect();
   return {round:parseFloat(getComputedStyle(band).borderRadius),height:b.height,centerError:Math.abs((b.y+b.height/2)-(bar.y+bar.height/2)),meanError:Math.abs(dot.x+dot.width/2-(track.x+track.width*Number(row.dataset.mean)/100))};
  }));
  check(ranges.every(r=>r.round>=r.height/2&&r.centerError<1&&r.meanError<1),"Soft uncertainty intervals align with exact means: "+JSON.stringify(ranges));
 }
 await shot("feedback-evidence","[data-scene=evidence]");
 const lifecycle=page.locator("[data-scene=lifecycle]");await lifecycle.locator("select").selectOption("2");
 const heading=await lifecycle.locator(":scope > header").boundingBox(),reading=await page.locator(".reading-layout").boundingBox();check(Math.abs(heading.x-reading.x)<1&&Math.abs(heading.width-reading.width)<1,"Lifecycle heading matches the article text measure");
 const network=await lifecycle.locator("[data-current-model]").elementHandle();
 for(const clip of [2,5,8]){
  await lifecycle.locator("select").selectOption(String(clip));
  const g=await lifecycle.evaluate(el=>{
   const side=el.querySelector(".lifecycle-sidebar").getBoundingClientRect(),stage=el.querySelector(".lifecycle-viewport").getBoundingClientRect(),root=el.getBoundingClientRect();
   const context=[...el.querySelectorAll(".lifecycle-reading,.lifecycle-equation,.motion-transport")].map(n=>n.getBoundingClientRect());
   return {left:side.right<=stage.left+1,inside:context.every(b=>b.x>=side.x-1&&b.right<=side.right+1),root:root.x>=-1&&root.right<=innerWidth+1,steps:el.querySelectorAll(".lc-reading-steps>li").length,hasNote:!!el.querySelector(".lifecycle-example-note")};
  });
  check(g.left&&g.inside&&g.root&&g.steps>=2&&g.hasNote,"Normal reading uses the accepted explanation/formula rail: "+JSON.stringify(g));
  await shot("feedback-sidebar-"+clip,"[data-scene=lifecycle]");
 }
 await lifecycle.locator(".lifecycle-focus-button").click();check(await lifecycle.getAttribute("role")==="dialog","Existing focus mode remains available");
 check(await network.evaluate(el=>el===document.querySelector("[data-current-model]")),"Entering focus retains the exact network object");
 await shot("feedback-focus");await lifecycle.locator(".lifecycle-exit-focus").click();
 check(await lifecycle.getAttribute("data-clip")==="8","Returning to sidebar reading retains phase");
 check(await network.evaluate(el=>el===document.querySelector("[data-current-model]")),"Returning retains the exact network object");
 check(await page.evaluate(()=>document.body.style.overflow!=="hidden"&&document.documentElement.scrollWidth<=innerWidth+1),"Ordinary reading scroll and width are correct");
 await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(base);
}
