import React, { useMemo, useState } from 'react';
import { useReferenceHub } from '../components/ReferencePrimitives';
import {
  directionDrift,
  equalRadiusChange,
  functionResponseDrift,
  linearReparameterization,
  oldFunctionParameters,
  parameterDistance,
  parameterPreservationLoss,
  probeInputs,
  probeVanisher,
  responseVector,
  studentFunction,
  teacherFunction,
} from '../simulation/functionPreservation';

const probeLabels = ['x₁', 'x₂', 'x₃', 'x₄'];
const plotInputs = Array.from({ length: 65 }, (_, index) => -2 + index / 16);

export function SceneF() {
  const { openHub } = useReferenceHub();
  const [target, setTarget] = useState<'parameters' | 'responses'>('responses');
  const [changeOne, setChangeOne] = useState(.08);
  const [changeTwo, setChangeTwo] = useState(-.04);
  const [unobservedChange, setUnobservedChange] = useState(.45);
  const [radius, setRadius] = useState(.35);
  const [angle, setAngle] = useState(42);
  const [factorA, setFactorA] = useState(1.8);
  const [penaltyScale, setPenaltyScale] = useState(1);
  const change = [changeOne, changeTwo, unobservedChange];
  const currentParameters = [oldFunctionParameters[0] + changeOne, oldFunctionParameters[1] + changeTwo, unobservedChange];
  const responseDrift = functionResponseDrift(change);
  const distance = parameterDistance(change);
  const responseLoss = probeInputs.reduce((sum, x) => sum + (studentFunction(x, change) - teacherFunction(x)) ** 2, 0) / probeInputs.length;
  const parameterLoss = parameterPreservationLoss(change, penaltyScale);
  const weightDecay = .5 * penaltyScale * currentParameters.reduce((sum, value) => sum + value * value, 0);
  const alternativeAngle = (angle + 90) % 360;
  const driftA = directionDrift(radius, angle * Math.PI / 180);
  const driftB = directionDrift(radius, alternativeAngle * Math.PI / 180);
  const reparameterized = linearReparameterization(factorA, 2);
  const sameFunctionValue = factorA * (1 / factorA) * 2;
  const curve = useMemo(() => plotInputs.map((x) => ({ x, old: teacherFunction(x), current: studentFunction(x, change) })), [changeOne, changeTwo, unobservedChange]);

  return (
    <div className="v2-scene-content v2-scene-f">
      <section className="v2-f-intro v2-state-card">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">PARAMETER SPACE → FUNCTION SPACE · PAPER + TEACHING TOY</p><h2>为什么不直接把参数锁在旧值附近？</h2></div><button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'C11' })}>论文讨论 C11 ↗</button></div>
        <div className="v2-f-contrasts"><div><span>Parameter preservation</span><strong>L<sub>param</sub> = ½λ‖θ − θ₀‖²</strong><small>看参数数值变化</small></div><i aria-hidden="true">↔</i><div><span>Response preservation</span><strong>D(f<sub>old</sub>(X<sub>n</sub>), f<sub>student</sub>(X<sub>n</sub>))</strong><small>看观察输入上的行为变化</small></div></div>
        <p>先用两个反例拆开“参数距离”和“函数距离”。页面数值来自 Teaching Toy；它们说明两种距离不能互相代替，不是论文网络的测量值。</p>
      </section>

      <section className="v2-f-space-map" aria-label="参数空间到函数空间的映射">
        <div><p className="v2-eyebrow">PARAMETER SPACE</p><strong>θ = (θ₁, θ₂, …)</strong><span>欧氏距离度量坐标变化</span></div><i aria-hidden="true">⟶</i><div><p className="v2-eyebrow">FUNCTION / RESPONSE SPACE</p><strong>x → f<sub>θ</sub>(x)</strong><span>行为差异依赖输入和局部敏感性</span></div>
      </section>

      <section className="v2-f-counterexamples">
        <article className="v2-f-card">
          <p className="v2-eyebrow">TEACHING TOY A · LARGE PARAMETER CHANGE, SAME FUNCTION</p><h2>同一条函数，可以由不同参数表示</h2>
          <div className="v2-f-factor-controls"><label>a <strong>{factorA.toFixed(2)}</strong><input aria-label="等价重参数化的 a" type="range" min="0.2" max="3" step="0.01" value={factorA} onChange={(event) => setFactorA(Number(event.target.value))} /></label><span>f(x) = a · b · x</span><strong>b = {reparameterized.b.toFixed(3)}</strong></div>
          <div className="v2-f-metric-pair"><Metric label="parameter distance from (1,1)" value={fmt(reparameterized.parameterDistance)} /><Metric label="function difference at x = 2" value={fmt(Math.abs(sameFunctionValue - 2))} /></div>
          <p>a × b = 1，所以 f(x)=x 保持不变；参数确实离开旧位置。这个自由度说明 parameter penalty 可能阻止不会改变该 toy 函数的参数变换。</p>
        </article>
        <article className="v2-f-card">
          <p className="v2-eyebrow">TEACHING TOY B · SMALL PARAMETER CHANGE, LARGE OUTPUT CHANGE</p><h2>很小的参数变化，也可能被输入放大</h2>
          <div className="v2-f-small-change"><div><span>θ</span><strong>1.000 → 1.001</strong></div><i aria-hidden="true">→</i><div><span>x</span><strong>1000</strong></div><i aria-hidden="true">→</i><div><span>|Δf| for fθ(x)=θx</span><strong>1.000</strong></div></div>
          <p>在这个一维 Teaching Toy 中，|Δθ|=0.001，而 |x·Δθ|=1。输出变化不仅取决于参数距离，还取决于输入与局部敏感性。</p>
        </article>
      </section>

      <section className="v2-f-jacobian-card">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">LOCAL JACOBIAN · MECHANISM / TEACHING INTERPRETATION</p><h2>同样大小的参数变化，方向不同，输出变化不同</h2></div><span className="v2-source-badge is-toy">COMPUTED TOY</span></div>
        <div className="v2-f-direction-controls"><label>固定 ‖Δθ‖ = r<strong>{radius.toFixed(2)}</strong><input aria-label="方向对照固定参数距离" type="range" min="0.1" max="0.7" step="0.01" value={radius} onChange={(event) => setRadius(Number(event.target.value))} /></label><label>方向 φ<strong>{angle}°</strong><input aria-label="参数变化方向角 phi" type="range" min="0" max="359" step="1" value={angle} onChange={(event) => setAngle(Number(event.target.value))} /></label></div>
        <DirectionMap radius={radius} angle={angle} />
        <div className="v2-f-direction-results"><Metric label={`‖ΔθA‖ at φ=${angle}°`} value={fmt(radius)} /><Metric label={`response drift A on two probes`} value={fmt(driftA)} /><Metric label={`‖ΔθB‖ at φ=${alternativeAngle}°`} value={fmt(radius)} /><Metric label="response drift B on same probes" value={fmt(driftB)} /></div>
        <p>局部线性化：Δf(x) ≈ J<sub>θ</sub>(x)Δθ。相同的 ‖Δθ‖ 沿不同方向经过 Jacobian 后会有不同的响应漂移。这个方向扫描是 Teaching / Mechanism Interpretation，不是论文测得的指标。</p>
      </section>

      <section className="v2-f-same-distance-card">
        <div><p className="v2-eyebrow">SAME PARAMETER DISTANCE · DIFFERENT FUNCTION DRIFT</p><h2>固定半径沿圆周移动</h2><p>左边参数空间的半径不变；右边是两个响应探针上的输出变化，它受方向影响，形成椭圆形轨迹。</p></div>
        <DirectionMap radius={radius} angle={angle} compact />
      </section>

      <section className="v2-f-response-panel">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">CONSTRAINT TARGET SWITCHER · Xₙ PROBES</p><h2>约束参数值，还是约束观测到的旧任务响应？</h2></div><span className="v2-source-badge is-toy">1D FUNCTION TOY</span></div>
        <div className="v2-f-probe-controls"><label>Δθ₁<strong>{changeOne.toFixed(2)}</strong><input aria-label="Student 参数变化 theta one" type="range" min="-.25" max=".25" step=".01" value={changeOne} onChange={(event) => setChangeOne(Number(event.target.value))} /></label><label>Δθ₂<strong>{changeTwo.toFixed(2)}</strong><input aria-label="Student 参数变化 theta two" type="range" min="-.25" max=".25" step=".01" value={changeTwo} onChange={(event) => setChangeTwo(Number(event.target.value))} /></label><label>Δθ₃ · probe-null direction<strong>{unobservedChange.toFixed(2)}</strong><input aria-label="Student 未观测输入变化 theta three" type="range" min="0" max="1" step=".01" value={unobservedChange} onChange={(event) => setUnobservedChange(Number(event.target.value))} /></label></div>
        <div className="v2-f-switcher" role="group" aria-label="选择约束目标"><button type="button" aria-pressed={target === 'parameters'} onClick={() => setTarget('parameters')}>Parameter Values</button><button type="button" aria-pressed={target === 'responses'} onClick={() => setTarget('responses')}>Model Responses</button></div>
        {target === 'parameters' ? <div className="v2-f-target-detail"><div className="v2-f-parameter-flow"><span>θ₀ old = ({oldFunctionParameters[0]}, {oldFunctionParameters[1]}, 0)</span><i>→ Euclidean distance →</i><span>θ current = ({fmt(currentParameters[0])}, {fmt(currentParameters[1])}, {fmt(currentParameters[2])})</span></div><div className="v2-f-metric-pair"><Metric label="‖θ − θ₀‖₂" value={fmt(distance)} /><Metric label="L_param = ½λ‖θ−θ₀‖²" value={fmt(parameterLoss)} /><Metric label="ordinary weight decay ½λ‖θ‖²" value={fmt(weightDecay)} /></div><p>Parameter Values 直接约束数值，不会检查这些数值在指定输入上造成多少输出变化。</p></div> : <div className="v2-f-target-detail"><div className="v2-f-response-flow"><span>Xₙ probes</span><i>→</i><span>Teacher f_old</span><i>compare</i><span>Student f_student</span><i>→</i><span>D on Xₙ</span></div><ProbeTable change={change} /><div className="v2-f-response-stat"><Metric label="mean squared response loss on Xₙ" value={fmt(responseLoss)} /><Metric label="RMS response drift on Xₙ" value={fmt(responseDrift)} /><Metric label="parameter distance ‖θ−θ₀‖" value={fmt(distance)} /></div><p>LwF 直接约束当前新任务训练输入上的旧任务响应；这些计算点是 Xₙ，不是旧任务训练图像。</p></div>}
      </section>

      <section className="v2-f-function-map-card">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">FUNCTION PROBE MAP · LOCAL RESPONSE PRESERVATION</p><h2>探针上相同，不推出所有输入上相同</h2></div><button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'C02' })}>Xₙ 路径 C02 ↗</button></div>
        <FunctionProbeMap curve={curve} change={change} />
        <div className="v2-f-scope-note"><strong>Response preservation is local to observed inputs.</strong><span>Δθ₃ 沿 probe-null 方向：在四个 Xₙ 探针上贡献精确为 0，但在探针之间仍可改变 Student 函数。它是演示采样覆盖边界的 Teaching Toy，不代表 LwF 会在任意未观测点维持函数。</span></div>
        <div className="v2-f-support-strip"><span className="is-observed">● Xₙ · 训练中可观测 / 产生响应约束</span><span className="is-outside">○ Xₒ · 旧域参考输入 / 不由当前约束覆盖</span></div>
      </section>

      <section className="v2-f-penalty-card">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">PARAMETER L₂ BASELINE · PAPER FORM</p><h2>Parameter preservation、response preservation 与 weight decay 是三件事</h2></div><button type="button" className="v2-intro-evidence" onClick={() => setPenaltyScale((value) => Math.min(4, Math.round((value + .25) * 100) / 100))}>λ 加 0.25</button></div>
        <label className="v2-f-penalty-slider">baseline coefficient λ<strong>{penaltyScale.toFixed(2)}</strong><input aria-label="parameter baseline coefficient lambda" type="range" min="0" max="4" step=".05" value={penaltyScale} onChange={(event) => setPenaltyScale(Number(event.target.value))} /></label>
        <div className="v2-f-penalty-grid"><div><span>Parameter preservation baseline</span><strong>L_new + ½λ‖w − w₀‖²</strong><small>w₀ 是旧共享参数快照，惩罚 Student 相对旧参数的偏移。</small><b>toy penalty: {fmt(parameterLoss)}</b></div><div><span>Ordinary weight decay</span><strong>½λ‖w‖²</strong><small>将参数推向零，控制参数规模；并不要求接近旧参数。</small><b>toy penalty: {fmt(weightDecay)}</b></div><div><span>LwF response preservation</span><strong>D(f_old(Xₙ), f_student(Xₙ))</strong><small>直接比较新任务训练输入上的旧任务输出；不直接看参数距离。</small><b>toy response loss: {fmt(responseLoss)}</b></div></div>
        <p>论文比较的是对共享参数展开向量 w 与原值 w₀ 的软约束 baseline，并在所测实验中报告 output regularization 表现更好；这是有限任务设置下的实验结果，不是对所有模型的必然定理。</p>
      </section>

      <details className="v2-f-neural-note"><summary>General Neural-Network Interpretation</summary><div><p>不同参数集合有时会实现相似函数：例如神经元置换对称性、层间缩放补偿、网络冗余或连续的等价参数化。这里是一般神经网络解释，不是该论文给出的完整理论证明。</p><p>因此 parameter space 距离本身不能充当 model-behavior 距离。</p></div></details>

      <section className="v2-f-paper-evidence">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">PAPER EVIDENCE · FIGURE 7 / C11</p><h2>在论文测试的设置中，响应约束优于 parameter-L2 baseline</h2></div><button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'C11' })}>打开审计 C11 ↗</button></div>
        <div className="v2-f-paper-pair"><div><strong>Mechanism Toy</strong><span>参数距离和响应漂移是不同计算量；只在 Xₙ 探针上比较输出。</span></div><i>↓</i><div><strong>Paper Evidence</strong><span>Figure 7 对比 response regularization 与参数 L₂ baseline。作者解释为多个小参数变化仍可能造成大的输出变化。</span></div></div>
        <p>结论限定在论文所测试的任务对与训练协议。原图与任务坐标可从 <a href="https://arxiv.org/pdf/1606.09282#page=10" target="_blank" rel="noreferrer">原论文 Figure 7 ↗</a> 查看；页面不从图像像素估读数值。</p>
      </section>

      <div className="v2-f-conclusion-strip"><strong>small parameter change ⇏ small function change</strong><strong>large parameter change ⇏ large function change</strong><strong>preservation on Xₙ ⇏ global function preservation</strong></div>
      <footer className="v2-f-footer"><span>Scene E asks which gradient moves θ_s · Scene G asks which inputs the response constraints cover</span><button type="button" onClick={() => openHub({ evidenceId: 'C07' })}>输入覆盖与证据边界 C07 ↗</button></footer>
    </div>
  );
}

