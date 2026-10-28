import {useMemo,useState} from "react";
import SceneTransport,{useSceneTimeline} from "./review/SceneTransport";
import {runTraining,trainingSceneAt,WORKBENCH_CLIPS,TRAIN_PHASES,predict,CONFIG,STREAM,type Mode,type TrainingRecord} from "./training-model";
import {windowAt,curve,mix} from "./review/lifecycle-model";
import {SampleGlyph,NetworkGlyph,ScoreGlyph,MotionPath,fmt,vectorText} from "./LearningGlyphs";
import {MODEL_CLASSES} from "../data/model-classes";
import "./learning-scenes.css";
import "./workbench.css";
function StoredRecord({record,x,y,opacity=1,mode}:{record:TrainingRecord;x:number;y:number;opacity?:number;mode:Mode}){
return <g transform={`translate(${x} ${y})`} opacity={opacity} data-training-record={record.id} data-target={record.z.join(",")} data-generated-by={record.origin}><rect width="270" height="88" rx="10" className="tg-slot"/><SampleGlyph x={11} y={12} size={48} model={record.model} id={record.id}/><text x="71" y="24" className="tg-title">{record.id} · □ z @{record.origin}</text><text x="71" y="48" className="tg-small">{vectorText(record.z)}</text><text x="71" y="72" className="tg-small">{mode==="DER++"?"y = "+MODEL_CLASSES[record.y!]:"DER 记录不保存 y"}</text></g>;
}
function StepDetails({step}:{step:ReturnType<typeof runTraining>[number]}){
return <details className="local-detail" data-numeric-details><summary>展开本轮可复算状态、视图与联合梯度</summary><p>这是 W5 的二维线性合成模型 h_W(u)=Wu；无 bias/momentum。η={CONFIG.eta}，α={CONFIG.alpha}，β={CONFIG.beta}（仅 DER++）。图中类别标识用于稳定身份，u 不是从真实图片计算的特征。</p><div className="table-scroll"><table><thead><tr><th>来源</th><th>原始 u / 标签</th><th>增强视图</th><th>更新前输出</th><th>目标</th></tr></thead><tbody>
<tr><th>当前 {step.input.id}</th><td>{vectorText(step.input.u,1)} / {MODEL_CLASSES[step.input.y]}</td><td>{vectorText(step.currentView,1)}</td><td>{vectorText(step.currentLogits,6)}</td><td>真实 y / 候选 z 同此输出</td></tr>
{step.rd&&<tr><th>Rd {step.rd.id}</th><td>{vectorText(step.rd.u,1)}</td><td>{vectorText(step.replayView!,1)}</td><td>{vectorText(step.replayLogits!,6)}</td><td>固定 z={vectorText(step.rd.z,6)}</td></tr>}
{step.ry&&<tr><th>Ry {step.ry.id}</th><td>{vectorText(step.ry.u,1)} / {MODEL_CLASSES[step.ry.y!]}</td><td>{vectorText(step.labelView!,1)}</td><td>{vectorText(step.labelLogits!,6)}</td><td>真实 {MODEL_CLASSES[step.ry.y!]}</td></tr>}
</tbody></table></div><div className="wb-matrices">{[["进入 W",step.before.W],["联合梯度",step.gradients.total],["更新后 W",step.after.W]].map(([title,matrix])=><div key={String(title)}><strong>{String(title)}</strong><pre>{(matrix as readonly (readonly number[])[]).map(row=>row.map(v=>fmt(v,9)).join("   ")).join("\n")}</pre></div>)}</div><p>总损失 {fmt(step.losses.total,9)} = 当前 {fmt(step.losses.current,9)} + α·{fmt(step.losses.dark,9)}{step.mode==="DER++"?" + β·"+fmt(step.losses.label,9):""}。全部梯度使用同一进入 W，求和后一次 W⁺=W−ηg。</p></details>;
}
export default function Workbench(){
const [mode,setMode]=useState<Mode>("DER"),steps=useMemo(()=>runTraining(mode),[mode]),timeline=useSceneTimeline(WORKBENCH_CLIPS),{clipIndex:c,progress:p}=timeline.state,{step,round,phase,prediction,state}=trainingSceneAt(steps,c,p);
const completed=(i:number)=>phase>i?1:phase<i?0:windowAt(p,.08,.85),write=phase===4?windowAt(p,.18,.88):0,reading=phase===0?windowAt(p,.06,.82):1;
const result=predict(steps[3].after),records=[...step.before.M,step.candidate],dest=step.insertion.slot,slotY=(slot:number)=>413+slot*99;
const candidatePos=phase===4?(dest===null?{x:mix(67,17,write),y:180}:curve(write,{x:67,y:180},{x:67,y:280},{x:67,y:slotY(dest)-90},{x:67,y:slotY(dest)})):{x:67,y:180};
const currentViewPos=curve(windowAt(p,.04,.65),{x:130,y:100},{x:340,y:100},{x:375,y:110},{x:395,y:205});
const forward=phase===1?windowAt(p,.1,.8):phase===2?windowAt(p,.1,.8):prediction?windowAt(p,.1,.8):0;
const replayPos=curve(reading,{x:337,y:step.rd?slotY(step.before.M.indexOf(step.rd))+16:430},{x:320,y:420},{x:350,y:278},{x:416,y:278});
const narr=prediction?"训练已结束。查询 u=(1,0.5) 只经 θ₄ 产生 logits 和 argmax；不采样 M、不求训练损失，不更新 θ 或 N。Task-IL 测试时的任务身份属于另一种评测协议，不进入这里的普通预测。":
phase===0?(step.rd?`先从进入本轮的旧 M 读 Rd=${step.rd.id}${step.ry?"，另读 Ry="+step.ry.id:""}。当前 ${step.input.id} 尚未入池；记忆内容与 N 不变。`:"θ₀、空 M、N=0、K=2。空池无回放来源，本轮只用当前标签训练。"):
phase===1?`${step.input.id} 的原始 u 经本轮视图生成当前 logits，并在更新前复制为候选 z。固定副本之后不随 θ 更新。`:
phase===2?(step.rd?`回放 ${step.rd.id} 的新 a 与旧 z 匹配${step.ry?"；"+step.ry.id+" 的真实标签另做回放 CE":""}。所有项在同一更新前 θ 上计算。`:"没有历史回放；当前 CE 是唯一损失来源。"):
phase===3?`损失合并为 ${fmt(step.losses.total)}，对 θ 只更新一次。现在仍是写入前的 M 和 N=${step.before.N}；当前候选的 z 不重算。`:
`更新后才选留：${step.insertion.decision==="append"?"有空槽，追加 "+step.input.id:step.insertion.decision==="replace"?"预设 j=0，替换 x₁ 为 x₃":"预设 j=3≥K，拒收 x₄，但它已参与当前训练"}。结束 N=${step.after.N}，该终态交给下一轮。`;
return <section className="teaching-scene workbench" data-scene="workbench" data-mode={mode} data-clip={c} data-progress={p} data-status={timeline.state.status} data-round={round+1} data-phase={phase} data-seen={state.N} data-updates={state.updates} data-memory={state.M.map(r=>r.id).join(",")} data-weights={JSON.stringify(state.W)}>
<header><div><p className="eyebrow">ALGORITHM / 四轮连续执行</p><h3>从空池开始，沿同一组状态走到预测。</h3><p>每轮继承上一轮的 θ、M、N。可以回到任一轮检查前后状态；回退只改变观察位置，不会再次训练。</p></div><div className="mode-switch" aria-label="算法模式">{(["DER","DER++"] as Mode[]).map(m=><button key={m} data-mode={m} aria-pressed={mode===m} onClick={()=>{setMode(m);timeline.reset()}}>{m}</button>)}</div></header>
<div className="wb-rounds" aria-label="轮次导航">{STREAM.map((item,i)=><button key={item.id} data-round-select={i} aria-pressed={!prediction&&round===i} onClick={()=>timeline.start(i*5)}><span>0{i+1} / {item.id}</span>{["空池起步","开始回放","先用后替换","训练后拒收"][i]}</button>)}<button data-predict aria-pressed={prediction} onClick={()=>timeline.start(20)}><span>05 / 查询</span>只读预测</button></div>
<SceneTransport timeline={timeline} clips={WORKBENCH_CLIPS} label="四轮工作台" showTiming={false}/>
<div className="wb-state"><span>同一 θ <b>{state.updates}</b></span><span>已处理 N <b>{state.N}</b></span><span>固定 K <b>2</b></span><span>记录数 |M| <b>{state.M.length}</b></span><button onClick={()=>timeline.start(round*5)} data-replay-round>回到本轮起点</button></div>
<div className="teaching-stage"><svg viewBox="0 0 1200 648" className="teaching-canvas" role="img" aria-label="当前输入、唯一网络、持久记忆、联合计算与预测">
<text x="47" y="39" className="tg-title">{prediction?"查询输入 · 恒等评测视图":`第 ${round+1} 轮 · 当前 ${step.input.id}`}</text><text x="47" y="66" className="tg-small">{prediction?"u_query=(1,0.5) · 不需要任务身份":`原始 u=${vectorText(step.input.u,1)} · y=${MODEL_CLASSES[step.input.y]}`}</text>
<SampleGlyph x={57} y={91} size={64} model={prediction?0:step.input.model} id={prediction?"query":step.input.id+" original"}/><path d="M130 123H340C410 123 400 228 445 228" className="tg-path" opacity={prediction?1:completed(1)}/>
{phase===1&&p>.05&&p<.86&&<SampleGlyph x={currentViewPos.x} y={currentViewPos.y} size={44} model={step.input.model} id={step.input.id+" view"} view={step.input.s}/>}
<NetworkGlyph x={445} y={171} version={`θ${state.updates}`} forward={forward} backward={phase===3?windowAt(p,.1,.8):0}/>
<g opacity={prediction?windowAt(p,.3,.85):completed(1)}><ScoreGlyph x={795} y={126} label={prediction?"查询输出 · θ₄":`当前 ${step.input.id} · 更新前 logits`} values={prediction?result.logits:step.currentLogits} reveal={prediction?windowAt(p,.15,.75):completed(1)}/></g>
<path d="M671 245H758V157H795" className="tg-path" opacity={prediction?windowAt(p,.1,.8):completed(1)}/>
<g opacity={prediction?.35:1} data-workbench-memory><rect x="47" y="365" width="310" height="265" rx="16" className="tg-memory"/><text x="67" y="622" className="tg-title">持久记忆 M · K=2</text>{[0,1].map(slot=><g key={slot}><rect x="64" y={slotY(slot)-3} width="277" height="94" rx="11" className="tg-slot"/>{!state.M[slot]&&<text x="78" y={slotY(slot)+50} className="tg-small">slot {slot} · 空</text>}</g>)}</g>
{records.map(r=>{
const isCandidate=r.id===step.candidate.id,oldSlot=step.before.M.findIndex(q=>q.id===r.id),leaves=!isCandidate&&phase===4&&step.insertion.evicted?.id===r.id;
const x=isCandidate?candidatePos.x:67-(leaves?write*50:0),y=isCandidate?candidatePos.y:slotY(oldSlot);
const opacity=prediction?(step.after.M.some(q=>q.id===r.id)?.35:0):isCandidate?(phase>=1?completed(1)*(dest===null&&phase===4?1-write:1):0):leaves?1-write:1;
return <StoredRecord key={r.id} record={r} x={x} y={y} opacity={opacity} mode={mode}/>;
})}
{phase===1&&p>.48&&p<.85&&<g transform={`translate(${mix(970,300,windowAt(p,.48,.85))} ${mix(90,160,windowAt(p,.48,.85))})`}><text className="tg-small">□ 冻结数值副本</text></g>}
<text x={prediction?67:795} y={prediction?300:490} className="tg-small" data-transition-note>{prediction?"记忆保留，但预测不读取它":phase===4?`Reservoir：${step.insertion.j===undefined?"无需抽签":"教学预设 j="+step.insertion.j}`:"本步候选在池外，更新前冻结"}</text>
{!prediction&&step.rd&&<><MotionPath d={`M337 ${slotY(step.before.M.indexOf(step.rd))+44}C400 ${slotY(step.before.M.indexOf(step.rd))+44} 405 310 445 310`} progress={completed(0)}/>{phase===0&&p>.05&&p<.85&&<SampleGlyph x={replayPos.x} y={replayPos.y} size={38} id={step.rd.id+" replay read"} model={step.rd.model}/>}</>}
{!prediction&&<g opacity={completed(2)}><rect x="780" y="261" width="367" height="200" rx="13" className="tg-loss"/><text x="801" y="291" className="tg-title">本轮监督 · 同一更新前 θ</text><text x="801" y="322">L<tspan baselineShift="sub" fontSize="12">current</tspan> = {fmt(step.losses.current)}</text><text x="801" y="354">α·L<tspan baselineShift="sub" fontSize="12">dark</tspan> = 0.5 × {fmt(step.losses.dark)}</text><text x="801" y="377" className="tg-small">{step.rd?`Rd=${step.rd.id}，a=${vectorText(step.replayLogits!,2)}`:"空池，无历史目标"}</text>{mode==="DER++"&&<><text x="801" y="408">β·L<tspan baselineShift="sub" fontSize="12">replay-CE</tspan> = 0.5 × {fmt(step.losses.label)}</text><text x="801" y="433" className="tg-small">{step.ry?`Ry=${step.ry.id}，y=${MODEL_CLASSES[step.ry.y!]}`:"空池，无标签回放"}</text></>}</g>}
{!prediction&&<g opacity={completed(3)}><path d="M1147 360H1165V541H700" className="tg-path"/><rect x="433" y="507" width="267" height="79" rx="13" className="tg-total"/><text x="454" y="538" className="tg-title">总损失 {fmt(step.losses.total)}</text><text x="454" y="565" className="tg-small">一次 θ 更新，随后才允许写 M</text><MotionPath d="M558 507V415" progress={phase===3?windowAt(p,.3,.8):1} kind="gradient"/></g>}
{prediction&&<g opacity={windowAt(p,.45,.9)}><rect x="780" y="280" width="367" height="156" rx="14" className="tg-total"/><text x="800" y="315" className="tg-title">argmax → {MODEL_CLASSES[result.label]}</text><text x="800" y="349" className="tg-small">普通预测：只读当前 θ₄</text><text x="800" y="377" className="tg-small">θ / M / N 保持逐值不变</text><text x="800" y="405" className="tg-small">无回放、无梯度、无入池</text></g>}
<text x="47" y="642" className="tg-small">合成教学模型 · 回放选择与随机结果预设 · 数值均由 trainStep 计算，非论文实验输出</text>
</svg></div><div className="scene-explanation" aria-live="polite"><strong>{prediction?"预测入口":TRAIN_PHASES[phase]}</strong><p>{narr}</p></div>
<StepDetails step={step}/><p className="quiet-note">执行整理依据：Algorithms 1–3；空池分支、DER 二元记录、容量/计数符号及下降方向按 W2 M01–M06 消歧。普通预测入口由函数定义与评测协议整理，原文没有独立预测 Algorithm。没有新增模型、动态扩头或任务末尾操作。</p>
</section>;
}
