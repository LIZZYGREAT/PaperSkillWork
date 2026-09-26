import React, { useState } from 'react';
import { useReferenceHub } from '../components/ReferencePrimitives';
import { InlineNotation } from '../components/InlineNotation';
import {
  argmax,
  compareResponseLosses,
  computeDistillation,
  distributionDistance,
  entropy,
  type CacheFormat,
  type Reduction,
  type ResponseLossKind,
} from '../simulation/distillation';

const classLabels = ['A', 'B', 'C', 'D', 'E'];
const teacherBase = [.46, .27, .14, .08, .05];
const teacherLogits = teacherBase.map(Math.log);
const responsePresets: Record<'A' | 'B', number[]> = {
  A: [.48, .26, .14, .07, .05],
  B: [.86, .05, .035, .03, .025],
} as const;
const lossNames: Record<ResponseLossKind, string> = {
  kd: 'KD · KL divergence',
  'cross-entropy': 'Cross-Entropy',
  l1: 'L1 response distance',
  l2: 'L2 response distance',
};
const levelNames = ['Full response', 'Temperature', 'Loss', 'Gradient'];

type Level = 0 | 1 | 2 | 3;

export function SceneD() {
  const { openHub } = useReferenceHub();
  const [level, setLevel] = useState<Level>(0);
  const [studentLogits, setStudentLogits] = useState(() => [.53, .22, .12, .08, .05].map(Math.log));
  const [temperature, setTemperature] = useState(2);
  const [selectedClass, setSelectedClass] = useState(1);
  const [comparisonChoice, setComparisonChoice] = useState<'A' | 'B'>('A');
  const [showHardLabel, setShowHardLabel] = useState(false);
  const [lossKind, setLossKind] = useState<ResponseLossKind>('cross-entropy');
  const [reduction, setReduction] = useState<Reduction>('sum');
  const [cacheFormat, setCacheFormat] = useState<CacheFormat>('probabilities');
  const [includeT2, setIncludeT2] = useState(false);

  const result = computeDistillation({
    teacherLogits,
    studentLogits,
    temperature,
    reduction,
    lossKind,
    cacheFormat,
    includeT2,
  });
  const comparisonResults = compareResponseLosses(teacherLogits, studentLogits, temperature, reduction, includeT2);
  const hardLabel = argmax(result.teacherRaw);
  const currentGradient = result.gradient[selectedClass];
  const t2Applicable = lossKind === 'kd' || lossKind === 'cross-entropy';
  const gradientEquation = t2Applicable
    ? includeT2 ? 'T² · (p_i(T) − q_i(T)) / T' : '(p_i(T) − q_i(T)) / T'
    : `J_softmax(z/T)ᵀ · ∂${lossNames[lossKind]}/∂p`;
  const loadedPreset = responsePresets[comparisonChoice];
  const loadPreset = (choice: 'A' | 'B') => {
    setComparisonChoice(choice);
    setStudentLogits(responsePresets[choice].map((probability) => Math.log(probability)));
  };

  return (
    <div className="v2-scene-content v2-scene-d">
      <section className="v2-d-intro v2-state-card">
        <div className="v2-section-title-row">
          <div><p className="v2-eyebrow">INSPECT L_OLD · PAPER + TEACHING TOY</p><h2>从旧响应一路追到 Student 的梯度</h2></div>
          <button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'F03' })}>论文公式 F03 ↗</button>
        </div>
        <p>固定 Teacher，在 Student 侧检查完整旧任务响应、温度变换、逐类交叉熵与对旧 head / shared representation 的梯度路径。图中的类别与数值均为 Teaching Toy 合成示意，不是论文预测。</p>
        <div className="v2-d-chain" aria-label="旧响应到共享参数梯度的路径">
          {['Y_o', 'Temperature', 'Y′_o', 'L_old', '∂L_old / ∂z_o', '∇θ_o,θ_s L_old'].map((item, index) => <React.Fragment key={item}><span><InlineNotation text={item} /></span>{index < 5 ? <i aria-hidden="true">→</i> : null}</React.Fragment>)}
        </div>
      </section>

      <section className="v2-d-panel" aria-labelledby="d-level-title">
        <div className="v2-d-level-nav" role="group" aria-label="蒸馏检查步骤">
          {levelNames.map((name, index) => <button key={name} type="button" aria-pressed={level === index} className={level === index ? 'is-active' : ''} onClick={() => setLevel(index as Level)}><span>0{index + 1}</span>{name}</button>)}
        </div>

        {level === 0 ? (
          <section className="v2-d-level-body" aria-labelledby="d-level-title">
            <header className="v2-section-title-row"><div><p className="v2-eyebrow">LEVEL 1 · DECISION VS FULL RESPONSE</p><h2 id="d-level-title">同一个 top-1 决策，可能有不同的旧任务响应</h2></div><span className="v2-source-badge is-toy">MECHANISM / TEACHING TOY</span></header>
            <div className="v2-d-probability-compare">
              <DistributionBars title="Teacher" values={result.teacherRaw} selectedClass={selectedClass} />
              <DistributionBars title={`Student ${comparisonChoice}`} values={loadedPreset} selectedClass={selectedClass} />
            </div>
            <div className="v2-d-comparison-readout">
              <div><span>Teacher argmax</span><strong>Class {classLabels[argmax(result.teacherRaw)]}</strong></div>
              <div><span>Student argmax</span><strong>Class {classLabels[argmax(loadedPreset)]}</strong></div>
              <div><span>Full-response L1 distance</span><strong>{fmt(distributionDistance(result.teacherRaw, loadedPreset))}</strong></div>
              <div className="v2-d-preset-actions"><button type="button" aria-pressed={comparisonChoice === 'A'} onClick={() => loadPreset('A')}>载入 Student A</button><button type="button" aria-pressed={comparisonChoice === 'B'} onClick={() => loadPreset('B')}>载入 Student B</button></div>
            </div>
            <div className="v2-d-hard-label-row"><button type="button" aria-pressed={showHardLabel} onClick={() => setShowHardLabel((value) => !value)}>{showHardLabel ? '恢复完整响应' : '将 Teacher 响应压成 hard label'}</button><span>Full response：{vector(result.teacherRaw)}</span>{showHardLabel ? <strong>Hard label：{vector(result.teacherRaw.map((_, index) => Number(index === hardLabel)))}</strong> : null}</div>
            {showHardLabel ? <p className="v2-d-explanation">Hard label 删除了非 top-1 类之间的相对响应信息。这里是机制教学对照，不代表论文报告过 hard-label 消融。</p> : <p className="v2-d-explanation">LwF 使用完整 old-task response；相同预测类别只说明 top-1 一致，不说明整个输出行为一致。</p>}
          </section>
        ) : null}

        {level === 1 ? (
          <section className="v2-d-level-body" aria-labelledby="d-level-title">
            <header className="v2-section-title-row"><div><p className="v2-eyebrow">LEVEL 2 · TEMPERATURE INSPECTOR</p><h2 id="d-level-title">调节 T，观察整个类别分布如何参与旧响应保持</h2></div><button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'F02' })}>温度变换 F02 ↗</button></header>
            <div className="v2-d-temperature-control"><label htmlFor="d-temperature">Temperature T <strong>{temperature.toFixed(1)}</strong></label><input id="d-temperature" type="range" min="1" max="5" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /><div><span>T = 1 · 原始响应</span><span>T = 5 · 较平滑</span></div></div>
            <div className="v2-d-logit-strip"><span>Teacher logits · Teaching Toy</span><code>{vector(teacherLogits)}</code></div>
            <div className="v2-d-temperature-grid">
              <DistributionBars title="Teacher 原始响应" values={result.teacherRaw} selectedClass={selectedClass} />
              <DistributionBars title={`Teacher 温度响应 · T=${temperature.toFixed(1)}`} values={result.teacherTarget} selectedClass={selectedClass} />
              <div className="v2-d-metrics"><Metric label="Entropy · nats" value={fmt(entropy(result.teacherTarget))} /><Metric label="Top-1 mass" value={fmt(result.teacherTarget[argmax(result.teacherTarget)])} /><Metric label="Non-top-1 mass" value={fmt(1 - result.teacherTarget[argmax(result.teacherTarget)])} /></div>
            </div>
            <ClassLens values={result.teacherRaw} transformed={result.teacherTarget} student={result.student} perClassLoss={result.perClassLoss} gradient={result.gradient} selected={selectedClass} onSelect={setSelectedClass} />
            <p className="v2-d-explanation">提高 T 会提高小概率类别的相对权重，让非 top-1 类结构更明显地参与匹配。Paper 写法在概率空间做幂次变换；在 logits 上使用 softmax(z/T) 是等价实现映射。</p>
          </section>
        ) : null}

        {level === 2 ? (
          <section className="v2-d-level-body" aria-labelledby="d-level-title">
            <header className="v2-section-title-row"><div><p className="v2-eyebrow">LEVEL 3 · LOSS DECOMPOSER</p><h2 id="d-level-title">编辑 Student logits，追踪每一类对 L_old 的贡献</h2></div><span className="v2-source-badge is-toy">TEACHING TOY · SYNTHETIC</span></header>
            <div className="v2-d-logit-editor" role="group" aria-label="编辑 Student logits">
              {studentLogits.map((value, index) => <label key={classLabels[index]}><span>z_{classLabels[index]}</span><input type="number" step="0.1" value={Number(value.toFixed(3))} onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next)) setStudentLogits((current) => current.map((item, itemIndex) => itemIndex === index ? next : item)); }} /></label>)}
              <button type="button" onClick={() => setStudentLogits([.53, .22, .12, .08, .05].map(Math.log))}>重置 Student</button>
            </div>
            <div className="v2-d-loss-options" role="group" aria-label="选择旧响应损失">
              {(['kd', 'cross-entropy', 'l1', 'l2'] as ResponseLossKind[]).map((kind) => <button key={kind} type="button" aria-pressed={lossKind === kind} className={lossKind === kind ? 'is-active' : ''} onClick={() => setLossKind(kind)}>{lossNames[kind]}</button>)}
            </div>
            <div className="v2-d-loss-summary"><div><span><InlineNotation text="Teacher target q(T)" /></span><code>{vector(result.teacherTarget)}</code></div><div><span><InlineNotation text="Student response p(T)" /></span><code>{vector(result.student)}</code></div><strong><InlineNotation text={`${lossNames[lossKind]} · L_old = ${fmt(result.loss)}`} /></strong></div>
            <div className="v2-d-loss-table-wrap"><table className="v2-d-loss-table"><thead><tr><th>Class</th><th>Teacher q</th><th>Student p</th><th>−q log p</th><th>{lossNames[lossKind]} contribution</th></tr></thead><tbody>{classLabels.map((label, index) => <tr key={label} className={selectedClass === index ? 'is-selected' : ''}><th scope="row"><button type="button" aria-pressed={selectedClass === index} onClick={() => setSelectedClass(index)}>{label}</button></th><td>{fmt(result.teacherTarget[index])}</td><td>{fmt(result.student[index])}</td><td>{fmt(result.perClassCrossEntropy[index])}</td><td>{fmt(result.perClassLoss[index])}</td></tr>)}</tbody></table></div>
            <ClassLens values={result.teacherRaw} transformed={result.teacherTarget} student={result.student} perClassLoss={result.perClassLoss} gradient={result.gradient} selected={selectedClass} onSelect={setSelectedClass} />
            <div className="v2-d-cache-reduction-grid">
              <section><h3>Response Cache Inspector</h3><div className="v2-d-choice-row" role="group" aria-label="Teacher target cache format"><button type="button" aria-pressed={cacheFormat === 'probabilities'} onClick={() => setCacheFormat('probabilities')}>缓存 probabilities</button><button type="button" aria-pressed={cacheFormat === 'logits'} onClick={() => setCacheFormat('logits')}>缓存 logits</button></div><code>{cacheFormat === 'probabilities' ? vector(result.teacherRaw) : vector(teacherLogits)}</code><p>存概率时使用 q^(1/T) 再归一化；存 logits 时使用 softmax(z/T)。保留相同原始信息时两者数学等价，缓存格式决定具体变换路径。</p></section>
              <section><h3>Reduction Inspector · Implementation</h3><div className="v2-d-choice-row" role="group" aria-label="选择 loss reduction">{(['sum', 'mean', 'batchmean'] as Reduction[]).map((item) => <button key={item} type="button" aria-pressed={reduction === item} onClick={() => setReduction(item)}>{item}</button>)}</div><p><InlineNotation text="Toy 当前按单样本 B=1 计算：sum 对类求和；mean 对 B×C 平均；batchmean 对类求和后除以 B。reduction 会改变 loss 尺度，进而改变 λ_o L_old 与 L_new 的相对量级。" /></p></section>
            </div>
            <div className="v2-d-loss-comparison" aria-label="不同旧响应损失的计算比较"><div><p className="v2-eyebrow">RESPONSE LOSS COMPARISON · SAME TEACHER / STUDENT</p><h3>保持旧响应是核心；损失定义会改变具体 loss 与梯度</h3></div><div>{comparisonResults.map((entry) => <button type="button" key={entry.kind} aria-pressed={lossKind === entry.kind} className={lossKind === entry.kind ? 'is-selected' : ''} onClick={() => setLossKind(entry.kind)}><strong>{lossNames[entry.kind]}</strong><span>L = {fmt(entry.loss)}</span><small>‖∂L/∂z‖ = {fmt(Math.sqrt(entry.gradient.reduce((sum, value) => sum + value * value, 0)))}</small></button>)}</div><p>KD 与 cross-entropy 的梯度相同，损失相差 Teacher 熵常数；KD 略优而其他 response losses 也可用，是论文特定实验中的观察，不表示任意 loss 完全等价。</p></div>
          </section>
        ) : null}

        {level === 3 ? (
          <section className="v2-d-level-body" aria-labelledby="d-level-title">
            <header className="v2-section-title-row"><div><p className="v2-eyebrow">LEVEL 4 · GRADIENT PRESSURE</p><h2 id="d-level-title">Teacher 和 Student 不一致，会沿旧输出路径产生梯度</h2></div><span className="v2-source-badge is-toy">LIVE COMPUTATION</span></header>
            <div className="v2-d-gradient-equation"><span><InlineNotation text="∂L_old / ∂z_i" /></span><strong><InlineNotation text={gradientEquation} /></strong><small>{t2Applicable ? includeT2 ? '已启用：Generic KD implementation variant' : '不默认添加 generic KD 中常见的 T² scaling' : '当前所选距离损失通过 softmax Jacobian 回传'}</small></div>
            <div className="v2-d-gradient-table"><div className="v2-d-gradient-head"><span>Class</span><span>Teacher q(T)</span><span>Student p(T)</span><span>Gradient</span><span>Logit pressure</span></div>{classLabels.map((label, index) => { const gradient = result.gradient[index]; return <button type="button" key={label} className={`v2-d-gradient-row ${selectedClass === index ? 'is-selected' : ''}`} onClick={() => setSelectedClass(index)}><strong>{label}</strong><span>{fmt(result.teacherTarget[index])}</span><span>{fmt(result.student[index])}</span><b>{gradient > 0 ? '+' : ''}{fmt(gradient)}</b><span>{gradient > 0 ? '下降 logit' : gradient < 0 ? '提高 logit' : '本点为零'}</span></button>; })}</div>
            <div className="v2-d-gradient-readout"><strong>Class {classLabels[selectedClass]}</strong><span>Teacher {result.teacherTarget[selectedClass] > result.student[selectedClass] ? '高于' : result.teacherTarget[selectedClass] < result.student[selectedClass] ? '低于' : '等于'} Student；当前 ∂L/∂z = {fmt(currentGradient)}。</span><b>{currentGradient > 0 ? '梯度下降会压低该 logit' : currentGradient < 0 ? '梯度下降会抬高该 logit' : '该类别在当前点没有 logit 更新压力'}</b></div>
            <details className="v2-d-advanced"><summary>Implementation Detail：T² scaling 与 Reduction</summary><div><p>一些通用 KD 实现将 response cross-entropy 乘以 T²，以抵消温度对梯度量级的缩放。论文描述温度化响应和交叉熵时没有把这个通用项写成主方法的默认设置。</p><label><input type="checkbox" checked={includeT2} disabled={!t2Applicable} onChange={(event) => setIncludeT2(event.target.checked)} />展示 T² implementation variant {t2Applicable ? '' : '（仅适用于当前 KD / Cross-Entropy）'}</label><p>在 KD / Cross-Entropy 下切换会实时改变本 toy loss 与梯度，并明确标为 implementation variant；严格复现时不能悄悄混入。</p></div></details>
            <div className="v2-d-shape-trace" aria-label="旧响应损失的张量形状路径"><span><InlineNotation text="Teacher Y_o" /><br /><b>[B, C_old]</b></span><i>→</i><span>温度变换<br /><b>[B, C_old]</b></span><i>→</i><span>逐类 CE<br /><b>[B, C_old]</b></span><i>→</i><span>类别归约<br /><b>[B]</b></span><i>→</i><span>batch 归约<br /><b><InlineNotation text="scalar L_old" /></b></span></div>
            <div className="v2-d-gradient-path"><strong>Gradient path</strong><span><InlineNotation text="L_old → Student old logits z_o → θ_o + h → shared θ_s" /></span><p>这里的梯度来自当前 Student 预测端；Teacher target 固定。D 的 class-logit 梯度是计算结果，传到真实网络参数还要经过 Student 计算图。</p></div>
            <p className="v2-d-explanation">KD 与 cross-entropy 的 Student 梯度相同（相差一个与 Student 无关的 Teacher 熵常数）；L1 与 L2 的损失值和梯度则由当前 Toy response 实时计算。不存在一个“神奇 loss”替代整条 response-preservation 路径。</p>
          </section>
        ) : null}
      </section>

      <footer className="v2-d-footer"><span>Paper: 温度响应与 L_old · A04 / F02–F03</span><button type="button" onClick={() => openHub({ evidenceId: 'A04' })}>查看 Y_o 来源 A04 ↗</button></footer>
    </div>
  );
}