function DirectionMap({ radius, angle, compact = false }: { radius: number; angle: number; compact?: boolean }) {
  const angles = Array.from({ length: 73 }, (_, index) => index / 72 * Math.PI * 2);
  const angleA = angle * Math.PI / 180;
  const angleB = (angle + 90) % 360 * Math.PI / 180;
  const scaleInput = 78;
  const scaleResponse = 48 / Math.max(directionDrift(radius, angleA), directionDrift(radius, angleB), radius * .2, .01);
  const circlePath = angles.map((phi) => { const point = equalRadiusChange(radius, phi); return `${phi === 0 ? 'M' : 'L'} ${70 + point[0] * scaleInput} ${100 - point[1] * scaleInput}`; }).join(' ') + ' Z';
  const ellipsePath = angles.map((phi) => { const point = responseVector(equalRadiusChange(radius, phi)); return `${phi === 0 ? 'M' : 'L'} ${280 + point[0] * scaleResponse} ${100 - point[1] * scaleResponse}`; }).join(' ') + ' Z';
  const vectorA = equalRadiusChange(radius, angleA); const vectorB = equalRadiusChange(radius, angleB);
  const responseA = responseVector(vectorA); const responseB = responseVector(vectorB);
  return <div className={`v2-f-direction-map ${compact ? 'is-compact' : ''}`}><svg viewBox="0 0 360 200" role="img" aria-label="相同半径的参数变化经响应 Jacobian 映射成方向相关的函数变化"><circle cx="70" cy="100" r={radius * scaleInput} fill="#f6f5f0" stroke="#c9c7c0" strokeDasharray="4 4" /><path d={circlePath} fill="none" stroke="#7c84a4" strokeWidth="2" /><line x1="70" y1="100" x2={70 + vectorA[0] * scaleInput} y2={100 - vectorA[1] * scaleInput} stroke="#bb5d66" strokeWidth="2.5" /><circle cx={70 + vectorA[0] * scaleInput} cy={100 - vectorA[1] * scaleInput} r="5" fill="#bb5d66" /><line x1="70" y1="100" x2={70 + vectorB[0] * scaleInput} y2={100 - vectorB[1] * scaleInput} stroke="#5268b1" strokeWidth="2.5" /><circle cx={70 + vectorB[0] * scaleInput} cy={100 - vectorB[1] * scaleInput} r="5" fill="#5268b1" /><path d={ellipsePath} fill="#e9edf6" stroke="#6c79a2" strokeWidth="2" /><line x1="280" y1="100" x2={280 + responseA[0] * scaleResponse} y2={100 - responseA[1] * scaleResponse} stroke="#bb5d66" strokeWidth="2.5" /><circle cx={280 + responseA[0] * scaleResponse} cy={100 - responseA[1] * scaleResponse} r="5" fill="#bb5d66" /><line x1="280" y1="100" x2={280 + responseB[0] * scaleResponse} y2={100 - responseB[1] * scaleResponse} stroke="#5268b1" strokeWidth="2.5" /><circle cx={280 + responseB[0] * scaleResponse} cy={100 - responseB[1] * scaleResponse} r="5" fill="#5268b1" /><text x="70" y="18" textAnchor="middle">parameter space · ‖Δθ‖=r</text><text x="280" y="18" textAnchor="middle">response probes · JΔθ</text><text x="165" y="105" textAnchor="middle">J</text><text x="70" y="190" textAnchor="middle">φ={angle}° / φ+90°</text><text x="280" y="190" textAnchor="middle">same radius, different drift</text></svg>{compact ? null : <p>圆形参数扰动通过二维探针 Jacobian 变成方向相关的响应向量；所有点由当前 r 和 φ 计算。</p>}</div>;
}

