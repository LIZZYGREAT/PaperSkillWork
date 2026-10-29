import { useId, useState } from "react";
import { MODEL_CLASSES } from "../data/model-classes";
import { runTraining, TRAIN_PHASES, trainingSceneAt } from "./training-model";
import { windowAt } from "./review/lifecycle-model";
import SceneTransport, { useSceneTimeline } from "./review/SceneTransport";
import { SampleGlyph, NetworkGlyph, fmt, vectorText } from "./LearningGlyphs";
import "./learning-scenes.css";

const steps = runTraining("DER");
const clips = TRAIN_PHASES.map(id => ({ id, durationMs: 6000, holdMs: 1600 }));

function FlowPath({ d, progress, marker, className = "is-current" }: { d: string; progress: number; marker: string; className?: string }) {
  return <path d={d} className={`ds-flow ${className}`} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} opacity={progress > 0 ? 1 : 0} markerEnd={progress > .94 ? `url(#${marker})` : undefined} />;
}

export default function DERTrainingStep() {
  const [empty, setEmpty] = useState(false);
  const timeline = useSceneTimeline(clips);
  const phase = timeline.state.clipIndex;
  const p = timeline.state.progress;
  const round = empty ? 0 : 1;
  const { step, state } = trainingSceneAt(steps, round * 5 + phase, p);
  const defsId = useId().replace(/:/g, "");
  const done = (index: number) => phase > index ? 1 : phase < index ? 0 : windowAt(p, .08, .86);
  const currentFlow = done(1);
  const replayFlow = done(2);
  const jointReveal = done(3);
  const updateReveal = phase > 3 ? 1 : phase < 3 ? 0 : windowAt(p, .22, .84);
  const writeReveal = done(4);
  const candidateStored = state.M.some(record => record.id === step.candidate.id);
  const writeNote = candidateStored
    ? "本例 x₂ 与自己的冻结 z 一起写入 M"
    : state.updates > step.before.updates
      ? "参数已更新，当前候选尚未写入 M"
      : "参数更新前，M 尚未接收当前候选";
  const notes = [
    empty
      ? "首轮 M 为空，所以没有历史分支。本步先读取 M，再用当前 x₁ 和 y₁ 开始训练。"
      : "先从已有 M 读取 x₁ 与冻结 z₁ 的副本；读操作不改变 M、N。当前 x₂ 仍未入池。",
    "当前输入经过本步开始时的 θ，得到 logits 并计算 CE；同一份更新前输出也被复制为候选 z。",
    empty
      ? "空池没有可回放的旧样本，L_dark=0；本步仍会由当前标签完成一次分类更新。"
      : "旧图从 M 读取后，经同一个更新前 θ 重新前向得到 a；与原记录固定的 z 比较，形成 L_dark。",
    "当前 CE 与加权历史匹配先合成一个目标，再对 θ 做一次更新。更新前复制的候选 z 不随 θ⁺ 重算。",
    "参数更新结束后才选留当前候选。本例此时有空槽，x₂ 与自己的冻结 z 一起进入 M。",
  ];

  return <section className="teaching-scene" data-scene="der-step" data-clip={phase} data-progress={p} data-status={timeline.state.status} data-updates={state.updates} data-seen={state.N} data-memory={state.M.map(record => record.id).join(",")} data-loss={step.losses.total}>
    <header>
      <div><p className="eyebrow">DER / 单步闭环</p><h3>当前标签与历史响应，共用一次更新。</h3><p>当前 (x,y) 提供分类 CE，旧 (x′,z′) 提供加权匹配 L_dark；α 调整旧响应的权重。两路都使用更新前的 θ，合并后更新一次，再决定当前候选是否入池。</p></div>
      <div className="scene-options" role="group" aria-label="选择本步记忆状态">
        <button aria-pressed={!empty} onClick={() => { setEmpty(false); timeline.reset(); }}>有旧记忆</button>
        <button aria-pressed={empty} onClick={() => { setEmpty(true); timeline.reset(); }}>空池首轮</button>
      </div>
    </header>
    <SceneTransport timeline={timeline} clips={clips} label="DER 单步" showTiming={false} caption="暂停查看当前阶段；最后一个阶段才把更新后的候选交给 Reservoir。" />
    <div className="teaching-stage ds-stage">
      <svg viewBox="0 0 1280 560" className="teaching-canvas ds-canvas" role="img" aria-label="当前样本和旧记忆在同一个更新前网络上分别前向，两种损失合并后只更新一次，最后才写入候选">
        <defs>
          <marker id={`${defsId}-current`} markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#477d5d" /></marker>
          <marker id={`${defsId}-replay`} markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#66849a" /></marker>
        </defs>
        <text x="34" y="42" className="ds-overline">两条输入 · 一个共享的更新前网络 θ</text>
        <g className="ds-input-card is-current">
          <rect x="28" y="158" width="222" height="112" rx="13" />
          <SampleGlyph x={43} y={181} size={62} id={`current ${step.input.id}`} model={step.input.model} view={step.input.s} />
          <text x="119" y="188" className="ds-lane-title">当前训练样本</text>
          <text x="119" y="215" className="ds-lane-detail">{step.input.id} · y = {MODEL_CLASSES[step.input.y]}</text>
          <text x="119" y="241" className="ds-lane-note">本步分类监督</text>
        </g>
        <g className={`ds-input-card${step.rd ? " is-replay" : " is-empty"}`}>
          <rect x="28" y="282" width="222" height="112" rx="13" />
          {step.rd ? <>
            <SampleGlyph x={43} y={304} size={62} id={`${step.rd.id} replay`} model={step.rd.model} view={step.input.sd} />
            <text x="119" y="312" className="ds-lane-title">从 M 读取旧样本</text>
            <text x="119" y="339" className="ds-lane-detail">{step.rd.id} · 原图保留</text>
            <text x="119" y="365" className="ds-lane-note">□ 冻结 z = {vectorText(step.rd.z, 2)}</text>
          </> : <>
            <circle cx="75" cy="338" r="22" className="ds-empty-mark" />
            <path d="M65 338H85M75 328V348" className="ds-empty-plus" />
            <text x="119" y="330" className="ds-lane-title">M 为空</text>
            <text x="119" y="357" className="ds-lane-detail">没有历史样本可读</text>
            <text x="119" y="377" className="ds-lane-note">本步 L_dark = 0</text>
          </>}
        </g>

        <FlowPath d="M250 214C278 214 295 229 328 237" progress={currentFlow} marker={`${defsId}-current`} />
        {step.rd && <FlowPath d="M250 338C284 338 299 324 328 313" progress={replayFlow} marker={`${defsId}-replay`} className="is-replay" />}
        <NetworkGlyph x={276} y={125} version="θ（更新前）" forward={currentFlow} backward={phase === 3 ? windowAt(p, .18, .78) : 0} />
        <FlowPath d="M449 195C484 184 505 159 532 159" progress={currentFlow} marker={`${defsId}-current`} />
        {step.replayLogits && <FlowPath d="M449 315C482 320 508 326 532 326" progress={replayFlow} marker={`${defsId}-replay`} className="is-replay" />}

        <g className="ds-output-panel is-current">
          <rect x="532" y="88" width="354" height="132" rx="13" />
          <text x="550" y="114" className="ds-panel-title">当前前向 b · CE(y,q)</text>
          {step.currentLogits.map((value, index) => <g key={index}>
            <rect x={550 + index * 105} y="128" width="96" height="52" rx="8" className={`ds-score-cell tone-${index}${index === step.input.y ? " is-label" : ""}`} />
            <text x={598 + index * 105} y="149" textAnchor="middle" className="ds-score-name">{MODEL_CLASSES[index]}</text>
            <text x={598 + index * 105} y="170" textAnchor="middle" className="ds-score-value">{fmt(value)}</text>
          </g>)}
          <text x="550" y="205" className="ds-panel-note">真实 y = {MODEL_CLASSES[step.input.y]} · L_current = {fmt(step.losses.current)}</text>
        </g>
        <g className={`ds-output-panel${step.replayLogits ? " is-replay" : " is-empty"}`}>
          <rect x="532" y="248" width="354" height="152" rx="13" />
          {step.replayLogits && step.rd ? <>
            <text x="550" y="274" className="ds-panel-title">回放 {step.rd.id} · 当前 a 对比冻结 z</text>
            {step.replayLogits.map((value, index) => <g key={index}>
              <rect x={550 + index * 105} y="287" width="96" height="62" rx="8" className={`ds-score-cell tone-${index}`} />
              <text x={598 + index * 105} y="306" textAnchor="middle" className="ds-score-name">{MODEL_CLASSES[index]}</text>
              <text x={598 + index * 105} y="326" textAnchor="middle" className="ds-score-value">a {fmt(value)}</text>
              <text x={598 + index * 105} y="343" textAnchor="middle" className="ds-score-target">□ z {fmt(step.rd!.z[index])}</text>
            </g>)}
            <text x="550" y="382" className="ds-panel-note">L_dark = {fmt(step.losses.dark)} · α = 0.5</text>
          </> : <>
            <text x="550" y="281" className="ds-panel-title">历史匹配支路</text>
            <text x="550" y="317" className="ds-empty-copy">M 为空；没有回放前向，也没有历史损失。</text>
            <text x="550" y="350" className="ds-panel-note">L_dark = 0</text>
          </>}
        </g>
        <FlowPath d="M886 153C907 153 912 180 936 190" progress={jointReveal} marker={`${defsId}-current`} />
        <FlowPath d="M886 326C910 326 918 263 936 247" progress={step.rd ? jointReveal : 0} marker={`${defsId}-replay`} className="is-replay" />
        <g className="ds-joint-card" opacity={jointReveal}>
          <rect x="936" y="110" width="314" height="206" rx="15" />
          <text x="958" y="140" className="ds-joint-title">合并为一个总损失</text>
          <path d="M958 153H1228" className="ds-joint-rule" />
          <text x="958" y="181" className="ds-joint-part">当前 CE</text>
          <text x="1228" y="181" textAnchor="end" className="ds-joint-value">{fmt(step.losses.current, 4)}</text>
          <text x="958" y="210" className="ds-joint-part">α · 历史匹配</text>
          <text x="1228" y="210" textAnchor="end" className="ds-joint-value">{fmt(.5 * step.losses.dark, 4)}</text>
          <rect x="952" y="230" width="282" height="61" rx="9" className="ds-total-band" />
          <text x="968" y="254" className="ds-total-formula">L_DER = L_current + αL_dark</text>
          <text x="968" y="278" className="ds-total-value">L_DER = {fmt(step.losses.total, 4)}</text>
        </g>
        <g className="ds-update-card" opacity={updateReveal}>
          <rect x="936" y="334" width="314" height="74" rx="13" />
          <circle cx="970" cy="370" r="16" className="ds-update-node" />
          <path d="M962 370H978M970 362V378" className="ds-update-cross" />
          <text x="999" y="363" className="ds-update-title">θ → θ⁺ · 一次联合更新</text>
          <text x="999" y="387" className="ds-update-note">由同一 L_DER 提供梯度</text>
        </g>
        <FlowPath d="M1093 316V334" progress={updateReveal} marker={`${defsId}-current`} />

        <g className="ds-frozen-copy" opacity={currentFlow}>
          <rect x="28" y="442" width="414" height="76" rx="12" />
          <text x="48" y="469" className="ds-copy-title">当前候选 · 更新前复制</text>
          <text x="48" y="497" className="ds-copy-value">{step.candidate.id} · z = {vectorText(step.candidate.z, 2)}</text>
        </g>
        <FlowPath d="M442 480H474" progress={writeReveal} marker={`${defsId}-current`} />
        <g className="ds-memory-strip">
          <rect x="474" y="442" width="776" height="76" rx="12" />
          <text x="494" y="468" className="ds-memory-title">更新后才选留 · N = {state.N} / K = {state.K}</text>
          {[0, 1].map(slot => <g key={slot}>
            <rect x={738 + slot * 175} y="452" width="162" height="48" rx="8" className={`ds-memory-cell${state.M[slot] ? " is-filled" : ""}`} />
            <text x={819 + slot * 175} y="482" textAnchor="middle" className="ds-memory-label">slot {slot} · {state.M[slot]?.id ?? "空"}</text>
          </g>)}
          <text x="494" y="495" className="ds-memory-note">{writeNote}</text>
        </g>
      </svg>
    </div>
    <div className="scene-explanation" aria-live="polite"><strong>{TRAIN_PHASES[phase]}</strong><p>{notes[phase]}</p></div>
    <p className="quiet-note">图像身份与数值来自合成教学例，不是论文 CNN 特征或实验轨迹。候选未入池也已经完成本步训练。</p>
    <div className="scene-handoff"><span>下一问</span><p>这一步仍假设回放看到相同像素。真实训练会重新裁剪或翻转原图；视图变了，旧的 z 还应该跟着变吗？</p></div>
  </section>;
}
