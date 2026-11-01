import { useId, useState } from 'react';
import { MODEL_CLASSES } from '../data/model-classes';
import { runTraining, TRAIN_PHASES, trainingSceneAt, CONFIG } from './training-model';
import { curve, windowAt } from './review/lifecycle-model';
import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import { SampleGlyph, NetworkGlyph, fmt, vectorText } from './LearningGlyphs';
import './learning-scenes.css';
import './der-redesign.css';
import './later-chapters.css';
const steps = runTraining('DER');
const clips = TRAIN_PHASES.map(id => ({ id, durationMs: 6000, holdMs: 1600 }));

export default function DERTrainingStep() {
  const [empty, setEmpty] = useState(false), timeline = useSceneTimeline(clips);
  const phase = timeline.state.clipIndex, p = timeline.state.progress;
  const { step, state } = trainingSceneAt(steps, (empty ? 0 : 1) * 5 + phase, p);
  const done = (i: number) => phase > i ? 1 : phase < i ? 0 : windowAt(p, .08, .86);
  const current = done(1), replay = done(2), update = phase === 3 ? windowAt(p,.18,.8) : 0;
  const reading = phase === 0 ? windowAt(p,.08,.82) : 1;
  const frozen = phase > 1 || phase === 1 && p > .5;
  const copy = phase === 1 ? windowAt(p,.5,.86) : phase > 1 ? 1 : 0;
  const currentRead = curve(current,{x:300,y:153},{x:325,y:153},{x:334,y:153},{x:354,y:153});
  const oldRead = curve(reading,{x:300,y:291},{x:330,y:291},{x:329,y:263},{x:354,y:263});
  const id = useId().replace(/:/g,'');
  const notes = [empty ? '空池首轮没有旧样本；当前分类监督仍可启动训练。' : '从本轮开始前的旧 M 读取 x₁ 副本，原记录保持不变；当前 x₂ 尚未入池。', '当前样本产生分类损失；同一份更新前输出被复制成冻结候选。', empty ? '没有历史回放，因此 L_dark=0。' : '旧输入通过同一个更新前 θ，当前响应与原记录的固定 z 比较。', '两项损失汇合，只更新同一个 θ 一次。M 和 N 此时尚未写入。', '完成参数更新后，候选才交给选留规则；本例空槽接收当前记录。'];
  return <section className="der-redesign later-lesson step-lesson" data-scene="der-step" data-clip={phase} data-progress={p} data-status={timeline.state.status} data-updates={state.updates} data-seen={state.N} data-memory={state.M.map(r=>r.id).join(',')} data-loss={step.losses.total}>
    <header className="later-scene-heading"><div><h3>先读旧记忆，再合成一次更新。</h3><p>选留改变的是未来的记忆。训练时，当前标签与旧响应共同监督同一组更新前参数；本轮候选要等更新完成后，才进入在线选留。</p></div><div className="scene-options"><button aria-pressed={!empty} onClick={()=>{setEmpty(false);timeline.reset();}}>有旧记忆</button><button aria-pressed={empty} onClick={()=>{setEmpty(true);timeline.reset();}}>空池首轮</button></div></header>
    <div className="ds2-stage"><svg viewBox="0 0 1120 500" className="teaching-canvas ds-canvas" role="img" aria-label="从旧池读取副本，当前与历史监督共用一个更新前模型，两项损失合并后更新一次，最后写候选">
      <defs><marker id={`${id}-arrow`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="later-arrowhead" /></marker></defs>
      <text x="40" y="53" className="later-svg-title">两条来源，同一组参数</text>
      <rect x="40" y="95" width="245" height="116" rx="12" className="ds2-source" /><SampleGlyph x={55} y={122} size={56} id={`current ${step.input.id}`} model={step.input.model} /><text x="126" y="128" className="later-svg-title">当前 {step.input.id}</text><text x="126" y="157" className="later-svg-note">y = {MODEL_CLASSES[step.input.y]}</text><text x="126" y="184" className="later-svg-note">本步标签监督</text>
      <rect x="40" y="235" width="245" height="126" rx="12" className="ds2-memory" />{step.rd ? <><SampleGlyph x={55} y={267} size={56} id={`${step.rd.id} original memory`} model={step.rd.model} /><text x="126" y="265" className="later-svg-title">旧记忆 {step.rd.id}</text><text x="126" y="291" className="later-svg-note">读取副本，原记录保留</text><text x="126" y="323" className="ds2-vector ds2-old-vector">z = {vectorText(step.rd.z,2)}</text></> : <><text x="62" y="279" className="later-svg-title">M = ∅</text><text x="62" y="313" className="later-svg-note">无回放，历史损失为 0</text></>}
      <path d="M285 153H355" className="later-connector" markerEnd={`url(#${id}-arrow)`} />{step.rd && <path d="M285 291C330 291 329 263 355 263" className="ds2-replay-link" markerEnd={`url(#${id}-arrow)`} />}
      {phase===1&&current>0&&current<1&&<SampleGlyph x={currentRead.x-14} y={currentRead.y-14} size={28} id="current read copy" model={step.input.model} />}{step.rd&&phase===0&&reading>0&&reading<1&&<SampleGlyph x={oldRead.x-14} y={oldRead.y-14} size={28} id="replay read copy" model={step.rd.model} />}
      <NetworkGlyph x={365} y={75} version={`θ${state.updates}`} forward={phase===1?current:phase===2?replay:0} backward={update} />
      <path d="M591 151H633" className="later-connector" markerEnd={`url(#${id}-arrow)`} />
      <g className="ds2-placeholders"><rect x="650" y="85" width="420" height="100" rx="12" className="ds2-readout"/><text x="671" y="124" className="later-svg-title">当前分类监督</text><text x="671" y="159" className="later-svg-note">等待当前输入前向</text><rect x="650" y="208" width="420" height="54" rx="8" className="ds2-candidate"/><text x="671" y="241" className="later-svg-note">更新前输出将复制为候选</text><rect x="650" y="285" width="420" height="100" rx="12" className="ds2-readout"/><text x="671" y="324" className="later-svg-title">旧响应匹配监督</text><text x="671" y="359" className="later-svg-note">等待旧输入通过同一模型</text></g><g opacity={current}><rect x="650" y="85" width="420" height="100" rx="12" className="ds2-readout" /><text x="671" y="112" className="later-svg-title">当前 CE = {fmt(step.losses.current,4)}</text>{step.currentLogits.map((v,k)=><text key={k} x={671+k*128} y="148" className="ds2-vector">{MODEL_CLASSES[k]} {fmt(v,2)}</text>)}<text x="671" y="172" className="later-svg-note">更新前输出 · 标签提供分类监督</text></g>
      <g opacity={frozen?1:0}><path d="M860 185V201" className="ds2-freeze-link" markerEnd={`url(#${id}-arrow)`} /><rect x="650" y="208" width="420" height="54" rx="8" className="ds2-candidate" /><text x="671" y="241" className="ds2-vector">冻结候选 {step.candidate.id} · z = {vectorText(step.candidate.z,2)}</text></g>
      {copy>0&&copy<1&&<g transform={`translate(790 ${155+80*copy})`} opacity={1-copy}><rect width="140" height="28" rx="6" className="ds2-candidate"/><text x="70" y="20" textAnchor="middle" className="later-svg-note">复制更新前输出</text></g>}
      <g opacity={replay}><rect x="650" y="285" width="420" height="100" rx="12" className="ds2-readout" /><text x="671" y="312" className="later-svg-title">历史匹配 L_dark = {fmt(step.losses.dark,4)}</text>{step.replayLogits ? step.replayLogits.map((v,k)=><text key={k} x={671+k*128} y="348" className="ds2-vector">{MODEL_CLASSES[k]} {fmt(v,2)}</text>) : <text x="671" y="348" className="later-svg-note">空池没有历史响应</text>}<text x="671" y="374" className="later-svg-note">当前 a 与固定 z 逐类比较</text></g>
      <g opacity={done(3)}><path d="M1080 151H1093V434H1070M1080 333H1105V460H1070" className="ds2-loss-link" /><rect x="365" y="414" width="705" height="64" rx="12" className="ds2-total" /><text x="385" y="440" className="ds-total-formula">L_DER = L_current + α L_dark</text><text x="385" y="465" className="ds2-vector">{fmt(step.losses.current,4)} + {CONFIG.alpha} × {fmt(step.losses.dark,4)} = {fmt(step.losses.total,4)}</text><text x="1046" y="452" textAnchor="end" className="later-svg-title">θ → θ⁺ · 仅一次更新</text><path d="M365 447H334V195H355" className="ds2-update-link" markerEnd={`url(#${id}-arrow)`} /></g>
      <text x="40" y="415" className="later-svg-note">更新后才选留</text><text x="40" y="449" className="ds2-vector">M = [{state.M.map(r=>r.id).join(', ')}]</text><text x="40" y="478" className="later-svg-note">{phase===4&&p>=.88?'本轮写入已提交':'候选不提前进入旧池'}</text>
    </svg></div>
    <p className="later-event" aria-live="polite">{notes[phase]}</p><SceneTransport timeline={timeline} clips={clips} label="DER 单步" showTiming={false} teachingProgress />
    <p className="der-footnote">单步机制示例 · 数值来自独立二维线性教学模型，像素图只标识类别；不是上方插入示例的真实网络求值。α={CONFIG.alpha}。</p>
  </section>;
}
