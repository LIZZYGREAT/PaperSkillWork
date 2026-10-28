import { probabilityComparison, logitComparison } from "../src/modules/math-model.ts";
import { KL_CLIPS, LOGIT_CLIPS, FREEZE_CLIPS } from "../src/modules/review/animation-model.ts";

export async function animationBrowserChecks({ page, base, check, shot }) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${base}?review=1`, { waitUntil: "networkidle" });
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const scene = id => page.locator(`[data-scene='${id}']`);
  const jump = (id, clip) => scene(id).locator("select").selectOption(String(clip));
  const replay = id => scene(id).locator("[data-replay]").click();
  const tick = ms => page.clock.runFor(ms);
  const clipOf = id => scene(id).getAttribute("data-clip");
  const numberAttrs = (id, selector, attr) => scene(id).locator(selector).evaluateAll((nodes, a) => nodes.map(n => Number(n.getAttribute(a))), attr);
  const progress = async id => Number(await scene(id).getAttribute("data-progress"));
  const waitTick = async (id, targetClip, targetProgress) => {
    for(let i=0;i<600;i++) {
      if(Number(await clipOf(id))===targetClip && await progress(id)>=targetProgress) return;
      await tick(40);
    }
    throw new Error(`Timeline did not reach ${id} ${targetClip}:${targetProgress}`);
  };
  const verifyKL = async () => {
    const p=await numberAttrs("kl","[data-probability-row]","data-p");
    const q=await numberAttrs("kl","[data-probability-row]","data-q");
    const terms=await numberAttrs("kl","[data-term]","data-term");
    const total=Number(await scene("kl").locator("[data-total]").getAttribute("data-total"));
    const expected=probabilityComparison(p,q);
    check(p.join(",")==="0.8,0.2" && Math.abs(q[0]+q[1]-1)<1e-12,"Fixed p, normalized q at actual playback sample");
    check(Math.abs(expected.kl-total)<1e-12 && terms.every((v,i)=>Math.abs(v-expected.terms[i])<1e-12),"Actual DOM probabilities, signed contributions, total agree");
    const widths=await numberAttrs("kl","[data-q-bar]","width");
    check(widths.every((v,i)=>Math.abs(v-650*q[i])<1e-9),"Probability lengths and numbers use the same sample");
  };
  for(const [id,last,moveClip] of [["kl",5,1],["logits",3,1],["freeze",3,1]]) {
    check(await scene(id).getAttribute("data-status")==="paused","Scene opens paused");
    if(id==='freeze') {
      await scene(id).locator('[data-case=copy]').click();
      check(await clipOf(id)==='1' && await progress(id)===0,'Copy entry means the beginning of copying, with generation already complete');
      check(await scene(id).locator('[data-source-output] [data-output-value]').count()===3 && await scene(id).locator('[data-record-id]').count()===0,'Copy entry retains the full source and has no copied record yet');
      await scene(id).locator('[data-case=whole]').click();
    }
    const clips = {kl:KL_CLIPS,logits:LOGIT_CLIPS,freeze:FREEZE_CLIPS}[id];
    for(let index=0;index<clips.length;index++) {
      await jump(id,index);
      check(await progress(id)===0 && await scene(id).getAttribute('data-status')==='paused',`${id}: selecting stage ${index+1} pauses at its beginning`);
      const seconds=clips.slice(0,index).reduce((sum,c)=>sum+c.durationMs+(c.holdMs??0),0)/1000;
      check((await scene(id).locator('[data-time-readout]').innerText()).startsWith(`${seconds.toFixed(1)} /`),`${id}: selected stage time is its start rather than its end`);
      if(index>0) {
        await scene(id).locator('[data-back]').click();
        check(await clipOf(id)===String(index-1) && await progress(id)===0,`${id}: previous at a paused start selects the preceding start`);
        await scene(id).locator('[data-next]').click();
        check(await clipOf(id)===String(index) && await progress(id)===0,`${id}: next selects the following start`);
      }
    }
    await jump(id,0);
    check(await scene(id).locator('[data-back]').isDisabled(),`${id}: previous is disabled at paused zero`);
    await scene(id).locator('[data-play]').click();await tick(160);
    check(await clipOf(id)==='0' && await progress(id)>0,`${id}: play begins in the selected stage instead of skipping it`);
    check(await scene(id).locator('[data-back]').isEnabled(),`${id}: previous is available while stage one runs`);
    await scene(id).locator('[data-back]').click();
    check(await clipOf(id)==='0' && await progress(id)===0 && await scene(id).getAttribute('data-status')==='paused',`${id}: previous during playback restarts and pauses the current stage`);
    await scene(id).locator("[data-play]").focus();
    await page.keyboard.press("Enter");
    await waitTick(id,moveClip,.25);
    const samples=[];
    for(const target of [.25,.5,.75]) {
      await waitTick(id,moveClip,target);
      if(id==="kl") { await verifyKL(); samples.push((await numberAttrs(id,"[data-q-bar]","width"))[0]); }
      if(id==="logits") {
        const a=await numberAttrs(id,"[data-logit-row]","data-a"),z=await numberAttrs(id,"[data-logit-row]","data-z");
        const result=logitComparison(z,a), deltas=await numberAttrs(id,"[data-logit-row]","data-difference");
        check(deltas.every((v,i)=>Math.abs(v-result.differences[i])<1e-12),"Visible difference lines derive from moving points");
        check(Math.abs(Number(await scene(id).locator("[data-loss]").getAttribute("data-loss"))-result.squaredDistance)<1e-12,"Squared loss uses moving a");
        samples.push((await numberAttrs(id,"[data-current-point]","cy"))[0]);
      }
      if(id==="freeze") {
        const record=scene(id).locator("[data-record-id]");
        check(await record.getAttribute("data-history-z")==="2,1,0","Copied z stays exact during travel");
        check(await scene(id).locator("[data-source-output] [data-output-value]").count()===3,"Source survives while independent copy moves");
        samples.push(await record.getAttribute("transform"));
      }
      if(target===.5) await shot(`animation-${id}-mid-50`, `[data-scene='${id}'] .motion-canvas`);
    }
    check(new Set(samples).size===3,`${id}: 25/50/75% have different real coordinates or bar lengths`);
    await scene(id).locator("[data-play]").click();
    const paused=await scene(id).getAttribute("data-progress"),markup=await scene(id).locator("svg").innerHTML();
    await tick(800);
    check(await scene(id).getAttribute("data-progress")===paused && await scene(id).locator("svg").innerHTML()===markup,"Pause freezes geometry and progress");
    await scene(id).locator("[data-play]").click();
    await tick(80);
    check(Number(await scene(id).getAttribute("data-progress"))>Number(paused),"Continue advances from the paused position");
    let handle;
    if(id==="freeze") handle=await scene(id).locator("[data-record-id]").elementHandle();
    await waitTick(id,last,1);
    await tick(2000);
    check(await scene(id).getAttribute("data-status")==="finished","One play runs the entire sequence and final hold");
    if(id==="freeze") {
      check(await handle.evaluate(el=>el===document.querySelector("[data-scene='freeze'] [data-record-id]")),"Record DOM identity survives parameter update and handoff");
      check(await scene(id).locator("[data-record-id]").getAttribute("data-in-memory")==="false","Candidate is not stored memory");
      check(await scene(id).locator("[data-output-version]").getAttribute("data-output-version")==="unknown-new","New output is symbolic unknown");
    }
    await shot(`animation-${id}-end`, `[data-scene='${id}'] .motion-canvas`);
    await scene(id).locator("[data-back]").click();
    check(await progress(id)===0 && await clipOf(id)===String(last),"Previous at the completed end first returns to this stage start");
    await scene(id).locator("[data-back]").click();
    check(await progress(id)===0 && await clipOf(id)===String(last-1),"Previous at a paused start returns to the preceding stage start");
    await replay(id);await tick(80);
    check(await clipOf(id)==="0" && await progress(id)<.1,"Replay rebuilds initial path");
    if(id==="freeze") check(await scene(id).locator("[data-record-id]").count()===0,"Replay has no history before copying");
    await scene(id).locator("[data-play]").click();
  }
  // Verify geometric reveal as well as probability/point movement.
  await jump("kl",3);await scene("kl").locator("[data-play]").click();
  await waitTick("kl",4,.25);
  const barA=(await numberAttrs("kl","[data-term-bar]","width"))[1];
  await waitTick("kl",4,.75);
  const barB=(await numberAttrs("kl","[data-term-bar]","width"))[1];
  check(barB>barA && (await numberAttrs("kl","[data-term]","data-term"))[1]<0,"Negative contribution really grows left of zero");
  await scene("kl").locator("[data-play]").click();
  for(const [id,expected] of [["near",.09151622184943578],["equal",0],["reversed",.8317766166719343]]) {
    await scene("kl").locator(`[data-case='${id}']`).click();await jump("kl",5);await verifyKL();
    check(Math.abs(Number(await scene("kl").locator("[data-total]").getAttribute("data-total"))-expected)<1e-12,"Each preset ends at correct KL");
  }
  await scene("logits").locator("[data-case='shifted']").click();await replay("logits");
  for(const target of [.25,.5,.75]) {
    await waitTick("logits",1,target);
    const p=await numberAttrs("logits","[data-softmax-row]","data-p"), q=await numberAttrs("logits","[data-softmax-row]","data-q");
    check(p.every((v,i)=>Math.abs(v-q[i])<1e-12),"Common shift preserves probability at intermediate progress");
    const a=await numberAttrs("logits","[data-logit-row]","data-a"),z=await numberAttrs("logits","[data-logit-row]","data-z");
    check(a.every((v,i)=>Math.abs(v-z[i]-(a[0]-z[0]))<1e-12),"All three current logits move together");
  }
  await waitTick("logits",2,.25);const squareA=(await numberAttrs("logits","[data-square-block]","height"))[0];
  await waitTick("logits",2,.75);check((await numberAttrs("logits","[data-square-block]","height"))[0]>squareA,"Squared block has geometric growth");
  await jump("logits",3);
  check(Number(await scene("logits").locator("[data-loss]").getAttribute("data-loss"))===3,"Common shift ends at distance 3");
  await shot("animation-logits-shift", "[data-scene='logits'] .motion-canvas");
  for(const id of ["kl","logits","freeze"]) {
    await scene(id).locator("[data-next]").evaluate(el=>el.focus());
    check(await scene(id).locator(".motion-transport").count()===1,"Exactly one main transport per scene");
    const outside=await scene(id).locator("svg").evaluate(svg=>[...svg.querySelectorAll('text')].filter(n=>{
      const b=n.getBBox(), matrix=svg.getScreenCTM().inverse().multiply(n.getScreenCTM());
      const points=[[b.x,b.y],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
      return points.some(p=>p.x<-.1||p.y<-.1||p.x>1080.1||p.y>svg.viewBox.baseVal.height+.1);
    }).map(n=>n.textContent));
    check(outside.length===0,`Semantic SVG labels fit the canvas: ${id}: ${outside.join("; ")}`);
  }
  check(await page.locator("#kl-definition mfrac").count()===1,"KL retains real MathML fraction");
  await page.emulateMedia({reducedMotion:"reduce"});await tick(80);
  for(const id of ["kl","logits","freeze"]) {
    await jump(id,0);check(await progress(id)===1,"Reduced motion exposes complete initial semantic step");
    await scene(id).locator("[data-next]").click();
    check(await clipOf(id)==="1" && await progress(id)===1,"Reduced motion has manual semantic progression");
  }
  check(await scene("freeze").locator("[data-record-id]").getAttribute("data-history-z")==="2,1,0","Reduced motion includes copied history");
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Review has no page horizontal overflow");
  await page.clock.resume();
}
