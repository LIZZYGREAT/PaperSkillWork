import { useState } from "react";
import { MiniControls, ModelStation, SampleGlyph } from "./FrontMotion";
import { useSceneTimeline } from "./review/SceneTransport";
import { LIFECYCLE_FIXTURE as F, lifecycleSceneAt, mix, curve, windowAt } from "./review/lifecycle-model";

function VectorToken({x,y,symbol="z₁",values=F.z,id}:{x:number;y:number;symbol?:string;values?:readonly (number|string)[];id:string}) {
  return <g transform={`translate(${x} ${y})`} data-vector-id={id} data-values={values.join(",")} className="fm-vector"><rect width="196" height="48" rx="8"/><text x="25" y="30" textAnchor="middle">{symbol}</text>{values.map((value,k)=><g key={k}><rect className="fm-value-cell" x={55+k*44} y="6" width="40" height="36" rx="4"/><text x={75+k*44} y="30" textAnchor="middle">{value}</text></g>)}</g>;
}
const ORIGIN_CLIPS=[{id:"更新前产生输出",durationMs:1600,holdMs:500},{id:"复制为冻结候选",durationMs:1700,holdMs:900},{id:"参数更新，副本不变",durationMs:1500,holdMs:1000}] as const;
export function SnapshotOrigin() {
  const t=useSceneTimeline(ORIGIN_CLIPS),s=lifecycleSceneAt(t.state.clipIndex+1,t.state.progress);
  const copied=s.copyMotion,at={x:mix(470,780,copied),y:mix(95,172,copied)};
  return <section className="snapshot-origin mini-motion" data-front-scene="snapshot-origin" data-clip={t.state.clipIndex} data-progress={t.state.progress} data-theta={s.updateCount} data-frozen={copied===1}>
    <svg className="front-canvas" viewBox="0 0 1100 260" role="img" aria-label="当前网络更新前输出的数值副本移动并冻结，参数更新后副本不变">
      <SampleGlyph x={65} y={122} id="snapshot:x1"/><text x="65" y="176" textAnchor="middle">同一 x₁</text><path className="fm-line" d="M105 122H210m-10 -7 10 7 -10 7M380 122H458m-10 -7 10 7 -10 7"/>
      <ModelStation x={220} y={80} theta={s.updateCount}/><text x="568" y="70" textAnchor="middle">更新前输出</text>
      {s.forward>0&&<g opacity={windowAt(s.forward,.35,1)}><VectorToken x={470} y={95} id="snapshot:source"/></g>}
      <rect className="fm-candidate" x="770" y="150" width="216" height="86" rx="10"/><text x="878" y="135" textAnchor="middle">候选记录 · 尚未入池</text>
      {s.copy>0&&<VectorToken x={at.x} y={at.y} id="snapshot:frozen-copy"/>}
      {copied===1&&<text x="878" y="252" textAnchor="middle" className="fm-fixed-label">固定数值，不随 θ 重算</text>}
      {t.state.clipIndex===2&&t.state.progress<.7&&<circle className="fm-signal" cx={240+t.state.progress*110} cy="121" r="6"/>}
    </svg>
    <p className="mini-event" aria-live="polite">{t.state.clipIndex===0 ? "用更新前的 θ₀ 产生整组输出。" : t.state.clipIndex===1 ? "从已产生的输出复制数值，移动到候选记录并冻结。" : "当前参数变成 θ₁，z₁ 仍是 (2,1,0)；是否入池留给更新后的选留。"}</p>
    <MiniControls timeline={t} clips={ORIGIN_CLIPS} label="历史目标来源"/>
  </section>;
}
const FIRST=[{id:"当前前向",durationMs:1800,holdMs:400},{id:"冻结候选",durationMs:1500,holdMs:600},{id:"仅分类更新",durationMs:1300,holdMs:500},{id:"更新后写入槽0",durationMs:1700,holdMs:1000}] as const;
const SECOND=[{id:"同一θ上的新旧前向",durationMs:2600,holdMs:600},{id:"逐类历史匹配",durationMs:1500,holdMs:500},{id:"一次联合更新",durationMs:1500,holdMs:700},{id:"更新后写入槽1",durationMs:1700,holdMs:1000}] as const;
export function TwoRoundPreview() {
  const [round,setRound]=useState(0),clips=round===0?FIRST:SECOND,t=useSceneTimeline(clips);
  const mapped=round===0?t.state.clipIndex+1:t.state.clipIndex+5,s=lifecycleSceneAt(mapped,t.state.progress);
  const later=round===1,ready=later?s.currentCandidateVisible:s.copyMotion;
  const storing=later?s.secondStore:s.store,write=windowAt(storing,.15,later?.94:.9);
  const copied=later?windowAt(s.replay,.54,.64):s.copyMotion;
  const vectorAt=write>0?{x:mix(650,885,write),y:mix(295,later?218:106,write)}:{x:650,y:mix(82,295,copied)};
  const read=windowAt(s.replay,.58,.9),readAt=curve(read,{x:905,y:131},{x:765,y:175},{x:270,y:325},{x:373,y:163});
  const intake=windowAt(later?s.replay:s.forward,0,later?.42:.35);
  const currentAt={x:mix(80,370,intake),y:mix(125,138,intake)};
  const ce=s.lossSources.includes('current-ce'),dark=s.lossSources.includes('historical-squared');
  const updateProgress=Math.min(1,t.state.progress/(later?.75:.7));
  const updateAt=updateProgress<.4?{x:mix(500,340,updateProgress/.4),y:304}:updateProgress<.8?{x:340,y:mix(304,138,(updateProgress-.4)/.4)}:{x:mix(340,400,(updateProgress-.8)/.2),y:138};
  const choose=(value:number)=>{setRound(value);t.reset();};
  return <section className="two-round-preview mini-motion" data-front-scene="two-rounds" data-round={round+1} data-clip={t.state.clipIndex} data-lifecycle-clip={mapped} data-progress={t.state.progress} data-theta={s.updateCount} data-memory-count={s.memoryCount} data-seen={s.seen} data-updates={s.updateCount} data-losses={s.lossSources.join(',')} data-status={t.state.status}>
    <div className="preview-round-tabs" role="group" aria-label="选择训练轮次"><button data-preview-round="1" aria-pressed={!later} onClick={()=>choose(0)}>第一轮 · 空池</button><button data-preview-round="2" aria-pressed={later} onClick={()=>choose(1)}>第二轮 · 已有旧记录</button><span>θ{s.updateCount} · M {s.memoryCount}/{F.capacity} · N={s.seen}</span></div>
    <svg className="front-canvas relay-canvas" viewBox="0 0 1120 370" role="img" aria-label="两轮训练中，先冻结候选，同一参数计算损失，只更新一次，再写入记忆">
      <text x="80" y="52" textAnchor="middle">当前样本</text><SampleGlyph x={80} y={125} model={later?1:0} id={later?F.currentSampleId:F.sampleId}/><text x="80" y="180" textAnchor="middle">{later?'x₂, y₂':'x₁, y₁'}</text>
      {intake>0&&intake<1&&<SampleGlyph x={currentAt.x} y={currentAt.y} model={later?1:0} size={30} id="preview:current-read"/>}
      <path className="fm-route" d="M112 125H380M550 138H640"/><text x="475" y="72" textAnchor="middle">唯一当前模型</text><ModelStation x={400} y={96} theta={s.updateCount} caption={false}/>
      <text x="748" y="61" textAnchor="middle">更新前输出</text>{(later?s.currentCandidateVisible>0:s.forward>0)&&<VectorToken x={650} y={82} symbol={later?'z₂':'z₁'} values={later?F.currentTarget:F.z} id="preview:output"/>}
      <rect className="fm-candidate" x="645" y="284" width="206" height="71" rx="10"/><text x="748" y="276" textAnchor="middle">冻结候选</text>
      <text x="985" y="52" textAnchor="middle">记忆 M · K={F.capacity}</text><rect className="fm-memory-slot" x="875" y="80" width="226" height="86" rx="10"/><text x="890" y="99" className="fm-slot-label">slot 0 · x₁</text><rect className="fm-memory-slot" x="875" y="192" width="226" height="86" rx="10"/><text x="890" y="211" className="fm-slot-label">slot 1 · x₂</text>
      {later&&<VectorToken x={885} y={106} id={F.recordId}/>}
      {ready>0&&<VectorToken x={vectorAt.x} y={vectorAt.y} symbol={later?'z₂':'z₁'} values={later?F.currentTarget:F.z} id={later?F.currentRecordId:F.recordId}/>}
      {later&&s.replay>=.58&&read<1&&<SampleGlyph x={readAt.x} y={readAt.y} size={30} id="preview:old-read"/>}
      {ce&&<g data-preview-loss="current"><path className="fm-line" d="M402 164H360V238H385"/><rect className="fm-loss" x="385" y="218" width="150" height="42" rx="8"/><text x="460" y="245" textAnchor="middle">L_current</text></g>}
      {dark&&<g data-preview-loss="dark"><path className="fm-line" d="M550 164H610V218"/><rect className="fm-loss fm-dark-loss" x="600" y="218" width="140" height="42" rx="8"/><text x="670" y="245" textAnchor="middle">L_dark = {s.match.squaredDistance}</text></g>}
      {(ce||dark)&&<g><path className="fm-line" d={`M460 260V300H500${dark?' M670 260V300H640':''}`}/><rect className="fm-total" x="500" y="282" width="140" height="44" rx="8"/><text x="570" y="310" textAnchor="middle">{later?'合并 → 一次更新':'仅当前分类'}</text></g>}
      {t.state.clipIndex>=2&&<path className="fm-update-line" d="M500 304H340V138H400m-8 -7 8 7 -8 7"/>}
      {t.state.clipIndex===2&&updateProgress<1&&<circle className="fm-signal" cx={updateAt.x} cy={updateAt.y} r="6"/>}
      {!later&&s.memoryCount===0&&<text x="985" y="314" textAnchor="middle" className="fm-empty-note">空池：没有历史匹配项</text>}
      {later&&<text x="985" y="314" textAnchor="middle" className="fm-fixed-label">旧 z₁ 始终为 (2,1,0)</text>}
    </svg>
    <p className="mini-event" aria-live="polite">{later ? ['x₂ 与旧 x₁ 用更新前同一组 θ₁ 前向；从旧槽读取副本，原记录保留。','新候选 z₂ 已冻结；当前回放响应与固定 z₁ 形成历史平方损失。','L_current 与 αL_dark 合成一个总损失，只更新一次 θ₁→θ₂。','更新完成后，才将 x₂ 的冻结候选写入空槽1。'][t.state.clipIndex] : ['x₁ 产生更新前输出与当前分类损失；空记忆没有历史损失。','从输出复制并冻结 z₁=(2,1,0)，此时尚未写入记忆。','只根据当前分类损失更新 θ₀→θ₁，冻结 z₁ 不变。','完成参数更新后，候选写入空槽0；N变为1。在此停留，再切换第二轮。'][t.state.clipIndex]}</p>
    <MiniControls timeline={t} clips={clips} label="两轮接力预览"/>
    <p className="caption">数值沿用 D1 教学给定值；z₂ 用符号表示。此处压缩时间展示执行顺序，不执行真实训练求值。</p>
  </section>;
}