function DistributionBars({ title, values, selectedClass }: { title: string; values: readonly number[]; selectedClass: number }) {
  return <div className="v2-d-distribution"><h3>{title}</h3><div role="list">{values.map((value, index) => <div key={classLabels[index]} role="listitem" className={selectedClass === index ? 'is-selected' : ''}><span>{classLabels[index]}</span><i><b style={{ width: `${value * 100}%` }} /></i><strong>{fmt(value)}</strong></div>)}</div></div>;
}

function ClassLens({ values, transformed, student, perClassLoss, gradient, selected, onSelect }: { values: number[]; transformed: number[]; student: number[]; perClassLoss: number[]; gradient: number[]; selected: number; onSelect: (index: number) => void }) {
  return <div className="v2-d-class-lens"><div className="v2-d-class-buttons" role="group" aria-label="选择要放大的类别">{classLabels.map((label, index) => <button key={label} type="button" aria-pressed={selected === index} onClick={() => onSelect(index)}>Class {label}</button>)}</div><div><strong>Class {classLabels[selected]} · Lens</strong><span>原始 Teacher {fmt(values[selected])} → after T {fmt(transformed[selected])}</span><span>Student {fmt(student[selected])} · 当前 loss contribution {fmt(perClassLoss[selected])}</span><b>logit gradient {gradient[selected] > 0 ? '+' : ''}{fmt(gradient[selected])} · {gradient[selected] > 0 ? 'push down' : gradient[selected] < 0 ? 'push up' : 'neutral'}</b></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function fmt(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : '0.0000';
}

function vector(values: number[]) {
  return `[${values.map(fmt).join(', ')}]`;
}
