import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { PaperTerm } from "../components/PaperTerm";
import { ClassFeatureMarker } from "../components/FeatureSpaceWorkbench";
import { CLASS_VISUALS, encode2D, encodeRawVector, euclideanDistance, mean, normalize, P_BEFORE, type ClassId, type Vector2 } from "../data/icarl-runtime";

const steps: readonly GuidedStep[] = [
  { title: "已保留图片怎样变成可比较的特征？", short: "图片变特征" },
  { title: "同类特征怎样形成类别原型？", short: "计算类别原型" },
  { title: "新的 Query 怎样进入同一空间？", short: "输入 Query" },
  { title: "怎样依据最近原型输出预测？", short: "最近原型预测" },
];

const classIds: readonly ClassId[] = ["A", "B", "C"];
const exemplarByClass = new Map(classIds.map((classId) => [classId, P_BEFORE[classId]]));
const exemplars = classIds.flatMap((classId) => exemplarByClass.get(classId)!);
const queryInput: Vector2 = [1.732, -1.0];
const queryRawFeature = encodeRawVector(queryInput, "before");
const queryFeature = normalize(queryRawFeature);
const chartOrigin = { x: 320, y: 260 };
const chartScale = 180;

type PrototypeCalculation = {
  classId: ClassId;
  features: [number, number][];
  rawMean: [number, number];
  prototype: [number, number];
};

const prototypeCalculations: PrototypeCalculation[] = classIds.map((classId) => {
  const features = exemplarByClass.get(classId)!.map((sample) => normalize(encode2D(sample, "before")));
  const rawMean = mean(features);
  return { classId, features, rawMean, prototype: normalize(rawMean) };
});

const prototypeByClass = new Map(prototypeCalculations.map((item) => [item.classId, item.prototype]));
const queryComparisons = prototypeCalculations
  .map(({ classId, prototype }) => {
    const cosine = Math.max(-1, Math.min(1, queryFeature[0] * prototype[0] + queryFeature[1] * prototype[1]));
    return {
      classId,
      distance: euclideanDistance(queryFeature, prototype),
      angle: Math.acos(cosine) * 180 / Math.PI,
    };
  })
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId));
const predictedClass = queryComparisons[0].classId;

function chartPoint(vector: Vector2) {
  return { x: chartOrigin.x + vector[0] * chartScale, y: chartOrigin.y - vector[1] * chartScale };
}

