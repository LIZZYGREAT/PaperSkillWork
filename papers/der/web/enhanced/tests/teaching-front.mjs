import {responseComparison,RESPONSE_CASES,LABEL_OLD,LABEL_CURRENT} from '../src/modules/math-model.ts';
export async function teachingFrontChecks({page,base,check,shot}) {
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 const label=page.locator('.label-investigation'),button=label.locator('.response-toggle');
 check(await button.getAttribute('aria-expanded')==='false'&&await label.locator('[data-response]').count()===0,'S2 initially shows predictions without detailed responses');
 check(await label.locator('.prediction-answer').count()===2&&await label.locator('.response-finding').count()===0&&!(await label.innerText()).includes('(2,0,1)'),'Two correct predictions precede the conclusion');
 await shot('s1-s2-reading','#U1-replay-entry');await shot('s2-closed','.label-investigation');
 await button.focus();await page.keyboard.press('Enter');
 check(await button.getAttribute('aria-expanded')==='true','Response reveal works by keyboard');
 for(const [id,values] of [['history',LABEL_OLD],['current',LABEL_CURRENT]]) {
  const seen=await label.locator(`[data-response=${id}] .rk-response-meter`).evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.value)));
  check(JSON.stringify(seen)===JSON.stringify(values),'S2 detailed responses use shared math inputs: '+id);
 }
 check(await label.locator('.response-finding').isVisible(),'Observation and conclusion appear after the action');await shot('s2-open','.label-investigation');
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
