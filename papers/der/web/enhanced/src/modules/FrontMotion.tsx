import { useLayoutEffect, useRef, useState } from "react";
import ModelPixel, { type ModelClass } from "./review/ModelPixel";
import { CLASSES } from "./math-model";
import { bound, curve, windowAt } from "./review/lifecycle-model";
import { useSceneTimeline, type SceneTimeline } from "./review/SceneTransport";
import type { TimelineClip } from "../shared/foundation/animation/useAnimationTimeline";
import "./front-motion.css";

export function MiniControls({ timeline:t, clips, label }: { timeline: SceneTimeline; clips: readonly TimelineClip[]; label: string }) {
  return <div className="mini-controls" role="group" aria-label={`${label}控制`}>
    <button data-mini-play onClick={t.toggle}>{t.reducedMotion ? "下一步" : t.state.status==="playing" ? "暂停" : t.state.status==="finished" ? "再看本步" : "播放 / 继续"}</button>
    <button data-mini-back disabled={!t.canGoBack} onClick={t.previous}>上一步</button><button data-mini-next disabled={!t.state.hasNext} onClick={t.next}>下一步</button><button data-mini-replay onClick={t.replay}>重播</button>
    <label>观察点 <select data-mini-stage aria-label={`${label}观察点`} value={t.state.clipIndex} onChange={e=>t.start(+e.target.value)}>{clips.map((c,i)=><option value={i} key={c.id}>{c.id}</option>)}</select></label>
    <span className="mini-status">{t.reducedMotion ? "减少动态 · 分步阅读" : t.state.status==="playing" ? "播放中" : t.state.status==="finished" ? "停留观察" : "已暂停"}</span>
  </div>;
}
export function SampleGlyph({ x,y,model=0,id,size=44 }: {x:number;y:number;model?:ModelClass;id:string;size?:number}) {
  return <g transform={`translate(${x} ${y})`} data-sample-id={id} className="fm-sample"><rect x={-size/2-5} y={-size/2-5} width={size+10} height={size+10} rx="7"/><ModelPixel model={model} x={-size/2} y={-size/2} size={size}/></g>;
}
export function ModelStation({x,y,theta,caption=true}:{x:number;y:number;theta:number;caption?:boolean}) {
  return <g transform={`translate(${x} ${y})`} data-station><rect className="fm-model" width="150" height="84" rx="12"/><path className="fm-network" d="M20 27L55 18L88 30M20 27L55 48L88 30M20 55L55 18L88 55M20 55L55 48L88 55"/>{[[20,27],[20,55],[55,18],[55,48],[88,30],[88,55]].map(([cx,cy],i)=><circle className="fm-node" key={i} cx={cx} cy={cy} r="4"/>)}<text x="112" y="48" textAnchor="middle" className="fm-theta">θ<tspan baselineShift="sub" fontSize="14">{theta}</tspan></text>{caption&&<text x="75" y="108" textAnchor="middle">同一个当前模型</text>}</g>;
}
const STREAM_CLIPS = [{id:"x₁ · 建立观察",durationMs:2200,holdMs:500},{id:"x₂ · 参数变化",durationMs:2200,holdMs:600},{id:"x₃ · 再次变化",durationMs:2200,holdMs:900}] as const;
export function StreamMotion() {
  const t=useSceneTimeline(STREAM_CLIPS),i=t.state.clipIndex,p=t.state.progress;
  const move=windowAt(p,0,.55),signal=windowAt(p,.55,.8),updated=i>0&&p>=.8,theta=Math.max(0,i-1)+(updated?1:0);
  const point=curve(move,{x:83+i*230,y:48},{x:Math.min(610,180+i*230),y:40},{x:175,y:270},{x:230,y:290});
  const drift=i===0?0:Math.max(0,i-1)+windowAt(p,.82,1);
  return <figure className="parameter-stream mini-motion" data-front-scene="stream" data-clip={i} data-progress={p} data-theta={theta} data-status={t.state.status}>
    <p className="figure-label">数据不断到来 · 固定模型站点</p>
    <svg className="front-canvas stream-canvas" viewBox="0 0 650 400" role="img" aria-label="三类样本依次进入同一模型，参数改变，旧输入观察位保持固定">
      {CLASSES.map((name,k)=><g className="stream-sample" data-stream-sample={k} key={name} transform={`translate(${8+k*230} 4)`}><rect className="fm-state-card" width="150" height="176" rx="10" data-active={i===k}/><ModelPixel model={k as ModelClass} x={53} y={22} size={44}/><text x="75" y="94" textAnchor="middle">{name}</text><text className="stream-id" x="75" y="121" textAnchor="middle">x<tspan baselineShift="sub" fontSize="12">{k+1}</tspan></text><path className="fm-divider" d="M12 134H138"/><text className="parameter-state" x="75" y="161" textAnchor="middle">θ<tspan baselineShift="sub" fontSize="12">{k}</tspan></text></g>)}
      {[0,1].map(k=><path key={k} className="stream-arrow fm-line" d={`M${166+k*230} 92h64m-10 -7 10 7 -10 7`}/>)}
      <path className="fm-route" d="M83 202 Q83 290 230 290 M313 202 Q313 235 230 290 M543 202 Q543 290 380 290"/>
      <ModelStation x={230} y={248} theta={theta}/>
      <g transform="translate(465 243)" data-old-observer><rect className="fm-observer" width="170" height="112" rx="10"/><ModelPixel model={0} x={12} y={15} size={32}/><text x="55" y="38">旧 x₁</text><path className="fm-divider" d="M16 68H152"/><circle cx={55+drift*32} cy="68" r="7" className="fm-response-mark"/><text x="85" y="99" textAnchor="middle">响应可能漂移</text></g>
      {move<1 && <SampleGlyph x={point.x} y={point.y} model={i as ModelClass} id={`stream:x${i+1}:read`} size={30}/>}
      {signal>0&&signal<1&&<circle className="fm-signal" cx={250+signal*90} cy={284} r="6"/>}
    </svg>
    <p className="mini-event" aria-live="polite">{i===0 ? "先让 x₁ 通过模型，建立固定的旧输入观察位。" : p<.55 ? `x${i+1} 进入同一个模型；旧 x₁ 留在观察位。` : p<.8 ? "更新信号经过当前网络。" : "参数变了，旧输入的响应也可能改变。"}</p>
    <MiniControls timeline={t} clips={STREAM_CLIPS} label="持续数据流"/><figcaption>合成概念演示：只说明变化关系，不给出虚构的准确率或训练数值。</figcaption>
  </figure>;
}
const READ_CLIPS=[{id:"从记忆读取副本",durationMs:2000,holdMs:600},{id:"新旧样本共同监督",durationMs:1400,holdMs:800}] as const;
export function ReplayReadMotion() {
  const t=useSceneTimeline(READ_CLIPS),ref=useRef<HTMLDivElement>(null);
  const [anchors,setAnchors]=useState<{w:number;h:number;current:{x:number;y:number};old:{x:number;y:number};target:{x:number;y:number}}>();
  useLayoutEffect(()=>{
    const host=ref.current?.closest<HTMLElement>(".er-relation");if(!host)return;
    const measure=()=>{const outer=host.getBoundingClientRect();const at=(selector:string)=>{const b=host.querySelector(selector)!.getBoundingClientRect();return {x:b.x-outer.x+b.width/2,y:b.y-outer.y+b.height/2};};setAnchors({w:outer.width,h:outer.height,current:at('.er-source:first-child .model-mark'),old:at('.er-source:last-child .model-mark'),target:at('.er-network')});};
    measure();const ro=new ResizeObserver(measure);ro.observe(host);document.fonts.ready.then(measure);return ()=>ro.disconnect();
  },[]);
  const p=t.state.clipIndex>0?1:t.state.progress;
  const position=(from:{x:number;y:number},offset:number)=>{const to=anchors!.target,lane=Math.max(26,from.y+(offset<0?-75:75));return curve(windowAt(p,.05,1),from,{x:from.x+30,y:lane},{x:to.x-80,y:lane},{x:to.x+offset,y:to.y});};
  return <div ref={ref} className="replay-read-motion mini-motion" data-front-scene="er-read" data-progress={p} data-status={t.state.status} data-source-retained="true">
    {anchors&&p>0&&<svg className="er-motion-overlay front-canvas" viewBox={`0 0 ${anchors.w} ${anchors.h}`} aria-label="读取副本从两条原记录移动到同一模型，原记录保留">{p<1&&([anchors.current,anchors.old] as const).map((source,k)=>{const at=position(source,k===0?-15:15);return <SampleGlyph key={k} x={at.x} y={at.y} model={k===0?2:0} size={32} id={k===0?'er:current:read':'er:old:read'}/>;})}{t.state.clipIndex===1&&t.state.progress<1&&<circle className="fm-signal" cx={anchors.target.x-25+bound(t.state.progress)*50} cy={anchors.target.y} r="6"/>}</svg>}
    <p className="mini-event">{t.state.clipIndex===0 ? "旧记录留在记忆位，只将读取副本送入当前模型。" : "新旧两种输入共同提供标签监督，更新同一个模型。"}</p><MiniControls timeline={t} clips={READ_CLIPS} label="有限回放"/>
  </div>;
}
