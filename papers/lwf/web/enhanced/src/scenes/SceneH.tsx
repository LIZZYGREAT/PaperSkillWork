import React, { useMemo, useState } from 'react';
import { useReferenceHub } from '../components/ReferencePrimitives';
import { InlineNotation } from '../components/InlineNotation';

type TaskId = 'A'|'B'|'C'|'D';
type ReferenceMode = 'current'|'original';
const stages = ['Stage 0 · A', 'Stage 1 · +B', 'Stage 2 · +C', 'Stage 3 · +D'];
const responseByStage = [
  [0.60,0.25,0.10,0.05],
  [0.56,0.27,0.11,0.06],
  [0.52,0.29,0.12,0.07],
  [0.50,0.30,0.13,0.07],
];
const taskNames: Record<TaskId,string> = { A:'Task A', B:'Task B', C:'Task C', D:'Task D' };
const stepsD = [
  'Snapshot current Model₂ as Teacher₂',
  'Load new-task inputs X_D',
  'Run existing task heads A, B, C on X_D',
  'Generate Y_A⁽ᴰ⁾, Y_B⁽ᴰ⁾, Y_C⁽ᴰ⁾ from Teacher₂',
  'Add new-task parameters θ_D',
  'Warm-up the new head',
  'Joint optimize shared and task-specific parameters',
  'Model₃ becomes the current model and next Teacher',
];

