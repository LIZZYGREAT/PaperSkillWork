import ModelPixel from "./ModelPixel";
import { useState } from "react";
import { Term, ReferenceButton } from "../Reference";
import { FREEZE_CLIPS, freezeSceneAt } from "./animation-model";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import "./animation.css";

const guidance = [
  "x₂ 的同一训练视图进入唯一当前网络 θₜ。更新前输出逐项形成；此时还没有独立历史 z。",
  "原输出保留在上方，复制出同一时刻的数值。副本沿路径离开输出端，成为独立记录 x₂@t。",
  "联合损失更新唯一网络。当前输出变为未知的新结果，已复制的 z=(2,1,0) 保持原值。",
  "原图 x₂ 与冻结的 z 配成候选，沿下方路径交接。候选尚未进入 M，下一页才由 reservoir 决定去留。",
];
export default function FreezePrototype() {
  const timeline = useSceneTimeline(FREEZE_CLIPS);
  const [example, setExample] = useState("whole");
  const { clipIndex: clip, progress } = timeline.state;
  const s = freezeSceneAt(clip, progress);
  return <section id="review-freeze" className="review-scene motion-scene" data-scene="freeze" data-clip={clip} data-progress={progress} data-status={timeline.state.status}>
    <header><p className="eyebrow">U3 收尾 · 输出的生命周期</p><h2>网络继续变，复制的历史值留下。</h2><p>沿同一个 x₂ 看清：输出 → 独立 <Term id="z">历史 z</Term> → 参数更新 → 候选等待。这里只有一个网络；分数依次对应 Claude / GPT / DeepSeek，样本像素为独立合成例。</p></header>
    <div className="case-controls" role="group" aria-label="选择观察入口">{[["whole","从输入完整观看"],["copy","从复制前观看"]].map(([id,label])=><button key={id} data-case={id} aria-pressed={example===id} onClick={()=>{setExample(id);timeline.reset(); if(id==="copy")timeline.jump(0);}}>{label}</button>)}</div>
    <SceneTransport timeline={timeline} clips={FREEZE_CLIPS} label="冻结" />
    <div className="motion-drawing"><svg className="motion-canvas" viewBox="0 0 1080 485" role="img" aria-label={`${FREEZE_CLIPS[clip].id}。${guidance[clip]}`}>
      <text x="1045" y="58" textAnchor="end" className="small-label" data-canvas-time>t={timeline.elapsedSeconds.toFixed(1)}s · {clip+1} / {timeline.state.totalClips} · {Math.round(progress*100)}%</text>
      <text x="28" y="34">唯一当前网络 / 一次更新前输出</text><text x="780" y="34" className="small-label">同一训练视图 · 概念性时序示意</text>
      <path className="guide" d="M 100 144 H 355 M 565 144 H 780" />
      <path className="flow" data-input-path pathLength="1" strokeDasharray="1" strokeDashoffset={1-Math.min(1,s.forward*2)} d="M 100 144 H 355" />
      <path className="flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1-Math.max(0,(s.forward-.4)/.6)} d="M 565 144 H 780" />
      <g transform={`translate(${s.inputX},144)`} data-input-token><rect x="-36" y="-32" width="72" height="64" rx="6" className="paper" /><ModelPixel model={0} x={-28} y={-16} size={30} /><text textAnchor="middle" x={18} y="6">x₂</text></g>
      <text x="80" y="210" textAnchor="middle" className="small-label">训练视图</text>
      <rect x="355" y="86" width="210" height="116" rx="6" className="paper" /><text x="460" y="114" textAnchor="middle" className="small-label">唯一当前网络</text><text x="460" y="157" textAnchor="middle" className="large-value" data-parameter>{s.updated?"θₜ₊₁":"θₜ"}</text><text x="460" y="186" textAnchor="middle" className="small-label">{s.updated?"参数已更新":"参数更新前"}</text>
      {clip===2 && <rect x="355" y="86" width="210" height={116*s.update} rx="6" className="focus-ring" data-update-outline />}
      <g data-source-output data-output-version={s.updated?"unknown-new":"before-update"}>
        <rect x="655" y="86" width="300" height="116" rx="6" className="paper" />
        <text x="805" y="113" textAnchor="middle" className="small-label">{s.updated?"更新后的输出 · 未计算":"更新前输出 · x₂@t"}</text>
        {s.updated?<><text x="805" y="153" textAnchor="middle" className="large-value">hθₜ₊₁(x₂) = ?</text><text x="805" y="183" textAnchor="middle" className="small-label">不会刷新下方历史值</text></>:<>{s.z.map((v,i)=><text key={i} data-output-value={i} x={735+i*70} y="157" textAnchor="middle" className="large-value">{i<s.outputCount?v:"·"}</text>)}<text x="805" y="184" textAnchor="middle" className="small-label">源输出在复制时保留</text></>}
      </g>
      <path className="guide" d="M 780 144 Q 780 300, 470 365" /><path className="flow" opacity={clip>=2?.25:1} pathLength="1" strokeDasharray="1" strokeDashoffset={1-s.copy} d="M 780 144 Q 780 300, 470 365" />
      <text x="786" y="249" className="small-label">{clip>=2?"更新前的复制路径":"复制数值"}</text>
      <rect x="290" y="300" width="330" height="150" rx="6" className="guide" /><text x="310" y="433" className="small-label">独立历史目标 / 数值冻结</text>
      <rect x="670" y="300" width="380" height="150" rx="6" className="guide" /><text x="690" y="433" className="small-label">候选等待 / Reservoir 决定之前</text>
      <path className="guide" d="M 620 365 H 670" /><path className="flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1-s.handoff} d="M 620 365 H 670" />
      {!s.hasRecord && <text data-no-history x="455" y="380" textAnchor="middle" className="small-label">尚无 z</text>}
      {s.hasRecord && <g data-record-id={s.recordId} data-history-z={s.z.join(",")} data-in-memory="false" transform={`translate(${s.recordX},${s.recordY})`}>
        <rect x="-140" y="-32" width="280" height="80" rx="6" className="paper" /><rect x="-140" y="-32" width="5" height="80" className="now" />
        <text y="-8" textAnchor="middle" className="small-label">x₂@t · {s.handoff>0?"候选 (原图 x₂, z)":"独立副本 z"}</text><text y="21" textAnchor="middle" className="large-value">z = (2, 1, 0)</text><text y="40" textAnchor="middle" className="small-label">{s.handoff>0?"尚未入池":"更新前复制 · 不随 θ 刷新"}</text>
      </g>}
      <text x="28" y="473" className="small-label">未执行网络训练 · 不编造更新后的 logits · 复制后记录 ID 与数值持续保留 · 候选不等于已留存</text>
    </svg></div>
    <div className="motion-narration" aria-live="polite"><strong>{FREEZE_CLIPS[clip].id}</strong><p>{guidance[clip]}</p></div>
    <p>z 保存的是过去的输出数值，不需要第二台常驻教师。后续由当前网络向它靠近；这里停在“候选等待”，不提前演示记忆选留。</p><ReferenceButton term="z">原文时序与记录来源</ReferenceButton>
  </section>;
}
