import { TrainingFormulaLesson } from "./TrainingFormulaLessons";
import {useState} from "react";
import {runTraining,TRAIN_PHASES,trainingSceneAt} from "./training-model";
import {windowAt,curve} from "./review/lifecycle-model";
import SceneTransport,{useSceneTimeline} from "./review/SceneTransport";
import {SampleGlyph,NetworkGlyph,ScoreGlyph,MotionPath,fmt,vectorText} from "./LearningGlyphs";
import {Term} from "./Reference";
import "./learning-scenes.css";
const steps=runTraining("DER"),clips=TRAIN_PHASES.map(id=>({id,durationMs:6000,holdMs:1600}));
export default function DERTrainingStep(){
 const [empty,setEmpty]=useState(false),timeline=useSceneTimeline(clips),phase=timeline.state.clipIndex,p=timeline.state.progress;
 const round=empty?0:1,{step,state}=trainingSceneAt(steps,round*5+phase,p),done=(i:number)=>phase>i?1:phase<i?0:windowAt(p,.08,.86);
 const cm=done(1),rm=done(2),current=curve(cm,{x:72,y:140},{x:240,y:140},{x:330,y:186},{x:368,y:186}),replay=curve(rm,{x:198,y:475},{x:300,y:475},{x:345,y:310},{x:368,y:278});
 const notes=[
 empty?"M 为空，无历史项可读取。本轮只由当前 x₁ / y₁ 提供分类监督。":"先读取已有 x₁ / z₁。读出的副本参与回放，M、N 保持原样；当前 x₂ 尚未入池。",
 "当前视图经过 θ，产生 logits。真实 y 计算 CE，同时复制更新前输出为本步冻结候选 z；参数尚未更新。",
 empty?"没有回放样本，历史匹配项为 0。":"重新前向旧图的本次视图，得到新 a；与原记录中固定 z 比较，形成 L_dark。两个前向共享更新前的同一 θ。",
 "L_current 与 α·L_dark 先合成，再对当前网络更新一次。M/N 仍未改变；冻结候选不刷新。",
 "更新结束，才把当前原图与它自己的冻结目标交给 Reservoir。本例有空槽，直接追加；终态交给下一轮。"];
 return <section className="teaching-scene" data-scene="der-step" data-clip={phase} data-progress={p} data-status={timeline.state.status} data-updates={state.updates} data-seen={state.N} data-loss={step.losses.total}>
 <header><div><p className="eyebrow">DER / 单步闭环</p><h3>两条监督，只更新同一个网络一次。</h3><p>选留解决未来留下谁。训练先读旧 M，用当前标签与 <Term id="z">历史响应</Term> 约束现在的参数，最后才尝试写入当前候选。</p></div><div className="scene-options"><button aria-pressed={!empty} onClick={()=>{setEmpty(false);timeline.reset()}}>有旧记忆</button><button aria-pressed={empty} onClick={()=>{setEmpty(true);timeline.reset()}}>空池首轮</button></div></header>
 <TrainingFormulaLesson/>
<SceneTransport timeline={timeline} clips={clips} label="DER 单步" showTiming={false}/>
 <div className="teaching-stage"><svg viewBox="0 0 1120 630" className="teaching-canvas" role="img" aria-label="当前分类、旧记忆回放与一次联合更新">
 <text x="52" y="37" className="tg-title">当前输入支路</text><text x="52" y="65" className="tg-small">{step.input.id} · y={["Claude","GPT","DeepSeek"][step.input.y]}</text>
 <SampleGlyph x={72} y={140} id={step.input.id} model={step.input.model}/><text x="52" y="231" className="tg-small">原图保留 · 训练视图前向</text>
 <MotionPath d="M136 172C240 172 300 218 420 218" progress={cm}/>{phase===1&&p>.04&&p<.86&&<SampleGlyph x={current.x} y={current.y} size={44} id={step.input.id+" current view"} model={step.input.model} view={step.input.s}/>}
 <NetworkGlyph x={420} y={135} version={`θ${state.updates}`} forward={phase===1?windowAt(p,.25,.7):phase===2?windowAt(p,.35,.75):0} backward={phase===3?windowAt(p,.12,.8):0}/>
 <MotionPath d="M646 218H750" progress={cm}/><g opacity={done(1)}><ScoreGlyph x={760} y={120} label="当前输出 b → CE(y,q)" values={step.currentLogits} reveal={cm}/><rect x="760" y="239" width="289" height="48" rx="9" className="tg-loss"/><text x="777" y="269">L<tspan baselineShift="sub" fontSize="12">current</tspan> = {fmt(step.losses.current)}</text></g>
 <rect x="52" y="405" width="305" height="164" rx="14" className="tg-memory"/><text x="72" y="434" className="tg-title">已有 M · N={state.N} / K=2</text>
 {state.M.map((r,i)=><g key={r.id}><rect x={72+i*140} y="450" width="126" height="98" rx="9" className="tg-slot"/><SampleGlyph x={82+i*140} y={460} size={40} id={r.id+" stored"} model={r.model}/><text x={133+i*140} y="480">{r.id}</text><text x={83+i*140} y="531" className="tg-small">z {vectorText(r.z,2)}</text></g>)}
 {!state.M.length&&<text x="80" y="495" className="tg-small">空池：仅当前分类损失</text>}
 {step.rd&&<><MotionPath d="M198 495C300 495 345 310 420 310" progress={rm}/>{phase===2&&p>.05&&p<.85&&<SampleGlyph x={replay.x} y={replay.y} size={44} id={step.rd.id+" replay"} model={step.rd.model} view={step.input.sd}/>}</>}
 <g opacity={done(2)}>{step.replayLogits?<><ScoreGlyph x={760} y={349} label={`回放 ${step.rd!.id} · 新 a 对比旧 z`} values={step.replayLogits} reveal={rm}/><text x="760" y="465" className="tg-small">□ z = {vectorText(step.rd!.z)}</text></>:<text x="760" y="381" className="tg-small">M 为空，无历史匹配支路</text>}<rect x="760" y="485" width="289" height="48" rx="9" className="tg-loss"/><text x="777" y="515">α·L<tspan baselineShift="sub" fontSize="12">dark</tspan> = 0.5 × {fmt(step.losses.dark)}</text></g>
 <MotionPath d="M900 287V305H710V550H647M900 533V550H647" progress={done(3)}/><g opacity={done(3)}><rect x="410" y="525" width="237" height="60" rx="11" className="tg-total"/><text x="428" y="551" className="tg-title">合并为一个总损失</text><text x="428" y="575">L_DER = {fmt(step.losses.total)}</text></g><MotionPath d="M528 525V379" progress={phase===3?windowAt(p,.25,.8):phase>3?1:0} kind="gradient"/>
 <g opacity={done(4)}><rect x="70" y="303" width="275" height="65" rx="10" className="tg-frozen"/><text x="86" y="329">当前候选 {step.candidate.id} → 写入 M</text><text x="86" y="351" className="tg-small">z = {vectorText(step.candidate.z)}</text><MotionPath d="M206 368V450" progress={done(4)}/></g>
 </svg></div><div className="scene-explanation" aria-live="polite"><strong>{TRAIN_PHASES[phase]}</strong><p>{notes[phase]}</p></div>
 <p className="quiet-note">数值来自后文同一 2→3 线性教学模型；α=0.5，η=0.1。原图类别是合成身份，二维输入用于可复算说明，不是论文 CNN 特征。下一单元展开训练视图的区别。</p></section>;
}