export function SceneH() {
  const { openHub } = useReferenceHub();
  const [stage, setStage] = useState(0);
  const [sequence, setSequence] = useState<'places-voc'|'imagenet-scenes'>('places-voc');
  const [selectedCell, setSelectedCell] = useState({ task:'A' as TaskId, stage:0 });
  const [reference, setReference] = useState<ReferenceMode>('current');
  const [targetId, setTargetId] = useState('Y_A^(B)');
  const [workflowStep, setWorkflowStep] = useState(-1);
  const currentResponse = responseByStage[stage];
  const originalResponse = responseByStage[0];
  const teacherStage = Math.max(0, stage - 1);
  const selectedTeacherResponse = reference === 'original' ? originalResponse : responseByStage[teacherStage];
  const displayedReference = selectedTeacherResponse;
  const responseDistance = useMemo(() => responseByStage.map((response) => response.reduce((sum,p,index)=>sum+Math.abs(p-originalResponse[index]),0)/2), [originalResponse]);
  const currentTargets = Array.from({length:stage}, (_,index)=>`Y_${String.fromCharCode(65+index)}^(${String.fromCharCode(66+stage)})`);
  const provenance = targetProvenance(targetId);

  const advanceStage = (next:number) => {
    const clamped = Math.min(3,Math.max(0,next));
    setStage(clamped);
    const taskAtStage: TaskId = clamped === 0 ? 'A' : clamped === 1 ? 'A' : clamped === 2 ? 'B' : 'C';
    setSelectedCell({ task: taskAtStage, stage:clamped });
    setTargetId(clamped > 0 ? `Y_A^(${String.fromCharCode(65+clamped)})` : 'Y_A^(B)');
    setReference('current');
  };
  const nextWorkflow = () => {
    if (workflowStep < 0) { setWorkflowStep(0); setStage(2); setSelectedCell({task:'C',stage:2}); }
    else if (workflowStep < stepsD.length - 1) setWorkflowStep((step)=>step+1);
    else { setStage(3); setSelectedCell({task:'D',stage:3}); setWorkflowStep(stepsD.length); }
  };

  return <div className="v2-scene-content v2-scene-h">
    <section className="v2-h-intro v2-state-card">
      <div className="v2-section-title-row"><div><p className="v2-eyebrow">SEQUENTIAL TASKS · MODEL LINEAGE</p><h2>当 Task C 到来时，谁是 Teacher？</h2></div><button className="v2-intro-evidence" type="button" onClick={()=>openHub({evidenceId:'E05'})}>顺序实验 E05 ↗</button></div>
      <div className="v2-h-lineage">{stages.map((label,index)=><React.Fragment key={label}><button type="button" className={stage===index?'is-current':''} aria-pressed={stage===index} onClick={()=>advanceStage(index)}><small>{label.split(' · ')[0]}</small><strong>Model{index}</strong><span>{index===0?'Task A':`+${String.fromCharCode(64+index)} → Model${index}`}</span></button>{index<3?<i aria-hidden="true">→</i>:null}</React.Fragment>)}</div>
      <p>每次手动切换一个阶段。Stage 1 的 Student 形成 Model₁；到 Stage 2，当前 Model₁ 被快照为 Teacher₁。论文的递归流程使用上一阶段模型作下一阶段 Teacher，不会永久锚定 Model₀。</p>
      <div className="v2-h-param-timeline"><div><span>Shared backbone</span><strong>θ_s⁽⁰⁾ → θ_s⁽¹⁾ → θ_s⁽²⁾ → θ_s⁽³⁾</strong><small>一套共享表示随阶段持续更新</small></div><div><span>Task-specific heads</span><strong>θ_A → θ_A+θ_B → +θ_C → +θ_D</strong><small>head 随新任务增加；head 被保留不代表任务行为不变</small></div></div>
    </section>

    <section className="v2-h-role v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">TASK ROLE TIMELINE</p><h2>“新任务参数”是阶段角色</h2></div></div><div className="v2-h-role-row"><strong>θ_B</strong><span className="is-absent">Stage 0 · 不存在</span><span className={stage>=1?'is-new':'is-pending'}>Stage 1 · NEW</span><span className={stage>=2?'is-old':'is-pending'}>Stage 2 · OLD</span><span className={stage>=3?'is-old':'is-pending'}>Stage 3 · OLD</span></div><p>θ_B 在加入 Task B 的当前阶段是 NEW；到 Task C / D 到来时，它属于旧任务 head。new-task 并非永久结构标签。</p></section>

    <section className="v2-h-response v2-state-card">
      <div className="v2-section-title-row"><div><p className="v2-eyebrow">TEACHER PROVENANCE · TARGET DRIFT · TEACHING TOY</p><h2>旧任务响应 target 在每一阶段重新生成</h2></div><span className="v2-source-badge is-toy">TOY VALUES · NOT PAPER MEASUREMENTS</span></div>
      <div className="v2-h-stage-targets"><div className="v2-h-target-selector"><strong>当前阶段 {stage} · old response cache</strong>{(currentTargets.length?currentTargets:['等待加入下一任务']).map((id,index)=><button type="button" key={id} disabled={!currentTargets.length} className={targetId===id?'is-selected':''} onClick={()=>setTargetId(id)}><InlineNotation text={currentTargets.length?id:`X_${String.fromCharCode(66+stage)} → Teacher(${`X_${String.fromCharCode(66+stage)}`})`} /></button>)}</div><article className="v2-h-provenance"><span>Selected response target</span><h3><InlineNotation text={targetId} /></h3><dl><div><dt>Input</dt><dd><InlineNotation text={provenance.input} /></dd></div><div><dt>Generated by</dt><dd><InlineNotation text={provenance.teacher} /></dd></div><div><dt>Lineage</dt><dd><InlineNotation text={provenance.lineage} /></dd></div></dl><p>每个阶段只在当阶段新输入上重新计算所有既有任务 head 的 response；目标 cache 是 stage-specific。</p></article></div>
      <div className="v2-h-drift-layout"><div className="v2-h-drift-controls"><strong>Task A · 同一 Teaching Toy probe</strong><div className="v2-h-toggle" role="group" aria-label="选择 response reference"><button type="button" aria-pressed={reference==='current'} onClick={()=>setReference('current')}>Current Teacher · Model{teacherStage}</button><button type="button" aria-pressed={reference==='original'} onClick={()=>setReference('original')}>Original Teacher · Model₀</button></div><p>右侧当前 Student 是 Model{stage}；该阶段开始时的 Teacher 是 Model{teacherStage}。Toy 响应向量逐阶段给出，展示 current target 可不同于 original target。这里不是 LwF 训练运行记录。</p></div><div className="v2-h-response-vectors"><ResponseVector label={`Original · Model₀`} values={originalResponse} /><ResponseVector label={`Current Student · Model${stage}`} values={currentResponse} /><ResponseVector label={`Selected Teacher target · Model${reference==='original'?0:teacherStage}`} values={displayedReference} highlight /></div></div>
      <div className="v2-h-metrics"><Metric label="Student vs selected Teacher · L1 / 2" value={`${totalVariation(currentResponse,displayedReference).toFixed(3)} · Teaching Toy`} /><Metric label="Current Teacher response distance from Model₀" value={responseDistance[teacherStage].toFixed(3)} /><Metric label="Top-1 across toy snapshots" value="class 1 · unchanged" /></div>
      <p className="v2-h-boundary">Teacher responses: {responseByStage.map((row)=>`[${row.map((p)=>p.toFixed(2)).join(', ')}]`).join(' → ')} · Teaching Toy 例子。该序列用于说明 current target 与 original target 可不同；不是论文数值，也不声称漂移必然线性、单调，或所有任务都会更差。</p>
    </section>

    <section className="v2-h-matrix v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">TASK × STAGE MATRIX</p><h2>旧 head 保留，shared backbone 仍在变化</h2></div></div><div className="v2-h-matrix-wrap"><table><thead><tr><th>Task / Stage</th>{stages.map((label,index)=><th key={label} scope="col">Stage {index}</th>)}</tr></thead><tbody>{(['A','B','C','D'] as TaskId[]).map((task,row)=><tr key={task}><th scope="row">Task {task}{task==='A'?' · θ_A':''}</th>{stages.map((_,column)=><td key={column}><button type="button" disabled={column<row} className={`${column===row?'is-learned':'is-retained'} ${selectedCell.task===task&&selectedCell.stage===column?'is-selected':''}`} onClick={()=>setSelectedCell({task,stage:column})}>{column<row?'—':column===row?'learned':'retained'}</button></td>)}</tr>)}</tbody></table></div><div className="v2-h-selected-cell"><strong>{taskNames[selectedCell.task]} @ Stage {selectedCell.stage}</strong><span>head θ_{selectedCell.task} is {selectedCell.stage===(['A','B','C','D'] as TaskId[]).indexOf(selectedCell.task)?'newly added at this stage':'present'}; shared θ_s is the evolving snapshot θ_s⁽{selectedCell.stage}⁾.</span><button type="button" onClick={()=>openHub({termId:'theta_s'})}>查看 θ_s →</button></div><div className="v2-h-head-warning"><div><b>θ_A retained</b><span>same Task A head weights</span></div><i>×</i><div><b>h⁽⁰⁾ ≠ h⁽³⁾</b><span>shared representation may change</span></div><i>→</i><div><b>prediction may differ</b><span>head retained ≠ task preserved</span></div></div></section>

    <section className="v2-h-cache v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">STAGE-SPECIFIC RESPONSE CACHE</p><h2>创建 → 使用 → 下一阶段重算</h2></div></div><div className="v2-h-cache-row"><div><span>created at current stage</span><strong>X_{String.fromCharCode(65+stage)} + {currentTargets.join(' · ')||'no old targets yet'}</strong></div><i>→</i><div><span>used by</span><strong>L_old on current Xₙ</strong></div><i>→</i><div><span>when next task arrives</span><strong>discard old cache; recompute all old heads on X_next</strong></div></div><p>首次生成的 Y_A 不会永久贯穿所有后续阶段。输入变化后，对应各 head 的当前 Teacher output 也需要重新计算。</p></section>

    <section className="v2-h-add-d v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">MANUAL WORKFLOW · REUSE B/C CAPABILITIES</p><h2>推进一次 Add Task D</h2></div><button type="button" className="v2-h-start-button" onClick={nextWorkflow}>{workflowStep<0?'开始 Task D':workflowStep<stepsD.length?'执行下一步': 'Task D 已加入'}</button></div><ol className="v2-h-workflow">{stepsD.map((step,index)=><li key={step} className={workflowStep===index?'is-current':workflowStep>index?'is-done':''}><span>{index+1}</span><div><strong>{step}</strong>{index===3?<small>Y_A⁽ᴰ⁾、Y_B⁽ᴰ⁾、Y_C⁽ᴰ⁾ 的 source 均为 Model₂ 的对应 head</small>:null}</div></li>)}</ol><p>按按钮逐步推进；不会定时自动播放。完成最后一步后，Model₃ 成为 current model 与下一任务的 Teacher。</p></section>

    <section className="v2-h-sequence v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">PAPER SEQUENTIAL EXPERIMENT · FIGURE 4</p><h2>论文中的两条任务序列</h2></div><a className="v2-h-paper-link" href="https://arxiv.org/pdf/1606.09282#page=8" target="_blank" rel="noreferrer">打开 Figure 4 原文 ↗</a></div><div className="v2-h-sequence-select"><button type="button" aria-pressed={sequence==='places-voc'} onClick={()=>setSequence('places-voc')}>Places365 → VOC parts</button><button type="button" aria-pressed={sequence==='imagenet-scenes'} onClick={()=>setSequence('imagenet-scenes')}>ImageNet → Scenes parts</button></div><div className="v2-h-sequence-detail"><div><span>{sequence==='places-voc'?'Places365 → VOC':'ImageNet → MIT Indoor Scenes'}</span><strong>{sequence==='places-voc'?'transport → animals → objects':'large rooms → medium rooms → small rooms'}</strong><small>{sequence==='places-voc'?'VOC 是 multi-label：拆的是标签组，图像可共享，不代表互斥的新数据集。':'场景任务按室内空间大小分阶段加入。'}</small></div><div><span>Figure 4 reports</span><strong>各阶段任务表现历史</strong><small>原图查看具体曲线；这里不从像素估读坐标，也不自动播放或补造精确数值。</small></div></div><p>论文的顺序实验支持“多阶段后旧任务仍可能退化”，但没有建立误差线性或必然单调累积的定律。Immediate forgetting（加入下一任务前后）与 long-term forgetting（最初与多阶段后）是不同比较窗口。</p><div className="v2-h-counterfactual"><strong>Counterfactual Teaching Experiment · original-Teacher strategy</strong><span>若每个阶段都固定用 Model₀ 当 Task A Teacher，可直接锚定原始响应，但这不是论文的递归 LwF 流程；保留多份原始 Teacher snapshots 会增加存储与推理计算。</span></div><footer><span>单步响应保持、域覆盖限制、序列 Teacher 漂移与论文实测证据现在串在同一条时间线。</span><b>下一步：核对每条主张由哪项实验支持 → Scene I</b></footer></section>
  </div>;
}

