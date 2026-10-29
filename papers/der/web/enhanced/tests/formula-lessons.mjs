import {binaryKL,squaredCoordinate} from "../src/modules/formula-model.ts";
export async function formulaLessonChecks({page,base,check,shot}){
 const near=(a,b,label)=>check(Math.abs(a-b)<1e-7,label+": "+a+" / "+b);
 const setRange=async(locator,value)=>locator.fill(String(value));
 await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 const names=["kl-math","logit-math","augmentation-math","der-plus-math","workbench-math"];
 check(await page.locator("[data-reading-unit]").count()===5,"Only modules with a separate math exploration retain a reading unit");
 for(const name of names){
  const lesson=page.locator('[data-reading-unit="'+name+'"]');
  const structure=await lesson.evaluate(el=>{
   const formula=el.querySelector(".formula-spot"),reading=el.querySelector(".lesson-reading"),scene=el.parentElement,transport=scene.querySelector(".transport,.motion-transport");
   const equations=[...el.querySelectorAll(".equation")].map(eq=>{
    const box=eq.getBoundingClientRect(),m=eq.querySelector("math"),mb=m.getBoundingClientRect();
    return {fits:mb.x>=box.x-1&&mb.right<=box.right+1,display:getComputedStyle(m).display,ox:getComputedStyle(eq).overflowX,oy:getComputedStyle(eq).overflowY,scroll:eq.scrollHeight-eq.clientHeight};
   });
   return {hasFormula:!!formula,hasReading:!!reading,hasMechanism:!!transport,equations};
  });
  check(structure.hasFormula&&structure.hasReading&&structure.hasMechanism,name+" keeps math, explanation, and mechanism available without prescribing their order");
  check(structure.equations.every(e=>e.display.includes("math")&&e.fits&&e.ox==="visible"&&e.oy==="visible"&&e.scroll<=1),name+" formulas have natural height and fit their columns: "+JSON.stringify(structure.equations));
  await shot(name,"[data-reading-unit="+name+"]");
  await shot(name+"-formula","[data-reading-unit="+name+"] .formula-spot");
  await shot(name+"-reading","[data-reading-unit="+name+"] .lesson-reading > .lesson-columns:first-of-type");
 }
 const reservoir=page.locator("[data-scene=reservoir]"),derStep=page.locator("[data-scene=der-step]");
 check(await reservoir.locator("[data-reading-unit]").count()===0,"Reservoir opens on its mechanism rather than a separate formula lesson");
 const reservoirRule=await reservoir.locator(".rv-inline-rule").innerText();
 check(reservoirRule.includes("Uniform")&&reservoirRule.includes("N ← N + 1"),"Reservoir keeps its concise rule beside the mechanism");
 check(await derStep.locator("[data-reading-unit]").count()===0,"DER single-step opens on its mechanism rather than a separate formula lesson");
 check((await derStep.locator(".ds-total-formula").textContent()).includes("L_DER"),"DER keeps the joint objective beside the shared network");
 for(const [name,selector] of [["kl-gradient","[data-reading-unit=kl-math] .lesson-reading > .lesson-derivation:last-child"],["kl-nonnegative","[data-reading-unit=kl-math] .lesson-reading > .lesson-columns.lesson-derivation"],["logit-gradient","[data-reading-unit=logit-math] .lesson-reading > .lesson-columns.lesson-derivation"],["logit-shift-proof","[data-reading-unit=logit-math] .lesson-reading > .lesson-derivation:last-child"]])await shot(name,selector);
 check(await page.locator("[data-scene=lifecycle] [data-reading-unit]").count()===0,"D1 retains its existing sidebar formula");
 const kl=page.locator("[data-math-explorer=kl]"),point=kl.locator("[data-plot-x]"),algorithm=page.locator("[data-design=kl]"),phase=await algorithm.getAttribute("data-progress");
 for(const q of [.02,.6,.8,.98]){
  await setRange(kl.locator("input[type=range]"),q);const r=binaryKL(.8,q);
  check(await point.evaluate(el=>!el.closest("[clip-path]")),"Selected endpoint remains fully visible outside the curve clip");
  near(+(await point.getAttribute("data-plot-x")),q,"Slider and plotted probability agree");
  near(+(await point.getAttribute("data-plot-y")),r.kl,"Curve point is the computed full KL");
  near(+(await point.getAttribute("data-plot-slope")),r.slope,"Tangent uses constrained derivative");
  check(Math.abs(+(await kl.locator('[data-math-value=forward]').innerText())-r.kl)<=.00051,"Displayed KL is rounded from model");
 }
 await shot("kl-boundary","[data-math-explorer=kl]");
 await kl.getByRole("button",{name:"回到 p=q",exact:true}).click();near(+(await point.getAttribute("data-plot-y")),0,"Equal distributions reset exactly to zero");
 await kl.getByRole("button",{name:"隐藏反向散度",exact:true}).click();check(await kl.locator(".plot-reverse").count()===0,"Reverse curve can be hidden without changing forward");
 await kl.getByRole("button",{name:"显示反向散度",exact:true}).click();check(await kl.locator(".plot-reverse").count()===1,"Reverse curve returns");
 await kl.locator("[data-math-sweep]").click();await page.clock.runFor(2000);
 const q1=+(await point.getAttribute("data-plot-x"));await page.clock.runFor(1500);const q2=+(await point.getAttribute("data-plot-x"));check(q2>q1,"Curve scan actually moves through values");
 await kl.getByRole("button",{name:"暂停",exact:true}).click();const paused=await point.getAttribute("data-plot-x");await page.clock.runFor(1200);check(paused===await point.getAttribute("data-plot-x"),"Pause holds exact curve position");
 check(phase===await algorithm.getAttribute("data-progress"),"Math scan does not advance the mechanism animation");await shot("kl-scan-paused","[data-math-explorer=kl]");
 await setRange(kl.locator("input[type=range]"),.6);await kl.locator("input").focus();await page.keyboard.press("ArrowRight");near(+(await point.getAttribute("data-plot-x")),.61,"Probability slider works by keyboard");
 const square=page.locator("[data-math-explorer=square]"),sp=square.locator("[data-plot-x]");
 for(const delta of [-2,-1,0,2]){
  await setRange(square.locator("input[type=range]"),delta);const r=squaredCoordinate(delta);
  near(+(await sp.getAttribute("data-plot-y")),r.loss,"Parabola value matches squared distance");near(+(await sp.getAttribute("data-plot-slope")),r.slope,"Parabola tangent matches gradient");
 }
 await setRange(square.locator("input"),-1);await square.locator("[data-math-step]").click();await page.clock.runFor(1750);const mid=+(await sp.getAttribute("data-plot-x"));check(mid> -1&&mid<-.6,"Scalar gradient update has a real intermediate state");await shot("square-step-mid","[data-math-explorer=square]");
 await square.getByRole("button",{name:"暂停",exact:true}).click();const d=await sp.getAttribute("data-plot-x");await page.clock.runFor(700);check(d===await sp.getAttribute("data-plot-x"),"Scalar update pauses");
 await square.locator("[data-math-step]").click();await page.clock.runFor(3600);near(+(await sp.getAttribute("data-plot-x")),-.6,"One scalar step ends at the computed negative-gradient update");
 await square.getByRole("button",{name:"恢复起始差值",exact:true}).click();near(+(await sp.getAttribute("data-plot-x")),-1,"Reset restores original coordinate");
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto(base);
 check(await page.locator("[data-math-sweep]").isDisabled(),"Reduced motion prevents automatic sweep");
 check(await page.locator("[data-math-step]").isDisabled(),"Reduced motion uses complete scalar state");
 await setRange(page.locator("#kl-probability"),.4);near(+(await page.locator("[data-math-explorer=kl] [data-plot-x]").getAttribute("data-plot-x")),.4,"Manual math exploration remains available with reduced motion");
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Formula lessons introduce no page overflow");
 await page.emulateMedia({reducedMotion:"no-preference"});
}
