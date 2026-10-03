import { useState } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { PaperTerm } from "../components/PaperTerm";
import { SampleToken } from "../components/SampleToken";
import { CLASS_VISUALS, encode2D, MEMORY_BUDGET, samplesForClass, type ClassId, type FeatureState, type Vector2 } from "../data/icarl-runtime";

const steps: readonly GuidedStep[] = [
  { title: "被保留的真实样本叫什么？", short: "定义 exemplar" },
  { title: "样本怎样组成各类记忆？", short: "p → Pᵧ → P" },
  { title: "为什么保留原始图像？", short: "当前映射重编码" },
  { title: "同一份记忆会被读取到哪里？", short: "训练与预测" },
  { title: "固定总预算怎样分给更多类别？", short: "固定预算 K" },
  { title: "容量缩小时该留下哪些样本？", short: "引出 Herding" },
];

const classIds: readonly ClassId[] = ["A", "B", "C", "D"];
const examplesByClass = new Map(classIds.map((classId) => [classId, samplesForClass(classId).slice(0, 4)]));

export function PageFour({ onContinue }: { onContinue?: () => void }) {
  const [stage, setStage] = useState(0);
  const [modelState, setModelState] = useState<FeatureState>("after");
  const [role, setRole] = useState<"training" | "inference">("training");
  const [classCount, setClassCount] = useState(3);
  const firstExemplar = examplesByClass.get("A")![0];
  const perClassBudget = Math.floor(MEMORY_BUDGET / classCount);
  const reencodePoint = (vector: Vector2) => ({ x: 34 + vector[0] * 53, y: 87 - vector[1] * 72 });
  const oldFeaturePoint = reencodePoint(encode2D(firstExemplar, "before"));
  const currentFeaturePoint = reencodePoint(encode2D(firstExemplar, modelState));

  function changeStage(nextStage: number) {
    setStage(nextStage);
    if (nextStage === 5) setClassCount(4);
  }

  return (
    <article className="tutorial-page icarl-page icarl-page--p4">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 04</span><i /> EXEMPLAR MEMORY</div>
        <h1>一份有界记忆，<br className="p4-title-break" />两种运行职责</h1>
        <p>iCaRL 将少量真实训练图像作为<PaperTerm termId="exemplar" />长期保存，并受<PaperTerm termId="memory-budget">固定总预算 K</PaperTerm>约束。后续模型更新可以重读它们，最终预测也会重新编码它们并计算当前 prototype。</p>
      </header>

      <GuidedStepControls steps={steps} current={stage} onChange={changeStage} label="Page 4 exemplar memory 教学步骤" />

      <section className="p4-workbench" aria-label="Exemplar memory 和运行职责">
        <section className="panel p4-memory">
          <div className="panel-heading"><div><span className="eyebrow">{stage === 0 ? "RETAINED SAMPLE" : "PERSISTENT EXEMPLAR MEMORY"}</span><h2>按类别保存原始样本</h2></div><span className="p4-memory-mark">{stage === 0 ? "pₖ" : "P"}</span></div>
          <p className="p4-memory__intro">{stage >= 4 ? "空槽只表示每类 quota；具体保留哪些图像要由 exemplar selection 决定。" : "同一张图像长期留在 memory 中；卡片在不同阶段被读取，不会从记忆里消失。"}</p>
          <div className={`p4-buckets${classCount === 4 && stage >= 4 ? " p4-buckets--four" : ""}`}>
            {classIds.slice(0, stage === 0 ? 1 : stage >= 4 ? classCount : 3).map((classId) => {
              const samples = examplesByClass.get(classId)!;
              const visibleCount = stage === 0 ? 1 : stage >= 4 ? perClassBudget : 4;
              return <section className="p4-bucket" key={classId} style={{ "--bucket-accent": CLASS_VISUALS[classId].color } as React.CSSProperties}>
                <div className="p4-bucket__heading">{stage === 0 ? <><b>保留的样本</b><span>raw image</span></> : <><b>{CLASS_VISUALS[classId].displayLabel}</b><span>P<sub>{CLASS_VISUALS[classId].index}</sub></span></>}</div>
                <div className="p4-bucket__items" aria-label={`${CLASS_VISUALS[classId].displayLabel} 的 exemplar collection`}>
                  {stage >= 4
                    ? Array.from({ length: visibleCount }, (_, index) => <span key={`budget-${classId}-${index}`} className="p4-budget-slot" aria-label="尚未指定具体样本的记忆容量槽"><i aria-hidden="true" /><small>slot</small></span>)
                    : samples.slice(0, visibleCount).map((sample) => <SampleToken key={sample.id} sample={sample} role="exemplar" compact />)}
                </div>
                {stage >= 4 ? <div className="p4-bucket__capacity">{visibleCount} / 每类容量</div> : null}
              </section>;
            })}
          </div>
          {stage === 0 ? <div className="p4-exemplar-definition"><span className="p4-definition-token">p<sub>k</sub></span><p><b>Exemplar</b> 是一个被长期保留的真实训练样本。<br /><small>它不是 prototype、class mean，也不是旧 feature vector。</small></p></div> : null}
          {stage === 1 ? <div className="p4-object-hierarchy"><span><b>p<sub>k</sub></b><small>单个 exemplar</small></span><i aria-hidden="true">→</i><span><b>P<sub>y</sub></b><small>某一类的 collection</small></span><i aria-hidden="true">→</i><span><b>P = (P<sub>1</sub>, …, P<sub>t</sub>)</b><small>整体 memory</small></span></div> : null}
          {stage >= 4 ? <div className="p4-total-budget"><span>固定总容量</span><strong>K = {MEMORY_BUDGET}</strong><i className="p4-budget-track"><b /></i><small>总 exemplars {classCount * perClassBudget} / {MEMORY_BUDGET} · floor 分配可能留下未使用槽位</small></div> : null}
        </section>

        <section className="panel p4-runtime">
          <div className="panel-heading"><div><span className="eyebrow">CURRENT RESPONSIBILITY</span><h2>{stage === 2 ? "保存 image，按当前 φ 重编码" : stage === 4 || stage === 5 ? "总预算固定，每类容量下降" : "同一份 P 被两个阶段读取"}</h2></div></div>

          {stage === 2 ? <div className="p4-reencode">
            <div className="p4-state-switch" role="group" aria-label="选择当前特征映射">
              <button type="button" aria-pressed={modelState === "before"} onClick={() => setModelState("before")}>φold</button>
              <button type="button" aria-pressed={modelState === "after"} onClick={() => setModelState("after")}>φnew</button>
            </div>
            <div className="p4-saved-image"><SampleToken sample={firstExemplar} role="exemplar" /><span className="p4-persistent-tag">原始图像 · 长期保存</span></div>
            <div className="p4-reencode-arrow" aria-label={`图像送入 ${modelState === "before" ? "旧" : "新"}特征映射`}><span>φ<sub>Θ {modelState === "before" ? "old" : "new"}</sub></span><i aria-hidden="true" /></div>
            <svg className="p4-reencode-map" viewBox="0 0 320 126" role="img" aria-label="同一 exemplar 在旧特征映射和当前映射下的位置">
              <title>同一原始图像在两个表示空间的位置</title>
              <desc>φold 下的空心点与当前 φ 下的实心点由方向箭头连接，位置来自固定合成坐标。</desc>
              <line x1="20" y1="87" x2="300" y2="87" />
              <line x1="34" y1="18" x2="34" y2="104" />
              <line className="p4-reencode-drift" x1={oldFeaturePoint.x} y1={oldFeaturePoint.y} x2={currentFeaturePoint.x} y2={currentFeaturePoint.y} markerEnd="url(#p4-reencode-arrow)" />
              <defs><marker id="p4-reencode-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 8 4 L 0 8" /></marker></defs>
              <circle className="p4-reencode-old" cx={oldFeaturePoint.x} cy={oldFeaturePoint.y} r="6" />
              <circle className="p4-reencode-current" cx={currentFeaturePoint.x} cy={currentFeaturePoint.y} r="6" />
              <text x={oldFeaturePoint.x + 9} y={oldFeaturePoint.y - 7}>z_old</text>
              <text x={currentFeaturePoint.x + 9} y={currentFeaturePoint.y + 16}>{modelState === "before" ? "same position" : "φcurrent(p₁)"}</text>
            </svg>
            <div className="p4-feature-result"><span className="p4-feature-dot" /><div><b>{modelState === "before" ? "z_old" : "z_new"} = φ(p₁)</b><small>{modelState === "before" ? "旧表示空间中的结果" : "同一原始图像在当前空间的新表示"}</small></div></div>
            <div className="p4-stale-vector"><span>×</span><p><b>旧 embedding 不是保存对象</b><small>z_old 不会自动变成 φnew(p₁)。</small></p></div>
          </div> : null}

          {stage === 3 ? <div className="p4-roles">
            <div className="p4-role-switch" role="group" aria-label="切换 exemplar memory 使用职责">
              <button type="button" aria-pressed={role === "training"} onClick={() => setRole("training")}>参与后续训练</button>
              <button type="button" aria-pressed={role === "inference"} onClick={() => setRole("inference")}>构造预测原型</button>
            </div>
            <div className="p4-role-diagram">
              <div className="p4-role-memory"><b>P · EXEMPLAR MEMORY</b><span>持久状态 · 仍保留原样本</span><div><SampleToken sample={firstExemplar} role="exemplar" compact /><SampleToken sample={examplesByClass.get("B")![0]} role="exemplar" compact /></div></div>
              <div className="p4-role-path" aria-hidden="true"><i /><span>{role === "training" ? "读取旧样本" : "读取并重新编码"}</span><i /></div>
              {role === "training" ? <div className="p4-role-target p4-role-target--training"><span className="p4-role-target__tag">TRAINING / REHEARSAL</span><div className="p4-role-join"><span>旧 exemplars</span><b>+</b><span>新类完整数据</span></div><i className="p4-flow-arrow" aria-hidden="true" /><strong>combined training set</strong><small>旧样本在后续阶段再次参与 representation learning</small></div> : <div className="p4-role-target p4-role-target--inference"><span className="p4-role-target__tag">INFERENCE / PROTOTYPE</span><div className="p4-role-equation"><span>P<sub>y</sub></span><i aria-hidden="true">→</i><span>current φ</span><i aria-hidden="true">→</i><span>mean</span><i aria-hidden="true">→</i><b>μ<sub>y</sub></b></div><small>prototype 用当前 feature extractor 从 exemplar 图像重新计算</small></div>}
            </div>
            <p className="p4-role-invariant">切换的是读取职责；P 中的原始样本身份和长期状态保持不变。</p>
          </div> : null}

          {stage === 4 || stage === 5 ? <div className="p4-capacity">
            <div className="p4-class-count-switch" role="group" aria-label="记忆中的类别数">
              <button type="button" aria-pressed={classCount === 3} onClick={() => setClassCount(3)}>3 个已见类别</button>
              <button type="button" aria-pressed={classCount === 4} onClick={() => setClassCount(4)}>新类别到达 → 4 类</button>
            </div>
            <div className="p4-capacity-result"><div><span>总 exemplars</span><b>K = {MEMORY_BUDGET}</b></div><i aria-hidden="true">÷</i><div><span>已见类别</span><b>t = {classCount}</b></div><i aria-hidden="true">=</i><div className="p4-capacity-result__quota" title={`整数配额 m = ⌊K / t⌋。本例 K=${MEMORY_BUDGET}：t=3 时 m=4；t=4 时 m=3。当前每类容量为 ${perClassBudget}。`}><span>每类可用容量</span><b>m = ⌊K / t⌋ = {perClassBudget}</b></div></div>
            <p>{classCount === 3 ? "3 类时，每类最多保留 4 个 exemplars。" : "第 4 类加入后，各类最多保留 3 个；总预算 K 保持 12。"} K 限制 exemplar memory，不表示神经网络参数量完全不变。</p>
            {stage === 5 ? <div className="p4-mean-question"><span>FEATURE SPACE</span><div><i className="p4-mini-mean" /><span>当前 exemplars 的均值</span><b>?</b><span>要近似的类别中心</span></div><strong>{classCount === 4 ? "每类从 4 个槽位缩到 3 个，哪些样本应优先留下，才能让剩余均值继续代表这个类？" : "类别增加后每类容量将下降；哪些样本应优先留下，才能让剩余均值继续代表这个类？"}</strong></div> : null}
          </div> : null}

          {stage === 0 ? <div className="p4-kind-card"><span className="eyebrow">ONE RETAINED TRAINING IMAGE</span><div><SampleToken sample={firstExemplar} role="exemplar" /><span>p<sub>k</sub> 是实际图像样本的身份，不是模型内部数值。</span></div><strong>exemplar ≠ old feature vector ≠ class prototype</strong><p>iCaRL 以后可以用更新后的 feature extractor 重新读取并编码这张图像。</p></div> : null}
          {stage === 1 ? <div className="p4-persistent-state"><span className="eyebrow">ICARL STATE AFTER t CLASSES</span><div><section><b>Θ</b><small>network parameters</small></section><i aria-hidden="true">+</i><section><b>P = (P₁, …, Pₜ)</b><small>exemplar memory</small></section></div><p>网络参数和 exemplars memory 一起构成跨增量阶段延续的算法状态。</p></div> : null}
        </section>
      </section>

      <section className="icarl-concept-note"><span className="icarl-concept-note__index">0{stage + 1}</span><div><span className="eyebrow">这一幕要看懂</span><p>{stage === 0 ? "Exemplar 是有持久身份的真实图像；它既不同于该图像的特征表示，也不同于用来分类的 prototype。" : stage === 1 ? "pₖ 组成某类 Pᵧ，所有类别的集合组成 P。此处只定义分组，不给样本排序。" : stage === 2 ? "表示空间改变后，保存的原始 image 可重新经过当前 φ；存下来的旧 embedding 仍属于旧空间。" : stage === 3 ? "同一份 exemplar memory 分别被后续训练和 prototype inference 读取；它不因一次读取而被消费。" : stage === 4 ? "总预算 K 固定，类别数 t 增加时每类 quota m=floor(K/t) 会减少。" : "记忆缩小但每类均值仍要尽量有代表性，因此需要一开始就考虑 exemplar 的选择次序。"}</p></div></section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 05</span><p>如何从完整新类数据中选出有优先顺序的 exemplars？</p></div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>进入 Herding <b aria-hidden="true">→</b></button> : <span className="icarl-handoff__upcoming">下一页</span>}
      </footer>
    </article>
  );
}