function targetProvenance(id:string) {
  const match=id.match(/Y_([A-D])\^\(([B-D])\)/);
  if(!match) return {input:'等待新任务输入 X_B',teacher:'Model₀',lineage:'Model₀ trained on Task A'};
  const [,task,stage]=match;
  const teacherIndex=stage.charCodeAt(0)-66;
  return {input:`X_${stage}`,teacher:`Model${teacherIndex}`,lineage:teacherIndex===0?'Model₀ trained on Task A':`Model${teacherIndex} came from Model${teacherIndex-1} + learning Task ${String.fromCharCode(65+teacherIndex)}`};
}
function totalVariation(left:number[],right:number[]) { return left.reduce((sum,value,index)=>sum+Math.abs(value-right[index]),0)/2; }
function ResponseVector({label,values,highlight=false}:{label:string;values:number[];highlight?:boolean}) { return <div className={`v2-h-vector ${highlight?'is-highlight':''}`}><span>{label}</span><div>{values.map((value,index)=><div key={index}><small>class {index+1}</small><b>{value.toFixed(2)}</b><i><em style={{width:`${value*100}%`}} /></i></div>)}</div></div>; }
function Metric({label,value}:{label:string;value:string}) { return <div className="v2-h-metric"><span>{label}</span><strong>{value}</strong></div>; }
