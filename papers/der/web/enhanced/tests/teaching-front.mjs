import {responseComparison,RESPONSE_CASES,LABEL_OLD,LABEL_CURRENT} from '../src/modules/math-model.ts';
export async function teachingFrontChecks({page,base,check,shot}) {
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 const label=page.locator('.label-investigation');
 check(await label.locator('.response-toggle').count()===0,'S2 has no expand/collapse button');
 check(await label.locator('[data-response]').count()===2,'Both full responses are always shown');
 check(await label.locator('.prediction-answer').count()===2&&await label.locator('.response-finding').isVisible(),'Predictions and their explanation are directly visible');
 await shot('s1-s2-reading','#U1-replay-entry');await shot('s2-response','.label-investigation');
 for(const [id,values] of [['history',LABEL_OLD],['current',LABEL_CURRENT]]) {
  const seen=await label.locator(`[data-response=${id}] .rk-response-meter`).evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.value)));
  check(JSON.stringify(seen)===JSON.stringify(values),'S2 detailed responses use shared math inputs: '+id);
 }
 check(await label.locator('.response-finding').isVisible(),'Observation and conclusion remain visible without an action');await shot('s2-open','.label-investigation');
 const lab=page.locator('[data-design=response-comparison]');
 check(await lab.count()===1&&await page.locator('[data-design=kl],[data-design=logits]').count()===0,'Only one dual representation lab is mounted');
 for(let i=0;i<3;i++) {
  await lab.locator(`[data-response-case=${RESPONSE_CASES[i].id}]`).click();await page.clock.runFor(300);
  const r=responseComparison(i),data=await lab.evaluate(el=>({...el.dataset}));
  check(data.z==='2,1,0'&&data.a===r.a.join(','),'Historical target stays fixed, current vector matches case');
  for(const k of ['p','q']) {const seen=data[k].split(',').map(Number);check(seen.every((v,j)=>Math.abs(v-r[k][j])<1e-12),'Probabilities derive from unrounded logits: '+k);}
  check(Math.abs(+data.kl-r.probabilityKL)<1e-12&&+data.l2===r.squaredDistance,'Both losses share one calculation');
  check(Math.abs(+(await lab.locator('[data-kl-value]').innerText())-r.probabilityKL)<.000051,'KL rounded display matches exact data');
  check(+(await lab.locator('[data-l2-value]').innerText())===r.squaredDistance,'L2 visible total matches model');
  await shot('s3-'+RESPONSE_CASES[i].id,'.response-lab');
 }
 await shot('s3-reading','#U2-probability');await shot('bridge','.supervision-bridge');await shot('d1-prelesson','.lifecycle-prelesson');
 const alignment=await page.evaluate(()=>{
  const left=document.querySelector('.reading-layout').getBoundingClientRect().left;
  const selectors=['.gcl-context','.supervision-bridge','.lifecycle-prelesson','.second-round','.lifecycle-prelesson>.front-question','.lifecycle-scene>header'];
  return selectors.map(selector=>({selector,error:Math.abs(document.querySelector(selector).getBoundingClientRect().left-left)}));
 });
 check(alignment.every(item=>item.error<2),'Section headings and prose share one left edge: '+JSON.stringify(alignment));
 const type=await page.evaluate(()=>['.gcl-context p','.gcl-context strong','.first-round p','.round-state li','.second-round p','.lifecycle-start'].map(selector=>getComputedStyle(document.querySelector(selector)).fontFamily));
 check(type.every(family=>family===type[0]&&family.startsWith('"Microsoft YaHei"')),'Body, emphasis, lists and controls share the same prose font');
 const round=await page.locator('.first-round').evaluate(el=>{const flow=el.querySelector('.round-state').getBoundingClientRect(),text=el.firstElementChild.getBoundingClientRect();return {flow:flow.width,text:text.width,outside:el.scrollWidth>el.clientWidth+1};});
 check(round.flow<round.text&&!round.outside,'The compact flow leaves sufficient width for causal prose without an oversized empty panel');
 const pre=await page.locator('.lifecycle-prelesson').boundingBox(),d1=await page.locator('[data-scene=lifecycle]').boundingBox();
 check(pre.y+pre.height<=d1.y+1,'Both full training rounds precede D1');
 const scene=page.locator('[data-scene=lifecycle]');
 check(await scene.getAttribute('data-status')==='paused'&&+(await scene.getAttribute('data-progress'))===0,'Normal reading D1 waits for user playback');
 await shot('d1-start','[data-scene=lifecycle]');
 await page.emulateMedia({reducedMotion:'reduce'});await lab.locator('[data-response-case=preference]').click();
 check(await lab.locator('.rk-response-meter__fill').first().evaluate(el=>getComputedStyle(el).transitionDuration)==='0s','Reduced motion removes response transitions');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'New reading content has no desktop page overflow');
 await page.emulateMedia({reducedMotion:'no-preference'});
}