function shortestAngleArc(from: Vector2, to: Vector2, radius: number) {
  const start = Math.atan2(from[1], from[0]);
  const end = Math.atan2(to[1], to[0]);
  let delta = end - start;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const arcEnd = start + delta;
  const startPoint = { x: chartOrigin.x + Math.cos(start) * radius, y: chartOrigin.y - Math.sin(start) * radius };
  const endPoint = { x: chartOrigin.x + Math.cos(arcEnd) * radius, y: chartOrigin.y - Math.sin(arcEnd) * radius };
  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 0 : 1} ${endPoint.x} ${endPoint.y}`;
}

const prototypeLabelPlacement: Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  A: { dx: 18, dy: -10, anchor: "start" },
  B: { dx: 0, dy: -19, anchor: "middle" },
  C: { dx: -18, dy: -9, anchor: "end" },
  D: { dx: 18, dy: 18, anchor: "start" },
};

const meanLabelPlacement: Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  A: { dx: -13, dy: 22, anchor: "end" },
  B: { dx: -14, dy: 23, anchor: "end" },
  C: { dx: 13, dy: 23, anchor: "start" },
  D: { dx: 13, dy: -15, anchor: "start" },
};

const stageFigureGuides = [
  {
    action: "每张保留图片先提取特征，再各自做 L2 归一化。",
    reading: "空心点是归一化前；外圈彩色点是归一化后的 12 个 Exemplar 特征。",
  },
  {
    action: "每类 4 个外圈特征先求均值，再沿同一方向重新单位化。",
    reading: "圆内大圆是均值 z̄y；方框是单位圆上的类别 Prototype μy。",
  },
  {
    action: "只把新的 Query 编码到同一空间，已算好的三个 Prototype 不变。",
    reading: "棕色空心点是归一化前的 fΘ(xq)，深色菱形是 zq；圆心虚线表示方向不变。",
  },
  {
    action: "比较 Query 到三个 Prototype 的欧氏距离，选择最短的一条。",
    reading: "圆弧表示 zq 与各 μy 的方向夹角；右表列出角度和距离，粗实线标出最近原型。",
  },
] as const;

function FeatureMap({
  stage,
  selectedSampleId,
  onSelectSample,
}: {
  stage: number;
  selectedSampleId: string;
  onSelectSample: (id: string) => void;
}) {
  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];
  const showPrototypes = stage >= 1;
  const showQuery = stage >= 2;
  const showDecision = stage === 3;
  const normalizedPoints = exemplars.map((sample) => ({ sample, position: chartPoint(normalize(encode2D(sample, "before"))) }));
  function activatePoint(event: KeyboardEvent<SVGGElement>, sampleId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSample(sampleId);
    }
  }

  return (
    <div className={`p3-map p3-map--stage-${stage}`}>
      <div className="p3-map__meta">
        <span>FIXED SYNTHETIC · 2D TEACHING SPACE</span>
        <span>固定特征提取器 · φ<sub>Θ fixed</sub></span>
        <span>所选 Exemplar · {selectedSampleId}</span>
      </div>
      <div className="p3-map__guide" aria-live="polite">
        <b>本步动作</b><span>{stageFigureGuides[stage].action}</span>
        <b>读图方法</b><span>{stageFigureGuides[stage].reading}</span>
      </div>
      <svg viewBox="0 0 640 520" role="img" aria-label="十二张已保留图片的单位化特征、三类原型和查询特征构成的固定二维教学空间">
        <title>Exemplar prototype prediction</title>
        <desc>十二张 Exemplar 图片经过同一个固定特征提取器。第二步同时显示圆内均值和归一化后的原型；第三步加入独立 Query；第四步用圆弧展示 Query 与三个原型的方向夹角，并显示 Query 到原型的距离。</desc>
        <circle className="p3-map__unit-circle" cx={chartOrigin.x} cy={chartOrigin.y} r={chartScale} />
        <line className="p3-map__axis" x1="24" y1={chartOrigin.y} x2="616" y2={chartOrigin.y} />
        <line className="p3-map__axis" x1={chartOrigin.x} y1="14" x2={chartOrigin.x} y2="506" />

        {stage === 0 ? exemplars.map((sample) => {
          const rawPosition = chartPoint(encode2D(sample, "before"));
          const normalizedPosition = chartPoint(normalize(encode2D(sample, "before")));
          const isSelected = sample.id === selectedSampleId;
          return <g key={`raw-${sample.id}`} className={`p3-map__normalization${isSelected ? " is-selected" : ""}`} style={{ "--p3-point-color": CLASS_VISUALS[sample.classId].color } as CSSProperties}>
            {isSelected ? <line className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={normalizedPosition.x} y2={normalizedPosition.y} /> : null}
            <circle className="p3-map__raw-point" cx={rawPosition.x} cy={rawPosition.y} r={isSelected ? 4 : 2.8} />
          </g>;
        }) : null}

        {stage === 1 ? prototypeCalculations.map(({ classId, rawMean, prototype }) => {
          const meanPosition = chartPoint(rawMean);
          const prototypePosition = chartPoint(prototype);
          return <g key={`calculation-${classId}`} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            <line className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={prototypePosition.x} y2={prototypePosition.y} />
            <circle className="p3-map__raw-mean" cx={meanPosition.x} cy={meanPosition.y} r="10" />
          </g>;
        }) : null}

        {showPrototypes && stage !== 1 ? prototypeCalculations.map(({ classId, prototype }) => {
          const position = chartPoint(prototype);
          return <line key={`prototype-ray-${classId}`} className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={position.x} y2={position.y} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties} />;
        }) : null}

        {showQuery ? (() => {
          const position = chartPoint(queryFeature);
          return <line className="p3-map__radial-ray p3-map__radial-ray--query" x1={chartOrigin.x} y1={chartOrigin.y} x2={position.x} y2={position.y} />;
        })() : null}

        {showDecision ? queryComparisons.map(({ classId }, index) => {
          const queryPosition = chartPoint(queryFeature);
          const prototypePosition = chartPoint(prototypeByClass.get(classId)!);
          return <g key={`comparison-${classId}`} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            <line className={`p3-map__distance${index === 0 ? " is-nearest" : ""}`} x1={queryPosition.x} y1={queryPosition.y} x2={prototypePosition.x} y2={prototypePosition.y} />
            <path className={`p3-map__angle${index === 0 ? " is-nearest" : ""}`} d={shortestAngleArc(queryFeature, prototypeByClass.get(classId)!, 38 + index * 17)} />
          </g>;
        }) : null}

        {normalizedPoints.map(({ sample, position }) => {
          const isSelected = sample.id === selectedSampleId;
          const color = CLASS_VISUALS[sample.classId].color;
          return <g
            key={sample.id}
            className={`p3-map__point${isSelected ? " is-selected" : ""}`}
            tabIndex={0}
            role="button"
            aria-label={`${CLASS_VISUALS[sample.classId].displayLabel} 已保留样本 ${sample.id}；选择以联动左栏身份`}
            onClick={() => onSelectSample(sample.id)}
            onKeyDown={(event) => activatePoint(event, sample.id)}
          >
            <ClassFeatureMarker className="p3-map__normalized-point" classId={sample.classId} x={position.x} y={position.y} radius={isSelected ? 4.4 : 3.3} selected={false} fillOverride={color} />
            <title>{`${sample.id} · P_BEFORE[${sample.classId}] · z_p`}</title>
          </g>;
        })}

        {showPrototypes ? prototypeCalculations.map(({ classId, prototype }) => {
          const position = chartPoint(prototype);
          const label = prototypeLabelPlacement[classId];
          return <g key={`prototype-${classId}`}>
            <path className={`p3-map__prototype p3-map__prototype--${classId}`} d={`M ${position.x - 7} ${position.y - 7} h 14 v 14 h -14 Z`} />
            <text className="p3-map__direct-label" x={position.x + label.dx} y={position.y + label.dy} textAnchor={label.anchor}>μ{CLASS_VISUALS[classId].index}</text>
          </g>;
        }) : null}

        {stage === 1 ? prototypeCalculations.map(({ classId, rawMean }) => {
          const position = chartPoint(rawMean);
          const label = meanLabelPlacement[classId];
          return <text key={`mean-label-${classId}`} className="p3-map__direct-label p3-map__direct-label--mean" x={position.x + label.dx} y={position.y + label.dy} textAnchor={label.anchor}>z̄{CLASS_VISUALS[classId].index}</text>;
        }) : null}

        {stage === 2 ? (() => {
          const rawPosition = chartPoint(queryRawFeature);
          return <g className="p3-map__query-normalization">
            <circle cx={rawPosition.x} cy={rawPosition.y} r="4" />
          </g>;
        })() : null}

        {showQuery ? (() => {
          const position = chartPoint(queryFeature);
          return <g>
            <path className="p3-map__query" d={`M ${position.x} ${position.y - 9} l 9 9 l -9 9 l -9 -9 Z`} />
            <text className="p3-map__direct-label p3-map__direct-label--query" x={position.x + 17} y={position.y - 12}>zq</text>
          </g>;
        })() : null}

        {stage === 0 ? (() => {
          const position = normalizedPoints.find(({ sample }) => sample.id === selectedSampleId)!.position;
          return <text className="p3-map__direct-label p3-map__direct-label--sample" x={position.x + 12} y={position.y - 10}>{selectedSample.id}</text>;
        })() : null}

        <circle className="p3-map__origin" cx={chartOrigin.x} cy={chartOrigin.y} r="3.2" />
      </svg>
      <div className="p3-map__legend">
        <span><i className="p3-map__legend-unit-circle" />虚线圆：单位圆（‖z‖₂=1）</span>
        {stage === 0 ? <span><i className="p3-map__legend-raw" />未单位化特征 f<sub>Θ</sub>(p)</span> : null}
        <span><i className="p3-map__legend-dot" />外圈彩色点：12 个单位化 Exemplar 特征 z<sub>p</sub></span>
        {stage === 1 ? <span><i className="p3-map__legend-raw-mean" />圆内均值 z̄<sub>y</sub></span> : null}
        {showPrototypes ? <span><i className="p3-map__legend-prototype" />方框：类别 Prototype μ<sub>y</sub></span> : null}
        {stage >= 1 ? <span><i className="p3-map__legend-ray" />圆心径向虚线：单位向量方向</span> : null}
        {stage === 2 ? <span><i className="p3-map__legend-query-raw" />空心点：归一化前的 Query 特征 f<sub>Θ</sub>(x<sub>q</sub>)</span> : null}
        {showQuery ? <span><i className="p3-map__legend-query" />菱形：单位化 Query 特征 z<sub>q</sub></span> : null}
        {showDecision ? <span><i className="p3-map__legend-angle" />彩色圆弧：z<sub>q</sub> 与 μ<sub>y</sub> 的夹角 θ<sub>y</sub></span> : null}
        {showDecision ? <span><i className="p3-map__legend-distance" />Query 到 Prototype 的距离</span> : null}
      </div>
    </div>
  );
}

const stageDescriptions = [
  "P_BEFORE 中三类各有 4 张已保留图片。每张图片经同一个固定 Feature Extractor 得到 fΘ(p)，再各自做 L2 归一化得到 z_p。",
  "每类先对 4 个 z_p 求算术均值 z̄_y（圆内小圆），让一组样本共同形成类别代表；再把 z̄_y 归一化为单位圆上的 Prototype μ_y（方框）。",
  "新的 Query x_q 不是十二张 Exemplar 之一。它经过同一个固定 Feature Extractor，并归一化为 z_q；三个 Prototype 保持不变。",
  "分别计算 z_q 到三个 μ_y 的欧氏距离；最小项、最小夹角、图中高亮连线与最终预测来自同一组实际二维向量。",
] as const;

const stageNarratives = [
  [
    "代表图片现在仍是图像；要和之后到来的 Query 比较，先要让它们经过 P2 认识过的同一个特征提取器。",
    "每张图得到特征后再做 L2 归一化，于是不同图片进入同一个可比较的单位特征空间。",
  ],
  [
    "现在，每个类别都有了一组特征点。但单张图片只反映这个类别中的一个样本，直接依据某个样本与 Query 的相似程度分类，容易受到个体差异的影响。",
    "我们希望比较的是 Query 与整个类别哪个更相似，因此自然想到：先求同类 Exemplars 特征的均值，再将均值归一化，形成类别 Prototype。",
    "这样，后面只需比较 Query 与各类别原型的相似程度。",
  ],
  [
    "三个类别代表已经形成。现在把新的 Query 交给同一个特征提取器，并进行同样的 L2 归一化。",
    "相同的表示与归一化规则，让 Query 和三个 Prototype 可以在同一空间里直接比较。",
  ],
  [
    "Query 与三个类别代表都已就位。最后比较它到各 Prototype 的距离，最近者给出预测类别。",
    "因为这些向量都在单位圆上，也可以借助夹角理解距离；这次推断只读取当前模型与 Exemplars，不改变它们。",
  ],
] as const;

const stageTakeaways = [
  "十二张原始图片已变成三组可比较的单位特征；还没有计算 Prototype，也没有输入 Query。",
  "同类样本不再各自承担分类判断：它们的均值共同形成一个类别 Prototype。",
  "三个 Prototype 和一个经过相同处理的 Query 已经满足比较条件。",
  `本次 Query 最近的类别原型属于 ${CLASS_VISUALS[predictedClass].displayLabel}，因此输出这一预测。`,
] as const;

export function PageThree({ onContinue }: { onContinue?: () => void } = {}) {
  const [stage, setStage] = useState(0);
  const [selectedSampleId, setSelectedSampleId] = useState(P_BEFORE.A[0].id);
  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];

  return (
    <article className="tutorial-page icarl-page icarl-page--p3">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 03</span><i /> PROTOTYPE CLASSIFICATION</div>
        <h1>已选代表图片怎样<br className="p3-title-break" />完成一次预测？</h1>
        <p>面对旧类完整数据不能一直保留，我们先想到只保存少量代表图片；P2 又看到了图像怎样经特征提取器成为向量。现在先假定代表图片已经选好，检验它们能否帮助我们识别一个新的 Query。</p>
      </header>

      <aside className="p3-assumption-strip" aria-label="本页已有条件与当前问题">
        <div><span>已经具备</span><p>三类已选好的 Exemplars，以及训练完成、当前固定的 Feature Extractor <b>φ<sub>Θ fixed</sub></b>。</p></div>
        <div><span>现在要回答</span><p>当一张新的 Query 图片 <b>x<sub>q</sub></b> 到来，怎样从这些代表图片得到一次类别预测？</p></div>
      </aside>

      <GuidedStepControls steps={steps} current={stage} onChange={setStage} label="Page 3 最近原型预测教学步骤" />

      <section className="p3-reasoning" aria-live="polite" aria-label={`第 ${stage + 1} 步的推理引导`}>
        <span className="p3-reasoning__index">0{stage + 1}</span>
        <div><span className="eyebrow">为什么进行这一步</span>{stageNarratives[stage].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="p3-workbench" aria-label="已保留图片、特征空间和当前预测规则">
        <section className="panel p3-source">
          <div className="panel-heading"><div><span className="eyebrow">SOURCE</span><h2>已保留的 Exemplars</h2></div><span className="p3-mini-count">{exemplars.length} 张</span></div>
          <p className="p3-source__intro">这里读取共享运行时的 P_BEFORE：三类各 4 张。点选图片编号，可在图中追踪对应特征；下一页将用独立的单类示例解释代表怎样选出。</p>
          <div className="p3-source__samples p3-source__samples--grouped">
            {classIds.map((classId) => {
              const classSamples = exemplarByClass.get(classId)!;
              return <section className="p3-source__group" key={classId} style={{ "--p3-group-color": CLASS_VISUALS[classId].color } as CSSProperties}>
                <div><b>{CLASS_VISUALS[classId].displayLabel}</b><span>P<sub>{CLASS_VISUALS[classId].index}</sub> · {classSamples.length} 张</span></div>
                <div>{classSamples.map((sample) => (
                  <button key={sample.id} type="button" className={`p3-source__sample${selectedSampleId === sample.id ? " is-selected" : ""}`} onClick={() => setSelectedSampleId(sample.id)} aria-pressed={selectedSampleId === sample.id} title={`${CLASS_VISUALS[sample.classId].displayLabel} · ${sample.id}`}>
                    <i aria-hidden="true" style={{ color: CLASS_VISUALS[sample.classId].color }}>{CLASS_VISUALS[sample.classId].glyph}</i><b>{sample.id}</b>
                  </button>
                ))}</div>
              </section>;
            })}
          </div>
          <div className="p3-source__mapping" aria-label={`已保留图片 ${selectedSample.id} 经固定特征提取器得到单位化特征`}>
            <span>IMAGE · {selectedSample.id}</span><b>φ<sub>Θ fixed</sub></b><span className="p3-source__mapping-line" aria-hidden="true" /><strong>f<sub>Θ</sub>(p) → z<sub>p</sub></strong><small>同一图片身份；只计算表示，不更新 Θ</small>
          </div>
          {stage >= 2 ? <div className="p3-query-source"><span>本页新增 · QUERY</span><b>x<sub>q</sub></b><p>新的待分类图片，不属于上面十二张 Exemplar。</p></div> : null}
        </section>

        <section className="panel p3-space-panel">
          <div className="panel-heading"><div><span className="eyebrow">FEATURE SPACE</span><h2>单位特征、Prototype 与 Query</h2></div><span className="p3-phase-badge">STEP {stage + 1} / 4</span></div>
          <FeatureMap stage={stage} selectedSampleId={selectedSampleId} onSelectSample={setSelectedSampleId} />
          <div className="p3-current-caption" aria-live="polite">{stageDescriptions[stage]}</div>
        </section>

        <aside className="panel p3-rule-panel">
          <div className="panel-heading"><div><span className="eyebrow">CURRENT RULE</span><h2>本步实际计算</h2></div></div>
          {stage === 0 ? <div className="p3-rule-stack">
            <div className="p3-rule-card is-active"><span>01 · 提取特征</span><strong>f<sub>Θ</sub>(p) = φ<sub>Θ fixed</sub>(p)</strong></div>
            <div className="p3-rule-card is-active"><span>02 · 每张图各自单位化</span><strong>z<sub>p</sub> = f<sub>Θ</sub>(p) / ‖f<sub>Θ</sub>(p)‖<sub>2</sub></strong></div>
            <p className="p3-state-boundary">输出：三组单位化 Exemplar Features。<br />尚无 Prototype，尚无 Query。</p>
          </div> : null}
          {stage === 1 ? <div className="p3-rule-stack">
            <div className="p3-rule-card is-active"><span>01 · 四个单位特征求均值</span><strong>z̄<sub>y</sub> = (1 / |P<sub>y</sub>|) Σ z<sub>p</sub></strong></div>
            <div className="p3-rule-card is-active"><span>02 · 均值重新单位化</span><strong>μ<sub>y</sub> = z̄<sub>y</sub> / ‖z̄<sub>y</sub>‖<sub>2</sub></strong></div>
            <div className="p3-mean-norm-list" aria-label="三类均值重新单位化的实际范数">
              {prototypeCalculations.map(({ classId, rawMean }) => <span key={classId}>Class {CLASS_VISUALS[classId].index}<b>‖z̄<sub>{CLASS_VISUALS[classId].index}</sub>‖={Math.hypot(rawMean[0], rawMean[1]).toFixed(3)} → ‖μ<sub>{CLASS_VISUALS[classId].index}</sub>‖=1</b></span>)}
            </div>
            <p className="p3-state-boundary">圆内小圆是 z̄<sub>y</sub>，径向线终点的方框才是用于分类的 μ<sub>y</sub>。</p>
          </div> : null}
          {stage === 2 ? <div className="p3-rule-stack">
            <div className="p3-rule-card is-active"><span>01 · 使用同一个固定模型</span><strong>f<sub>Θ</sub>(x<sub>q</sub>) = φ<sub>Θ fixed</sub>(x<sub>q</sub>)</strong></div>
            <div className="p3-rule-card is-active"><span>02 · Query 单位化</span><strong>z<sub>q</sub> = f<sub>Θ</sub>(x<sub>q</sub>) / ‖f<sub>Θ</sub>(x<sub>q</sub>)‖<sub>2</sub></strong></div>
            <p className="p3-state-boundary">三个 μ<sub>y</sub> 保持不变；此处不会把 Query 加入 Memory。</p>
          </div> : null}
          {stage === 3 ? <>
            <div className="p3-rule-stack">
              <div className="p3-rule-card is-active"><span>最近 Prototype 规则</span><strong>d<sub>y</sub> = ‖z<sub>q</sub> − μ<sub>y</sub>‖<sub>2</sub></strong><strong>ŷ = arg min<sub>y</sub> d<sub>y</sub></strong></div>
            </div>
            <div className="p3-distance-list"><span className="eyebrow">实际二维教学向量</span>{queryComparisons.map(({ classId, distance, angle }, index) => <div key={classId} className={index === 0 ? "is-nearest" : ""}><span>μ<sub>{CLASS_VISUALS[classId].index}</sub></span><b>d={distance.toFixed(3)}</b><em>θ={angle.toFixed(1)}°</em><small>{index === 0 ? "最近" : ""}</small></div>)}<strong className="p3-prediction">预测 ŷ：{CLASS_VISUALS[predictedClass].displayLabel}</strong></div>
            <details className="p3-normalized-note"><summary>为什么最近距离也对应最小夹角？</summary><div><p>因为 z<sub>q</sub> 与 μ<sub>y</sub> 都是单位向量：</p><code>d<sub>y</sub><sup>2</sup> = 2 − 2z<sub>q</sub><sup>T</sup>μ<sub>y</sub> = 2 − 2cos θ<sub>y</sub></code><p>论文的正式规则是最近 Prototype；夹角只是单位化条件下的等价几何解释。</p></div></details>
          </> : null}
        </aside>
      </section>

      <section className="p3-concept-note" aria-live="polite">
        <span className="p3-concept-note__index">0{stage + 1}</span>
        <div><span className="eyebrow">阶段终态</span><p>{stageTakeaways[stage]}</p></div>
      </section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 04</span><p>我们已经能用当前特征提取器和已选 Exemplars 完成预测，但刚才暂时假定它们已经存在。那么我们要怎么找到最典型的代表呢？找到之后又要怎么管理这些代表呢？</p></div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>筛选与管理代表样本 <b aria-hidden="true">→</b></button> : null}
      </footer>
    </article>
  );
}
