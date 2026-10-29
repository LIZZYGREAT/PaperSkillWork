import { Fragment, useId, useState, type ReactNode } from "react";
import { Equation, KLDefinition, KLDecomposition, SquaredDefinition, ShiftIdentity } from "./MathNotation";
import { binaryKL, coordinateStep, squaredCoordinate, retentionProbability } from "./formula-model";
import { useSceneTimeline } from "./review/SceneTransport";
import "./formula-lessons.css";

const sweepClips=[{id:"观察函数变化",durationMs:10000,holdMs:0}];
const stepClips=[{id:"沿负梯度走一步",durationMs:3500,holdMs:0}];
const f=(n:number)=>Math.abs(n)<.00005?"0.000":n.toFixed(3);
const typesetSubscripts:Record<string,[string,string]>={
 Lcurrent:["L","current"],Ldark:["L","dark"],"Lreplay-CE":["L","replay-CE"],
 gcurrent:["g","current"],gdark:["g","dark"],"greplay-CE":["g","replay-CE"],
 "hθ":["h","θ"],E_A:["𝔼","A"],W_final:["W","final"],
 z_new:["z","new"],v_current:["v","current"],u_query:["u","query"],
 A_d:["A","d"],x_d:["x","d"],z_d:["z","d"]
};
const notationTokens=/(Lreplay-CE|greplay-CE|Lcurrent|Ldark|gcurrent|gdark|hθ|E_A|W_final|z_new|v_current|u_query|A_d|x_d|z_d)/g;
export function Algebra({children,label}:{children:string;label?:string}){
 // Typeset recurring names only; all mathematical content remains explicit in each lesson.
 return <Equation label={label??children}><mrow>{children.split(notationTokens).map((part,i)=>{
  const sub=typesetSubscripts[part];return <Fragment key={i}>{sub?<msub><mi>{sub[0]}</mi><mtext>{sub[1]}</mtext></msub>:<mtext>{part}</mtext>}</Fragment>;
 })}</mrow></Equation>;
}
export function ReadingUnit({id,children}:{id:string;children:ReactNode}){
 return <section className="formula-lesson" data-reading-unit={id} aria-labelledby={id+"-heading"}>{children}</section>;
}
export function FormulaSpot({formula,variables}:{formula:ReactNode;variables:ReactNode}){
 return <div className="formula-spot"><p className="eyebrow">本节关系</p>{formula}<p>{variables}</p></div>;
}
export function LessonReading({id,title,intro,children}:{id:string;title:string;intro?:ReactNode;children:ReactNode}){
 return <div className="lesson-reading"><header><p className="eyebrow">机制解释</p><h3 id={id+"-heading"}>{title}</h3>{intro&&<p>{intro}</p>}</header>{children}</div>;
}
export function NextCue({children}:{children:ReactNode}){
 return <div className="lesson-next">{children}</div>;
}
function FunctionPlot({kind,x,reverse=false}:{kind:"kl"|"square"|"retention";x:number;reverse?:boolean}){
 const uid=useId().replace(/:/g,""),xmin=kind==="square"?-2:kind==="kl"?.02:2,xmax=kind==="square"?2:kind==="kl"?.98:20;
 const ymax=kind==="square"?4.5:kind==="kl"?3:1.1;
 const X=(v:number)=>56+(v-xmin)/(xmax-xmin)*408,Y=(v:number)=>258-v/ymax*206;
 const value=(v:number)=>kind==="kl"?binaryKL(.8,v).kl:kind==="square"?squaredCoordinate(v).loss:retentionProbability(2,Math.round(v));
 const slope=kind==="kl"?binaryKL(.8,x).slope:kind==="square"?squaredCoordinate(x).slope:0;
 const sample=Array.from({length:kind==="retention"?19:161},(_,i)=>xmin+(xmax-xmin)*i/(kind==="retention"?18:160));
 const path=(fn:(v:number)=>number)=>sample.map((v,i)=>(i?"L":"M")+X(v)+","+Y(fn(v))).join(" ");
 const ticks=kind==="square"?[-2,-1,0,1,2]:kind==="kl"?[.2,.4,.6,.8]:[2,5,10,15,20];
 const yticks=kind==="square"?[0,1,2,3,4]:kind==="kl"?[0,1,2,3]:[0,.5,1];
 const minimum=kind==="kl"?.8:kind==="square"?0:undefined;
 return <svg className="formula-plot-svg" viewBox="0 0 500 310" role="img" aria-label={kind==="kl"?"固定旧概率的二类 KL 函数曲线与当前位置切线":kind==="square"?"单坐标平方误差抛物线与当前位置切线":"容量为 2 时，各流项等概率留存的离散点"}>
  <defs><clipPath id={uid}><rect x="55" y="46" width="411" height="213"/></clipPath></defs>
  <text x="56" y="24">{kind==="kl"?"散度 D（自然对数）":kind==="square"?"平方损失 ℓ":"留存概率"}</text>
  {yticks.map(v=><g key={v}><line x1="56" x2="464" y1={Y(v)} y2={Y(v)} className="plot-grid"/><text x="43" y={Y(v)+5} textAnchor="end">{v}</text></g>)}
  <path d="M56 48V258H464" fill="none" className="plot-axis"/>
  {ticks.map(v=><g key={v}><line x1={X(v)} x2={X(v)} y1="258" y2="263" className="plot-axis"/><text x={X(v)} y="283" textAnchor="middle">{v}</text></g>)}
  <text x="464" y="305" textAnchor="end">{kind==="kl"?"当前 Claude 概率 q":kind==="square"?"差值 δ = aₖ − zₖ":"处理后流项数 n"}</text>
  <g clipPath={`url(#${uid})`}>
   {kind!=="retention"&&<path d={path(value)} className="plot-curve"/>}
   {kind==="retention"&&sample.map(v=><circle key={v} cx={X(v)} cy={Y(value(v))} r="3" className="plot-point"/>)}
   {kind==="kl"&&reverse&&<path d={path(v=>binaryKL(.8,v).reverse)} className="plot-reverse"/>}
   {minimum!==undefined&&<line x1={X(minimum)} x2={X(minimum)} y1="49" y2="258" className="plot-guide"/>}
   <line x1={X(x)} x2={X(x)} y1={Y(value(x))} y2="258" className="plot-guide"/>
   {kind!=="retention"&&<line x1={X(x)-45} x2={X(x)+45} y1={Y(value(x)-slope*(xmax-xmin)*45/408)} y2={Y(value(x)+slope*(xmax-xmin)*45/408)} className="plot-tangent"/>}
  </g>
  <circle cx={X(x)} cy={Y(value(x))} r="6" className="plot-point" data-plot-x={x} data-plot-y={value(x)} data-plot-slope={slope}/>
 </svg>;
}
export function KLFormulaLesson(){
 const [manual,setManual]=useState<number|null>(.6),[reverse,setReverse]=useState(true),sweep=useSceneTimeline(sweepClips);
 const q=manual??(.02+.96*sweep.state.progress),r=binaryKL(.8,q);
 return <ReadingUnit id="kl-math">
  <FormulaSpot formula={<KLDefinition identified={false}/>} variables={<>p 是固定的旧概率，q 是当前概率；k 对齐同一类别，C 为类别数。两组概率各自和为 1；这里 log=ln，使用自然对数。</>}/>
  <LessonReading id="kl-math" title="KL 散度：有方向的概率偏离" intro={<>把旧分布当作参照，衡量当前分布如何偏离它。先理解函数的形状与梯度，再看每个类别的贡献怎样组成总和。</>}>
  <div className="lesson-columns"><div><span className="lesson-step">01 / 从公式读含义</span><h4>先比较比例，再按旧概率加权。</h4><p>pₖ/qₖ 表示当前概率相对旧参照的变化。qₖ&lt;pₖ 时该类贡献为正；qₖ&gt;pₖ 时贡献为负。<strong>非负的是完整求和，不是每个类别。</strong></p><p>固定 p=(0.8,0.2)，只移动 Claude 的 q；GPT 的概率随之为 1−q。曲线上的一点表示一整组分布，而非单个类别的贡献。</p><Algebra>{"D(q) = 0.8 ln(0.8/q)"}</Algebra><Algebra>{"+ 0.2 ln[0.2/(1−q)]"}</Algebra><p>q=0.8 时两分布一致，散度为零。若 pₖ&gt;0 而 qₖ 趋近 0，该类的对数惩罚会趋于无穷；曲线只绘制 q∈[0.02,0.98]。</p></div>
   <div className="lesson-plot" data-math-explorer="kl" data-math-status={sweep.state.status}><div className="plot-key"><span>D(p∥q)</span>{reverse&&<span className="key-reverse">D(q∥p)</span>}<span className="key-tangent">切线</span></div><FunctionPlot kind="kl" x={q} reverse={reverse}/><div className="plot-controls"><label htmlFor="kl-probability">改变当前概率 q <strong>{f(q)}</strong></label><input id="kl-probability" type="range" min=".02" max=".98" step=".01" value={q} onChange={e=>{sweep.reset();setManual(+e.target.value)}}/><div className="plot-buttons"><button data-math-sweep disabled={sweep.reducedMotion} onClick={()=>{setManual(null);sweep.replay()}}>播放曲线扫描</button><button disabled={manual!==null||sweep.state.status!=="playing"} onClick={sweep.toggle}>暂停</button><button aria-pressed={reverse} onClick={()=>setReverse(!reverse)}>{reverse?"隐藏":"显示"}反向散度</button><button onClick={()=>{sweep.reset();setManual(.8)}}>回到 p=q</button></div></div><div className="plot-values"><span>D(p∥q) <strong data-math-value="forward">{f(r.kl)}</strong></span><span>D(q∥p) <strong data-math-value="reverse">{f(r.reverse)}</strong></span><span>斜率 <strong data-math-value="slope">{f(r.slope)}</strong></span></div><p className="plot-caption">扫描只观察函数形状，不是训练过程。拖动滑块会停止扫描；下方机制动画独立控制。减少动态时可直接拖动或用方向键取值。</p></div>
  </div>
  <div className="lesson-columns lesson-derivation"><div><span className="lesson-step">02 / 为什么叫散度</span><h4>整体非负，交换方向通常不同。</h4><Algebra>{"−ln u ≥ 1−u  (u>0)"}</Algebra><Algebra>{"D(p∥q) ≥ Σₖ(pₖ−qₖ) = 0"}</Algebra><p>令 u=qₖ/pₖ，乘 pₖ 后求和就得到下界。正概率下，只有每个 qₖ=pₖ 时等号成立。反向散度换了权重与对数比，通常给出不同结果。</p><p>KL 不满足普通距离所需的对称性，也不一般满足三角不等式；不要把它当成两点间的几何长度。本例限定正概率，边界需按支持集和极限单独处理。</p></div><div><span className="lesson-step">03 / 与交叉熵的联系</span><h4>固定旧分布，只需改变交叉熵。</h4><KLDecomposition identified={false}/><p>H(p,q)=−Σpₖ ln qₖ，H(p)=−Σpₖ ln pₖ。旧 p 冻结，后者就是常量，最小化 KL 与最小化软目标交叉熵有相同的梯度。</p><p>图中当前点：交叉熵 {f(r.crossEntropy)} − 旧熵 {f(r.entropy)} = KL {f(r.kl)}。这里是概率约束的数学背景，DER 后面采用的是原始 logits 平方匹配。</p></div></div>
  <div className="lesson-derivation"><span className="lesson-step">04 / 梯度究竟对谁求</span><h4>沿概率曲线的斜率，与网络输出梯度要分清。</h4><div className="lesson-columns"><div><Algebra>{"dD/dq = (q−0.8)/[q(1−q)]"}</Algebra><p>这是左图二类曲线的导数：改变 q 同时改变 1−q。q&lt;0.8 时斜率为负，增大 q 会降损失；q&gt;0.8 时斜率为正，减小 q 会降损失。q=0.8 的切线水平。</p><p>若把每个 qₖ 暂视作互不约束的坐标，则偏导是 −pₖ/qₖ。它没有包含“概率和为 1”的联动，不能直接当成上面这条曲线的斜率。</p></div><div><Algebra>{"qₖ = exp(aₖ) / Σⱼexp(aⱼ)"}</Algebra><Algebra>{"∂ ln qₖ/∂aⱼ = 𝟙[k=j] − qⱼ"}</Algebra><Algebra>{"∂D/∂aⱼ = −pⱼ + qⱼΣₖpₖ"}</Algebra><Algebra>{"= qⱼ − pⱼ"}</Algebra><p>a 是当前 logits。把 log softmax 的导数代入 −Σpₖ ln qₖ，再用 Σpₖ=1，得到 q−p。继续通过当前网络链式求导到 θ；旧 p 保持常量。</p></div></div></div>
  </LessonReading>
  <NextCue>接着看动画：对齐同一类别，把概率取值一步步算成 KL。</NextCue>
 </ReadingUnit>;
}
export function LogitFormulaLesson(){
 const [source,setSource]=useState(-1),step=useSceneTimeline(stepClips),delta=source*(1-.4*step.state.progress),r=squaredCoordinate(delta);
 return <ReadingUnit id="logit-math">
  <FormulaSpot formula={<SquaredDefinition identified={false}/>} variables={<>z 是保存时冻结的整组 logits；a=hθ(A(x)) 是当前网络的新输出。aₖ 与 zₖ 必须来自同一类别；C 为类别数。此处使用平方和，没有除以 C 或乘 ½。</>}/>
  <LessonReading id="logit-math" title="Logit Matching：把每一类的分数拉回历史参照" intro={<>先相减、再平方、最后求和，保留整组分数的数值信息。这里匹配的是 logits，不是 softmax 后的概率，也不是硬标签。</>}>
  <div className="lesson-columns"><div><span className="lesson-step">01 / 平方的意义</span><h4>正负偏差都留下代价，大偏差更重。</h4><p>写 δₖ=aₖ−zₖ。直接把差值求和会让 −1 与 +1 抵消；平方后它们各贡献 1。各项非负，只有整组 a=z 才能使损失为零。</p><Algebra>{"ℓ(δₖ) = δₖ²"}</Algebra><Algebra>{"dℓ/dδₖ = 2δₖ"}</Algebra><p>曲线在零点最平，离零越远，斜率绝对值越大。差值扩大一倍，损失扩大四倍，梯度扩大两倍。</p><p>原三类例 z=(2,1,0)、a=(1,2,0)：差值为 (−1,+1,0)，平方贡献为 (1,1,0)，总损失为 2。</p></div>
  <div className="lesson-plot" data-math-explorer="square" data-math-status={step.state.status}><div className="plot-key"><span>ℓ=δ²</span><span className="key-tangent">切线</span></div><FunctionPlot kind="square" x={delta}/><div className="plot-controls"><label htmlFor="logit-delta">选择起始差值 δ <strong>{f(source)}</strong></label><input id="logit-delta" type="range" min="-2" max="2" step=".05" value={source} onChange={e=>{step.reset();setSource(+e.target.value)}}/><div className="plot-buttons"><button data-math-step disabled={step.reducedMotion} onClick={step.replay}>沿负梯度走一步</button><button disabled={step.state.status!=="playing"} onClick={step.toggle}>暂停</button><button onClick={step.reset}>恢复起始差值</button></div></div><div className="plot-values"><span>当前 δ <strong data-math-value="delta">{f(delta)}</strong></span><span>ℓ <strong data-math-value="loss">{f(r.loss)}</strong></span><span>梯度 <strong data-math-value="slope">{f(r.slope)}</strong></span></div><p className="plot-caption">单坐标、固定 z、η=0.2：δ⁺=δ−0.2·2δ=0.6δ。所选起点 {f(source)} → {f(coordinateStep(source))}。动画连续展示这次离散更新的起终点与方向，不代表连续时间梯度流或真实网络参数轨迹；减少动态时直接显示完整结果。</p></div></div>
  <div className="lesson-columns lesson-derivation"><div><span className="lesson-step">02 / 从输出传回参数</span><h4>当前输出接收梯度，历史目标保持冻结。</h4><Algebra>{"∂Ldark/∂aₖ = 2(aₖ−zₖ)"}</Algebra><Algebra>{"∇θLdark = 2Σₖ(aₖ−zₖ)∇θaₖ"}</Algebra><p>aₖ 高于旧 zₖ 时梯度为正，沿负梯度会降低这个标量；低于时相反。参数梯度还乘当前网络的导数，各类别与样本共享参数，因此不能把真实网络更新等同于每个分数独立移动。</p><p>z 虽由过去某个网络产生，保存后只是常数副本。反向传播不穿过这个副本去更新过去的网络，也不需要一份常驻教师。</p></div><div><span className="lesson-step">03 / 与概率约束有何不同</span><h4>所有分数一起平移，概率看不出基准变化。</h4><Algebra>{"a = z + c·1  ⇒  Ldark = Cc²"}</Algebra><Algebra>{"softmax(z+c·1) = softmax(z)"}</Algebra><p>每个指数都乘 eᶜ，归一化的分子与分母相消。所以概率 KL 为 0，而平方匹配仍为 Cc²；三类都 +1 时为 3。这说明两个目标保留的信息不同，不表示其中一个对所有任务更优。</p></div></div>
  <div className="lesson-derivation"><h4>把平移不变性直接展开。</h4><ShiftIdentity/><p className="lesson-note">本节曲线、梯度和共同平移是数学教学推导；后面的动画仍使用原三类合成对照。论文方法依据 §3、Eq. (5)；不是论文实验曲线。</p></div>
  </LessonReading>
  <NextCue>接着看动画：三个类别逐项相减、展开成平方面积，再汇成总损失。</NextCue>
 </ReadingUnit>;
}
export function ReservoirFormulaLesson(){
 const [n,setN]=useState(4);
 return <ReadingUnit id="reservoir-math">
  <FormulaSpot formula={<Algebra>{"P(vᵢ∈Mₙ) = min(1, K/n)"}</Algebra>} variables={<>K 是固定容量，n 是处理后的流项总数，vᵢ 是任意已到达流项。N 是插入本次候选前的数量，所以本次处理后 n=N+1；槽位从 0 编号。</>}/>
  <LessonReading id="reservoir-math" title="为什么越晚到，仍能和旧流项同样公平？">
 <div className="lesson-columns"><div><span className="lesson-step">01 / 在线规则</span><h4>有空槽直接追加，满池才抽签。</h4><Algebra>{"j ∼ Uniform{0,…,N}"}</Algebra><p>N&lt;K 时直接追加；N≥K 时有 N+1 个等可能整数，仅 j&lt;K 时替换 slot j，否则拒收。无论是否留下，处理完都令 N←N+1。</p><p>新候选入池概率是 K/(N+1)。已有记录各占一个槽，只有抽中它的槽才会被替换，因而本次存活概率是 1−1/(N+1)。</p><span className="lesson-step">02 / 归纳到任意流项</span><Algebra>{"(K/N)·[1−1/(N+1)] = K/(N+1)"}</Algebra><p>假设旧项在上轮留下的概率为 K/N，再乘本轮存活概率，恰好与新项的入池概率相同。基例是前 K 项全都留下。这是对随机抽签的概率结论，不是某次抽签的确定结果。</p><p>公平针对流项身份，不按类别分配配额；不保证每类均衡或某条记录永远留下。规则出处：Algorithm 3；此处为数学解释。</p></div><div className="lesson-plot" data-math-explorer="retention"><FunctionPlot kind="retention" x={n}/><div className="plot-controls"><label htmlFor="retention-count">容量 K=2，处理项数 n <strong>{n}</strong></label><input id="retention-count" type="range" min="2" max="20" step="1" value={n} onChange={e=>setN(+e.target.value)}/></div><div className="plot-values"><span>任一已到达流项的留存概率 <strong data-math-value="retention">{f(retentionProbability(2,n))}</strong></span></div><p className="plot-caption">横轴是整数时刻；点表示抽签分布下的概率，不是这次动画中记忆的占用率。记忆满后始终有两条记录，但每一项留下的机会随流增长而下降。</p></div></div>
  </LessonReading>
  <NextCue>接着看动画：从空池到替换、拒收，逐次执行同一个抽签规则。</NextCue>
 </ReadingUnit>;
}
