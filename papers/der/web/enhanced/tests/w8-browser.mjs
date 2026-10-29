import {runTraining,trainingSceneAt,WORKBENCH_CLIPS} from "../src/modules/training-model.ts";
import {EXPERIMENTS} from "../src/modules/evidence-data.ts";
export async function fullW8Checks({page,base,check,shot}){
 const geometry=async scene=>{
 const result=await scene.locator(".teaching-canvas").evaluate(svg=>{
  const frame=svg.getBoundingClientRect(),outside=[],small=[];
  const visible=el=>{for(let n=el;n&&n!==svg;n=n.parentElement)if(+getComputedStyle(n).opacity<.02)return false;return true;};
  for(const el of svg.querySelectorAll("text,rect,circle,path")){
   if(!visible(el))continue;const r=el.getBoundingClientRect();
   if(r.width&&r.height&&(r.left<frame.left-2||r.right>frame.right+2||r.top<frame.top-2||r.bottom>frame.bottom+2))outside.push(el.textContent||el.tagName);
   if(el.tagName==="text"&&parseFloat(getComputedStyle(el).fontSize)*Math.hypot(el.getScreenCTM().a,el.getScreenCTM().b)<12)small.push(el.textContent);
  }return {outside,small};
 });check(!result.outside.length,"All semantic shapes fit the canvas: "+result.outside);check(!result.small.length,"Diagram text retains >=12px actual size: "+result.small);
 };
 const seek=async(scene,i,duration,progress)=>{
  await scene.locator("select").selectOption(String(i));await scene.locator("[data-play]").click();await page.clock.runFor(32);await page.clock.fastForward(duration*progress);await scene.locator("[data-play]").click();
 };
 await page.emulateMedia({reducedMotion:"no-preference"});
 for(const [name,durations] of [["der-step",[6000,6000,6000,6000,6000]],["augmentation",[4500,4500,5000,5500]],["der-plus",[4500,5000,6000]]]){
  await page.goto(base+"?focus="+name);await page.evaluate(()=>document.fonts.ready);const scene=page.locator("[data-scene="+name+"]");
  for(let i=0;i<durations.length;i++){
   await seek(scene,i,durations[i],.6);check(await scene.getAttribute("data-status")==="paused","Mid-process pause is real");await geometry(scene);
   if([1,2,4].includes(i))await shot(name+"-"+i,"[data-scene="+name+"]");
   const snapshot=await scene.locator("svg").innerHTML();await page.clock.fastForward(1200);check(snapshot===await scene.locator("svg").innerHTML(),"Pause holds all geometry and values");
   await scene.locator("[data-back]").click();check(+(await scene.getAttribute("data-progress"))===0,"Back restores stage start");
  }
  if(name==="der-step"){
   await page.emulateMedia({reducedMotion:"reduce"});await scene.locator("select").selectOption("3");
   check(await scene.getAttribute("data-updates")==="2"&&await scene.getAttribute("data-seen")==="1","One update precedes any memory write");
   await scene.locator("select").selectOption("4");check(await scene.getAttribute("data-seen")==="2","Write occurs only after update");
   await scene.getByRole("button",{name:"空池首轮",exact:true}).click();await scene.locator("select").selectOption("2");
   check(await scene.locator("[data-sample*='replay']").count()===0,"Empty pool never invents replay");
  }
  if(name==="augmentation"){
   const target=await scene.getAttribute("data-target");await seek(scene,3,5500,.3);const loss=await scene.getAttribute("data-loss");await seek(scene,3,5500,.8);
   check(target===await scene.getAttribute("data-target"),"Augmentation never rewrites historical target");check(loss!==await scene.getAttribute("data-loss"),"View changes actually recompute logits and loss");
  }
  if(name==="der-plus"){
   await scene.getByRole("button",{name:"DER",exact:true}).click();check(await scene.getAttribute("data-ry")==="none","DER has no historical label branch");
   await scene.getByRole("button",{name:"DER++",exact:true}).click();
   check(await scene.getAttribute("data-rd")===await scene.getAttribute("data-ry"),"Separate samples may overlap");
   await scene.locator(".scene-options").last().getByRole("button").click();check(await scene.getAttribute("data-rd")!==await scene.getAttribute("data-ry"),"Separate samples may differ");
  }
  await page.emulateMedia({reducedMotion:"reduce"});await scene.locator("select").selectOption(String(durations.length-1));
  check(await scene.getAttribute("data-progress")==="1","Reduced motion shows whole semantic result");
  const stable=await scene.locator("svg").innerHTML();await page.clock.fastForward(2000);check(stable===await scene.locator("svg").innerHTML(),"Reduced motion is static");
  await page.emulateMedia({reducedMotion:"no-preference"});
 }
 await page.goto(base+"?focus=workbench");const wb=page.locator("[data-scene=workbench]");
 const network=await wb.locator("[data-network]").elementHandle(),memory=await wb.locator("[data-workbench-memory]").elementHandle();
 for(const mode of ["DER","DER++"]){
  await wb.locator("[data-mode="+(mode==="DER"?"DER":'"DER++"')+"]").click();
  const steps=runTraining(mode);
  await page.emulateMedia({reducedMotion:"reduce"});
  for(let c=0;c<21;c++){
   await wb.locator("select").selectOption(String(c));const expected=trainingSceneAt(steps,c,1);
   check(await wb.getAttribute("data-weights")===JSON.stringify(expected.state.W),"Every displayed parameter equals computed state");
   check(+(await wb.getAttribute("data-seen"))===expected.state.N,"Every phase inherits exact N");
   check(+(await wb.getAttribute("data-updates"))===expected.state.updates,"Only one update per round");
   check(await wb.getAttribute("data-memory")===expected.state.M.map(r=>r.id).join(","),"Every memory snapshot follows shared model");
   check(await wb.locator("text").filter({hasText:/slot [01] · 空/}).count()===2-expected.state.M.length,"Only genuinely empty slots carry an empty label");
   if(c===13)check(await wb.getAttribute("data-memory")==="x₁,x₂","Round 3 trains from old memory before replacement");
   if(c===14)check(await wb.getAttribute("data-memory")==="x₃,x₂","Round 3 replaces only after update");
   if(c===18)check(+(await wb.getAttribute("data-updates"))===4&&+(await wb.getAttribute("data-seen"))===3,"Rejected item still trains before reservoir");
   if([0,7,13,14,19,20].includes(c)){await geometry(wb);await shot("workbench-"+mode.replace("++","plus")+"-"+c,"[data-scene=workbench]");}
  }
  const before=await wb.getAttribute("data-weights"),seen=await wb.getAttribute("data-seen");
  await wb.locator("[data-predict]").click();await page.clock.fastForward(2000);
  check(before===await wb.getAttribute("data-weights")&&seen===await wb.getAttribute("data-seen"),"Prediction leaves trained parameters and N unchanged");
  await wb.locator("[data-round-select='2']").click();check(await wb.getAttribute("data-round")==="3","Direct round rewind works");
  await wb.locator("[data-numeric-details] summary").click();check((await wb.locator("[data-numeric-details]").innerText()).includes("联合梯度"),"Exact numeric inspection is available");
  await wb.locator("[data-numeric-details] summary").click();
  await page.emulateMedia({reducedMotion:"no-preference"});
  for(const c of [1,5,13,14,19,20]){await seek(wb,c,WORKBENCH_CLIPS[c].durationMs,.5);await geometry(wb);await shot("workbench-motion-"+c,"[data-scene=workbench]");}
 }
 check(await network.evaluate(el=>el===document.querySelector("[data-network]")),"The same network DOM object persists through rounds and mode resets");
 check(await memory.evaluate(el=>el===document.querySelector("[data-workbench-memory]")),"The same memory container persists");
 await page.goto(base+"?focus=evidence");const evidence=page.locator("[data-scene=evidence]");
 for(let i=0;i<EXPERIMENTS.length;i++){
  await evidence.locator("[data-experiment-select='"+i+"']").click();
  const e=EXPERIMENTS[i];check(await evidence.getAttribute("data-experiment")===e.id,"Evidence protocol switch selects correct setting");
  for(const v of e.values){const row=evidence.locator("[data-method='"+v.method+"']");check(+(await row.getAttribute("data-mean"))===v.mean,"Real paper value retained");check(+(await row.getAttribute("data-spread"))===v.spread,"Paper ± retained");}
  check(await evidence.locator(".counterexamples article").count()===3,"All negative examples remain visible");await shot("evidence-"+e.id);
 }
 await evidence.getByRole("button",{name:/深入分析与证据边界/}).click();check(await page.locator("dialog").isVisible(),"Reference analyses open");
 check(await page.locator("[data-reference-detail='evidence-analysis'] math").count()>0,"ECE uses mathematical layout");
 await page.keyboard.press("Escape");await page.goto(base);
 await shot("article-final-opening");
 check(await page.locator(".lesson-section").count()===7,"All seven reading units are real");
 const bad=await page.locator(".site-header nav a,.formula-lesson math,.wb-rounds button").evaluateAll(nodes=>nodes.filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.textContent));
 check(!bad.length,"Navigation and mainline math fit: "+bad);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Full article has no horizontal overflow");
}
