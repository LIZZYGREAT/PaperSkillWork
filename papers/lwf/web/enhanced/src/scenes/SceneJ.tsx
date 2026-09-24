import React, { useMemo, useState } from 'react';
import { useReferenceHub } from '../components/ReferencePrimitives';

type ViewMode='paper'|'runtime'|'code';
type StepInfo={title:string;paper:string;input:string;output:string;state:string;scene:string[];cards:string[]};
const steps:StepInfo[]=[
  {title:'0 · Prepare old model',paper:'已有的旧任务模型继续可运行；新阶段拿到当前新任务数据。旧训练输入 Xₒ 与旧真值 Yₒ^GT 不可用于 adaptation。',input:'pretrained old_model + new dataset (Xₙ,Yₙ)',output:'one old model snapshot ready to become Teacher',state:'θₛ and θₒ are loaded; no θₙ yet.',scene:['A'],cards:['symbol:theta_s','symbol:theta_o']},
  {title:'1 · Define the parameter partition',paper:'将共享参数 θₛ 与旧任务输出参数 θₒ 分清；主实验默认 fc8 按 task-specific heads 处理，其余层共享。',input:'old model modules and named parameters',output:'shared backbone θₛ + existing old head θₒ',state:'These values are loaded. A runtime implementation maps them to parameter collections; the paper does not prescribe framework object names.',scene:['B'],cards:['symbol:theta_s','symbol:theta_o']},
  {title:'2 · Add new-task branch',paper:'为新任务类别新增 θₙ；θₛ、θₒ 从 checkpoint 来，θₙ 是新创建的可训练 Parameter object。',input:'shared feature width D and new class count Cₙ',output:'Wₙ ∈ R^(Cₙ×D), bₙ ∈ R^(Cₙ)',state:'θₛ loaded · θₒ loaded · θₙ newly initialized. New head output has Cₙ classes.',scene:['B'],cards:['symbol:theta_n']},
  {title:'3 · Record old responses',paper:'固定 Teacher，在当前新任务图像上运行旧任务 head，记录旧任务响应 Yₒ。它不是旧任务真实标签。',input:'Teacher + Xₙ',output:'Yₒ = CNN(Xₙ, θₛ, θₒ), shape [B,C_old]',state:'Teacher.eval() / no_grad / not in optimizer; keep each target aligned with the same sample.',scene:['B','D','G'],cards:['symbol:y_old','formula:l_old']},
  {title:'4 · Warm-up new head',paper:'先用新任务真实标签训练 θₙ，暂时冻结共享 θₛ 与旧 head θₒ。',input:'Xₙ + Yₙ',output:'θₙ changes; θₛ and θₒ remain fixed',state:'optimizer groups: θₙ only. This is an initial phase, not the full LwF objective.',scene:['B','C'],cards:['phase:warmup','symbol:theta_n']},
  {title:'5 · Joint optimization',paper:'联合旧响应保持、新任务监督与正则化；Student 的旧分支与新分支共享表示。',input:'Xₙ, Yₙ, cached or computed Yₒ, current Student outputs',output:'L = λₒL_old + L_new + R → backward → optimizer.step()',state:'θₛ, θₒ, θₙ train; Teacher stays fixed. backward computes gradients; optimizer.step applies an update to its parameter groups.',scene:['C','D','E','F'],cards:['formula:total_loss','formula:shared_gradient','symbol:lambda_old']},
  {title:'6 · Evaluate old and new tasks',paper:'评估时分别报告旧任务与新任务指标。旧 validation / test 可以由 evaluator 使用，但不能进入训练梯度或 optimizer。',input:'old validation/test and new validation/test, evaluator only',output:'separate old-task and new-task metrics',state:'training access remains: old training inputs and labels unavailable. Evaluation access does not become adaptation access.',scene:['G','I'],cards:['evidence:table_1','dataset:imagenet','dataset:cub']},
  {title:'7 · Another task arrives',paper:'当前 Student 快照成为下一阶段 Teacher；在新输入上重新生成所有旧任务 responses，再添加下一 head 并重复流程。',input:'current Model_t + next-task dataset',output:'Model_t becomes Teacher_t; after adaptation, Model_(t+1) becomes next current model',state:'Recompute Y_A, Y_B, … on the next X; do not carry a first-stage response cache as a permanent target.',scene:['H'],cards:['evidence:figure_4','formula:response_preservation']},
];
const codeLines=[
  {text:'old_model = load_checkpoint()',step:0},
  {text:'teacher = freeze(copy(old_model))',step:1},
  {text:'student = copy(old_model)',step:1},
  {text:'student.add_new_head(num_new_classes)',step:2},
  {text:'old_targets = record_old_responses(teacher, new_dataset)',step:3},
  {text:'warmup(student.new_head)',step:4},
  {text:'for x, y_new, y_old in loader:',step:5},
  {text:'    optimizer.zero_grad()',step:5},
  {text:'    h = student.backbone(x)',step:5},
  {text:'    old_logits = student.old_head(h)',step:5},
  {text:'    new_logits = student.new_head(h)',step:5},
  {text:'    loss_old = response_loss(y_old, old_logits, temperature=T)',step:5},
  {text:'    loss_new = task_loss(new_logits, y_new)',step:5},
  {text:'    loss = lambda_old * loss_old + loss_new + regularization',step:5},
  {text:'    loss.backward()',step:5},
  {text:'    optimizer.step()',step:5},
];
const checklistSections=[
  {title:'Before training',items:['checkpoint loaded','parameter partition defined','new head initialized','Teacher frozen and independent','old responses recorded','sample-response alignment verified','optimizer groups verified','temperature recorded','λₒ recorded','reduction semantics recorded']},
  {title:'Warm-up',items:['θₛ remains unchanged','θₒ remains unchanged','θₙ changes']},
  {title:'Joint optimization',items:['expected parameter groups in optimizer','gradients are finite','Teacher is not updated','loss scales are sensible']},
  {title:'Evaluation',items:['old/new metrics reported separately','old evaluation data not used for training','seeds and run count recorded']},
];
const debugOptions=[
  {title:'Teacher output changes unexpectedly',checks:['parameter identity is independent from Student','Teacher uses eval() and no_grad','no shared storage alias remains','augmentation / preprocessing is consistent'],scenes:['B','C']},
  {title:'θₛ.grad exists but θₛ does not change',checks:['θₛ is in the intended optimizer group','learning rate is nonzero and appropriate','requires_grad is enabled for this phase','optimizer.step() is reached after backward'],scenes:['B','C']},
  {title:'L_old is low but old-task performance is poor',checks:['Xₙ coverage of old-relevant inputs','sample ↔ response alignment','target source is the intended current Teacher','sequential Teacher drift across stages'],scenes:['G','H']},
];