function ProbeTable({ change }: { change: number[] }) {
  return <div className="v2-f-probe-table-wrap"><table className="v2-f-probe-table"><thead><tr><th>Input · Xₙ</th><th>Teacher f_old(x)</th><th>Student f(x)</th><th>|response drift|</th><th>Δθ₃ contribution</th></tr></thead><tbody>{probeInputs.map((x, index) => { const old = teacherFunction(x); const current = studentFunction(x, change); const vanisher = change[2] * probeVanisher(x); return <tr key={x}><th scope="row">{probeLabels[index]} = {x}</th><td>{fmt(old)}</td><td>{fmt(current)}</td><td>{fmt(Math.abs(current - old))}</td><td>{fmt(vanisher)}</td></tr>; })}</tbody></table></div>;
}

function FunctionProbeMap({ curve, change }: { curve: { x: number; old: number; current: number }[]; change: number[] }) {
  const xMap = (x: number) => 28 + (x + 2) / 4 * 324;
  const yMap = (y: number) => 165 - (y + 2) / 5 * 135;
  const oldLine = curve.map((point, index) => `${index ? 'L' : 'M'} ${xMap(point.x)} ${yMap(point.old)}`).join(' ');
  const currentLine = curve.map((point, index) => `${index ? 'L' : 'M'} ${xMap(point.x)} ${yMap(point.current)}`).join(' ');
  const unobserved = [-1.8, -1.6, 1.6, 1.8];
  return <div className="v2-f-function-plot"><svg viewBox="0 0 380 190" role="img" aria-label="Teacher 与 Student toy 函数曲线，X_n 训练探针及未观测旧域输入位置"><path d="M28 165 H352 M28 30 V165" stroke="#d7d4ce" strokeWidth="1" /><path d={oldLine} fill="none" stroke="#566eaf" strokeWidth="2.5" /><path d={currentLine} fill="none" stroke="#c66f6a" strokeWidth="2.5" />{probeInputs.map((x, index) => { const old = teacherFunction(x); const current = studentFunction(x, change); return <g key={x}><line x1={xMap(x)} x2={xMap(x)} y1="37" y2="165" stroke="#8a9ac0" strokeDasharray="3 4" opacity=".35" /><circle cx={xMap(x)} cy={yMap(old)} r="4.5" fill="#566eaf" /><circle cx={xMap(x)} cy={yMap(current)} r="3.2" fill="#fff" stroke="#c66f6a" strokeWidth="2" /><text x={xMap(x)} y="181" textAnchor="middle">x{index + 1} · Xₙ</text></g>; })}{unobserved.map((x) => <circle key={x} cx={xMap(x)} cy="165" r="4" fill="#fff" stroke="#8b8c91" strokeWidth="1.5" />)}<text x="36" y="22" fill="#566eaf">Teacher</text><text x="102" y="22" fill="#c66f6a">Student</text><text x="295" y="22" fill="#7b7c83">○ Xₒ reference</text></svg><div className="v2-f-plot-legend"><span><i className="is-teacher" />Teacher response</span><span><i className="is-student" />Student response</span><span><i className="is-probe" />constrained Xₙ probe</span><span><i className="is-xold" />Xₒ reference only</span></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function fmt(value: number) { return Number.isFinite(value) ? value.toFixed(4) : '0.0000'; }
