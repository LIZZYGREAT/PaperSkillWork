import {lifecycleSceneAt,LIFECYCLE_FIXTURE} from '../src/modules/review/lifecycle-model.ts';
export async function frontMotionChecks({page,check,shot}){
 const ribbon=await page.locator('.teacher-probability-ribbon').getAttribute('data-probabilities');const probabilities=ribbon.split(',').map(Number);check(probabilities.length===3&&Math.abs(probabilities.reduce((a,b)=>a+b,0)-1)<1e-12,'The bespoke soft-target ribbon encodes a normalized, computed distribution');
 const origin=page.locator('[data-front-scene=snapshot-origin]');
 await origin.locator('[data-mini-stage]').selectOption('1');await origin.locator('[data-mini-play]').click();await page.clock.runFor(850);
 const moving=origin.locator('[data-vector-id="snapshot:frozen-copy"]');
 check(await moving.count()===1&&await moving.getAttribute('data-values')===LIFECYCLE_FIXTURE.z.join(','),'Frozen target is copied from the authoritative pre-update output');
 const midway=await moving.getAttribute('transform');await origin.locator('[data-mini-play]').click();await page.clock.runFor(500);
 check(await moving.getAttribute('transform')===midway,'Numerical copy pauses on its source-to-candidate path');await shot('snapshot-copy-mid','.snapshot-origin');
 await origin.locator('[data-mini-replay]').click();await page.clock.runFor(10000);
 check(await origin.getAttribute('data-theta')==='1'&&await moving.getAttribute('data-values')==='2,1,0'&&await origin.getAttribute('data-frozen')==='true','Parameter changes after the copy while target numbers remain fixed');await shot('snapshot-fixed','.snapshot-origin');
 const preview=page.locator('[data-front-scene=two-rounds]');
 const verify=async()=>{
  const d=await preview.evaluate(el=>({...el.dataset})),s=lifecycleSceneAt(+d.lifecycleClip,+d.progress);
  check(+d.memoryCount===s.memoryCount&&+d.seen===s.seen&&+d.updates===s.updateCount,'Preview theta/M/N are projected from D1 at every sampled state');
  check(d.losses===s.lossSources.join(','),'Both losses use the same D1 pre-update parameter state');
 };
 for(const round of [1,2]){
  await preview.locator(`[data-preview-round="${round}"]`).click();await verify();
  check(await preview.getAttribute('data-memory-count')===String(round-1),'Round starts from the correct inherited memory');
  for(let i=0;i<4;i++){
   await preview.locator('[data-mini-stage]').selectOption(String(i));await preview.locator('[data-mini-play]').click();await page.clock.runFor((round===2&&i===0?2600:[1800,1500,round===1?1300:1500,1700][i])*.55);await verify();
   await preview.locator('[data-mini-play]').click();const held=await preview.getAttribute('data-progress');await page.clock.runFor(300);check(await preview.getAttribute('data-progress')===held,'Every relay segment can be paused');
   await shot(`relay-${round}-${i}-mid`,'.two-round-preview');
  }
  await preview.locator('[data-mini-replay]').click();await page.clock.runFor(13000);await verify();
  check(await preview.getAttribute('data-updates')===String(round)&&await preview.getAttribute('data-memory-count')===String(round)&&await preview.getAttribute('data-seen')===String(round),'Only one update per round precedes the completed write');
  check(await preview.getAttribute('data-status')==='finished','Preview stops at the round boundary for observation');
  await shot(`relay-${round}-done`,'.two-round-preview');
 }
 await preview.locator('[data-preview-round="2"]').click();
 const old=await preview.locator('[data-vector-id="record:x1:i"]').elementHandle();
 await preview.locator('[data-mini-play]').click();await page.clock.runFor(1900);
 check(await preview.locator('[data-sample-id="preview:old-read"]').count()===1,'A reading copy leaves slot 0 in the second round');
 check(await old.evaluate(el=>el===document.querySelector('[data-front-scene=two-rounds] [data-vector-id="record:x1:i"]'))&&await old.getAttribute('data-values')==='2,1,0','The stored record itself neither moves away nor gets replaced during reading');
 await preview.locator('[data-mini-play]').click();
 const boundaries=await page.locator('.snapshot-origin svg,.relay-canvas,.stream-canvas').evaluateAll(svgs=>svgs.flatMap(svg=>{const outer=svg.getBoundingClientRect();return [...svg.querySelectorAll('text,rect')].filter(el=>{if(getComputedStyle(el).opacity==='0')return false;const b=el.getBoundingClientRect();return b.width&&b.height&&(b.x<outer.x-2||b.right>outer.right+2||b.y<outer.y-2||b.bottom>outer.bottom+2);}).map(el=>el.textContent||el.tagName);}));
 check(!boundaries.length,'Semantic labels and objects remain inside each mini stage: '+boundaries);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const round of [1,2]){await preview.locator(`[data-preview-round="${round}"]`).click();for(let i=0;i<4;i++){await preview.locator('[data-mini-stage]').selectOption(String(i));await verify();check(await preview.getAttribute('data-progress')==='1','Reduced motion exposes complete, manually selectable relay steps');}}
 const label=page.locator('.label-investigation');await label.locator('[data-label-mode=answer]').click();check(await label.getAttribute('data-current-progress')==='0','Reduced motion still supports the answer-only observation');await label.locator('[data-label-mode=full]').click();check(await label.getAttribute('data-current-progress')==='1','Reduced motion reveals the complete response without timed interpolation');
 const button=preview.locator('[data-mini-replay]');await button.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');const focus=await button.evaluate(el=>({visible:el.matches(':focus-visible'),style:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));check(focus.visible&&focus.style!=='none'&&focus.width>=2,'New motion controls retain visible keyboard focus');
 await page.emulateMedia({reducedMotion:'no-preference'});
}