export function SceneJ({onNavigate}:{onNavigate:(scene:'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I')=>void}) {
  const {openHub}=useReferenceHub();
  const [step,setStep]=useState(0);
  const [view,setView]=useState<ViewMode>('paper');
  const [classes,setClasses]=useState(20);
  const [cacheMode,setCacheMode]=useState<'offline'|'online'>('offline');
  const [checks,setChecks]=useState<Record<string,boolean>>({});
  const [debugIndex,setDebugIndex]=useState(0);
  const current=steps[step];
  const debug=debugOptions[debugIndex];
  const newWeights=classes*4096;
  const newBias=classes;
  const checklistCount=checklistSections.reduce((sum,section)=>sum+section.items.length,0);
  const completed=Object.values(checks).filter(Boolean).length;
  const codeFocus=useMemo(()=>codeLines.filter((line)=>line.step===step).length,[step]);

  const toggleCheck=(id:string)=>setChecks((existing)=>({...existing,[id]:!existing[id]}));
  const goTo=(target:number)=>setStep(Math.max(0,Math.min(steps.length-1,target)));
  const handleCodeLine=(target:number)=>{setStep(target);if(target===3)setView('runtime');};

  return <div className="v2-scene-content v2-scene-j">
    <section className="v2-j-intro v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">END-TO-END IMPLEMENTATION WORKFLOW · SYNTHESIS</p><h2>从一个旧模型，到可以检查的完整 LwF 训练循环</h2></div><span className="v2-source-badge is-toy">IMPLEMENTATION GUIDE</span></div><p>J 把 A–I 收束成实现顺序；这里的代码是面向实现的伪代码，不是论文原始源代码。点击任一步、参数符号或代码行，可打开对应机制页与 Reference Hub。</p><div className="v2-j-view-tabs" role="group" aria-label="工作流视图">{(['paper','runtime','code'] as ViewMode[]).map((mode)=><button key={mode} type="button" aria-pressed={view===mode} onClick={()=>setView(mode)}>{mode==='paper'?'Paper View':mode==='runtime'?'Runtime View':'Code View'}</button>)}</div></section>

    <section className="v2-j-workflow v2-state-card"><nav className="v2-j-step-nav" aria-label="LwF 实现步骤">{steps.map((item,index)=><button key={item.title} type="button" className={step===index?'is-active':''} aria-current={step===index?'step':undefined} onClick={()=>goTo(index)}><span>{String(index).padStart(2,'0')}</span><strong>{item.title.replace(/^\d · /,'')}</strong></button>)}</nav><article className="v2-j-step-detail"><p className="v2-eyebrow">WORKFLOW STEP {step} / 7</p><h2>{current.title.replace(/^\d · /,'')}</h2><p>{current.paper}</p><div className="v2-j-io-grid"><div><span>Input</span><strong>{current.input}</strong></div><div><span>Output / consequence</span><strong>{current.output}</strong></div></div><div className="v2-j-state-detail"><span>State change / implementation note</span><p>{current.state}</p></div><div className="v2-j-related"><span>Inspect deeper</span>{current.scene.map((scene)=><button key={scene} type="button" onClick={()=>onNavigate(scene as 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I')}>Scene {scene} →</button>)}{current.cards.map((id)=><button key={id} type="button" onClick={()=>openHub({cardId:id})}>{cardShort(id)} ↗</button>)}</div><footer><button type="button" disabled={step===0} onClick={()=>goTo(step-1)}>← 上一步</button><span>{step+1} / {steps.length}</span><button type="button" disabled={step===steps.length-1} onClick={()=>goTo(step+1)}>下一步 →</button></footer></article></section>

    <section className="v2-j-views v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">SYNCHRONIZED PAPER · RUNTIME · CODE</p><h2>{view==='paper'?'论文记号':view==='runtime'?'运行时对象':'可实现伪代码'}</h2></div><span className="v2-j-sync">当前步骤 {step} · 高亮代码行 {codeFocus}</span></div>
      {view==='paper'?<PaperView step={step} onHub={(id)=>openHub({cardId:id})} />:null}
      {view==='runtime'?<RuntimeView step={step} classes={classes} onClasses={setClasses} cacheMode={cacheMode} onCache={setCacheMode} onHub={(id)=>openHub({cardId:id})} />:null}
      {view==='code'?<CodeView selectedStep={step} onLine={handleCodeLine} />:null}
      <p className="v2-j-implementation-note">Runtime names and shapes below are implementation mappings. The equations and task sequence follow the paper description; the pseudocode is implementation-oriented and is not the original paper source code.</p>
    </section>

    <section className="v2-j-checklist v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">RUN CHECKLIST · MANUALLY REVIEWED</p><h2>逐阶段核对实现条件</h2></div><span className="v2-j-check-count">{completed} / {checklistCount} checked</span></div><p>清单只记录你当前手动勾选的检查状态；它不读取模型、不执行训练，也不代表课程学习门禁已通过。</p><div className="v2-j-check-grid">{checklistSections.map((section)=><fieldset key={section.title}><legend>{section.title}</legend>{section.items.map((item)=><label key={item}><input type="checkbox" checked={Boolean(checks[item])} onChange={()=>toggleCheck(item)} /><span>{item}</span></label>)}</fieldset>)}</div></section>

    <section className="v2-j-debugger v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">IMPLEMENTATION DEBUGGER</p><h2>遇到症状时，沿着数据与状态检查</h2></div></div><label className="v2-j-debug-select">选择症状<select value={debugIndex} onChange={(event)=>setDebugIndex(Number(event.target.value))}>{debugOptions.map((option,index)=><option value={index} key={option.title}>{option.title}</option>)}</select></label><div className="v2-j-debug-card"><strong>{debug.title}</strong><ol>{debug.checks.map((item)=><li key={item}>{item}</li>)}</ol><div>{debug.scenes.map((scene)=><button type="button" key={scene} onClick={()=>onNavigate(scene as 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I')}>检查 Scene {scene} →</button>)}</div></div></section>

    <section className="v2-j-parameter-map v2-state-card"><div className="v2-section-title-row"><div><p className="v2-eyebrow">PARAMETER / RUNTIME MAP · ALEXNET SHAPE EXAMPLE</p><h2>加载的参数与新建的参数对象</h2></div><span className="v2-source-badge is-toy">DERIVED FROM SHOWN SHAPES</span></div><div className="v2-j-param-controls"><label>新任务类别数 Cₙ<strong>{classes}</strong><input type="range" min="10" max="200" step="1" value={classes} onChange={(event)=>setClasses(Number(event.target.value))} /></label><div><span>feature width D</span><strong>4096 · illustrative AlexNet fc7</strong></div></div><div className="v2-j-param-table-wrap"><table><thead><tr><th>Parameter group</th><th>Illustrative named tensors</th><th>Tensor shape</th><th>Element count</th><th>Lifecycle</th></tr></thead><tbody><tr><th>θₛ · shared</th><td>fc6.weight · fc6.bias<br/>fc7.weight · fc7.bias</td><td>[4096,9216], [4096]<br/>[4096,4096], [4096]</td><td>37,752,832<br/>16,781,312</td><td>loaded; warm-up frozen; joint trainable</td></tr><tr><th>θₒ · old head</th><td>fc8_old.weight · fc8_old.bias</td><td>[1000,4096], [1000]</td><td>4,097,000</td><td>loaded from old model; warm-up frozen; joint trainable</td></tr><tr><th>θₙ · new head</th><td>fc8_new.weight · fc8_new.bias</td><td>[{classes},4096], [{classes}]</td><td>{newWeights.toLocaleString()} + {newBias.toLocaleString()} = {(newWeights+newBias).toLocaleString()}</td><td>new Parameter object; warm-up and joint trainable</td></tr></tbody></table></div><div className="v2-j-param-footnotes"><p>Classic AlexNet shape example only; counts are calculated from the shapes shown, not loaded from this workspace checkpoint or reported as a paper result. The shared row shows fc6/fc7 tensors only; convolutional features.* tensors are omitted. Actual module names, input resolution, classifier configuration and parameter counts depend on the chosen implementation.</p><p><b>Lifecycle distinction:</b> θₛ and θₒ values are loaded into the Student copy; θₙ is newly initialized. Copying values must not accidentally make Teacher and Student share the same Parameter objects or storage.</p></div><button type="button" className="v2-j-deep-link" onClick={()=>openHub({cardId:'symbol:theta_n'})}>在 Reference Hub 查看 θₙ canonical card →</button></section>

    <section className="v2-j-loop v2-state-card"><div><p className="v2-eyebrow">COMPLETE LOOP</p><h2>另一项任务到来时，从当前 Student 重新开始</h2><p>Modelₜ 被快照为下一 Teacherₜ；对新的 X 重新计算所有旧任务响应，新增任务 head，再 warm-up 并联合优化。每一轮的新输入、response cache、optimizer groups 与 evaluator 权限都重新核对。</p></div><div className="v2-j-loop-strip">{['Prepare','Partition','Add head','Record Yₒ','Warm-up','Joint optimize','Evaluate','Next Teacher'].map((label,index)=><React.Fragment key={label}><button type="button" className={step===Math.min(index,7)?'is-active':''} onClick={()=>goTo(Math.min(index,7))}>{label}</button>{index<7?<i aria-hidden="true">→</i>:null}</React.Fragment>)}</div><footer><span>00 提供背景；A–I 分别解释问题、机制、覆盖、序列与证据；J 把实现次序连成可检查的工作流。</span><b>所有正式学习验收仍由人工完成。</b></footer></section>
  </div>;
}

function PaperView({step,onHub}:{step:number;onHub:(id:string)=>void}){return <div className="v2-j-paper-view"><div className="v2-j-notation"><button type="button" onClick={()=>onHub('symbol:theta_s')}>θₛ</button><button type="button" onClick={()=>onHub('symbol:theta_o')}>θₒ</button><button type="button" onClick={()=>onHub('symbol:theta_n')}>θₙ</button><button type="button" onClick={()=>onHub('symbol:x_new')}>Xₙ</button><button type="button" onClick={()=>onHub('symbol:y_new')}>Yₙ</button><button type="button" onClick={()=>onHub('symbol:y_old')}>Yₒ</button><button type="button" onClick={()=>onHub('symbol:yhat_old')}>Ŷₒ</button><button type="button" onClick={()=>onHub('formula:l_old')}>L_old</button><button type="button" onClick={()=>onHub('formula:l_new')}>L_new</button><button type="button" onClick={()=>onHub('formula:total_loss')}>L_total</button><button type="button" onClick={()=>onHub('symbol:lambda_old')}>λₒ</button></div><div className="v2-j-paper-diagram"><div><span>Teacher · fixed old model</span><strong>Xₙ → old heads → Yₒ</strong></div><i>target</i><div><span>Student · shared backbone</span><strong>Xₙ → θₛ → h</strong><small>θₒ → Ŷₒ · θₙ → Ŷₙ</small></div><b>L = λₒ L_old + L_new + R</b></div><p>Step {step}: {steps[step].output}</p></div>;}

function RuntimeView({step,classes,onClasses,cacheMode,onCache,onHub}:{step:number;classes:number;onClasses:(n:number)=>void;cacheMode:'offline'|'online';onCache:(mode:'offline'|'online')=>void;onHub:(id:string)=>void}) {
  const warmup=step===4;const responseReady=step>=3;
  return <div className="v2-j-runtime-view"><div className="v2-j-runtime-controls"><div className="v2-j-cache-toggle" role="group" aria-label="选择旧响应生成模式"><button type="button" aria-pressed={cacheMode==='offline'} onClick={()=>onCache('offline')}>Offline cache</button><button type="button" aria-pressed={cacheMode==='online'} onClick={()=>onCache('online')}>On-the-fly</button></div><label>num_new_classes <strong>{classes}</strong><input type="range" min="10" max="200" value={classes} onChange={(event)=>onClasses(Number(event.target.value))}/></label></div><div className="v2-j-runtime-objects">{[
    {id:'teacher',type:'nn.Module · snapshot',shape:'old model',grad:'all parameters requires_grad=False',optimizer:'not in optimizer',state:'eval() · no_grad',token:'model:teacher'},
    {id:'student',type:'nn.Module · independent copy',shape:'shared backbone + old head + new head',grad:'warm-up / joint phase dependent',optimizer:'contains only intended Parameter groups',state:`current workflow step ${step}`,token:'model:student'},
    {id:'theta_s',type:'nn.Parameter collection',shape:'shared modules; checkpoint dependent',grad:warmup?'requires_grad=False · grad=None':'requires_grad=True · .grad after backward',optimizer:warmup?'excluded':'included in joint groups',state:'loaded values; copied storage',token:'symbol:theta_s'},
    {id:'theta_o',type:'nn.Parameter collection',shape:'old head · [C_old,D] + bias',grad:warmup?'requires_grad=False · grad=None':'requires_grad=True · .grad after backward',optimizer:warmup?'excluded':'included in joint groups',state:'loaded values; Student owns independent objects',token:'symbol:theta_o'},
    {id:'theta_n',type:'nn.Parameter',shape:`new head · [${classes},4096] + bias`,grad:'requires_grad=True',optimizer:'warm-up and joint groups',state:'newly initialized; not loaded with θ_s / θ_o',token:'symbol:theta_n'},
    {id:'old-target',type:'Tensor · fixed target',shape:'[B,C_old]',grad:'no gradient',optimizer:'not in optimizer',state:responseReady?`${cacheMode==='offline'?'stored by sample ID':'computed per batch'} · Yₒ ready`:'record at Step 3',token:'symbol:y_old'},
  ].map((item)=><article key={item.id}><header><code>{item.id==='theta_s'?'θₛ':item.id==='theta_o'?'θₒ':item.id==='theta_n'?'θₙ':item.token}</code><span>{item.type}</span></header><dl><div><dt>Shape / module</dt><dd>{item.shape}</dd></div><div><dt>requires_grad / .grad</dt><dd>{item.grad}</dd></div><div><dt>Optimizer membership</dt><dd>{item.optimizer}</dd></div><div><dt>Current state</dt><dd>{item.state}</dd></div></dl><button type="button" onClick={()=>onHub(item.token.startsWith('model:')?'method:lwf':item.token)}>{item.token.startsWith('model:')?'View LwF method card →':'Inspect canonical object →'}</button></article>)}</div><p>Runtime card 是常见框架映射说明，不代表页面加载了真实神经网络 checkpoint。Teacher / Student parameter identity、训练阶段、requires_grad、.grad 和 optimizer membership 必须分别检查。</p></div>;
}

function CodeView({selectedStep,onLine}:{selectedStep:number;onLine:(step:number)=>void}){return <div className="v2-j-code-view"><div className="v2-j-code-heading"><span>Implementation-oriented pseudocode</span><b>not the original paper source code</b></div><pre aria-label="Implementation-oriented LwF pseudocode">{codeLines.map((line,index)=><button type="button" key={line.text} className={line.step===selectedStep?'is-highlighted':''} onClick={()=>onLine(line.step)}><small>{String(index+1).padStart(2,'0')}</small><code>{line.text}</code></button>)}</pre><div className="v2-j-code-bridge"><strong>Selected line → Step {selectedStep}</strong><span>{steps[selectedStep].title.replace(/^\d · /,'')}</span><button type="button" onClick={()=>onLine(selectedStep)}>同步步骤说明 ↑</button><span>Relevant variables, optimizer semantics and deep links are listed in Runtime View / Reference Hub.</span></div></div>;}

function cardShort(id:string){const names:Record<string,string>={'symbol:theta_s':'θₛ','symbol:theta_o':'θₒ','symbol:theta_n':'θₙ','symbol:x_new':'Xₙ','symbol:y_old':'Yₒ','symbol:y_new':'Yₙ','symbol:yhat_old':'Ŷₒ','symbol:lambda_old':'λₒ','formula:l_old':'L_old','formula:l_new':'L_new','formula:total_loss':'combined objective','formula:shared_gradient':'shared gradient','phase:warmup':'Warm-up','evidence:table_1':'Table 1','evidence:figure_4':'Figure 4','formula:response_preservation':'response preservation'};return names[id]||id;}
