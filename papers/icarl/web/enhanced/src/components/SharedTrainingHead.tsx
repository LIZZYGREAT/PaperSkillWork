import { useEffect, useState, type CSSProperties } from "react";
import { sampleById } from "../data/icarl-runtime";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
import { SampleToken } from "./SampleToken";

const outputStrengths = [82, 61, 74, 52, 68, 58, 77, 48, 71, 56];

function FeatureExtractorDiagram() {
  return <div className="p2-network__extractor" data-shared-backbone>
    <div className="p2-network__extractor-title"><span className="p2-eyebrow">SHARED FEATURE EXTRACTOR</span><strong>φ<sub>Θ</sub> · 同一组可训练参数</strong></div>
    <svg className="p2-backbone-diagram" viewBox="0 0 430 180" role="img" aria-label="输入图像依次通过共享卷积特征块与聚合，得到特征表示 z">
      <title>共享特征提取器</title>
      <desc>图像经过连续的卷积特征块与聚合，得到高维表示。图形只表达共享的数据路径，不对应论文实验网络的精确层数。</desc>
      <defs><marker id="p2-backbone-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8" /></marker></defs>
      <g className="p2-backbone-stage p2-backbone-stage--image">
        <rect x="12" y="48" width="62" height="84" rx="6" /><path d="M22 112l14-19 11 10 13-22 8 13" /><circle cx="31" cy="70" r="6" /><text x="43" y="151" textAnchor="middle">image x</text>
      </g>
      <path className="p2-backbone-flow" d="M82 90H113" markerEnd="url(#p2-backbone-arrow)" />
      <g className="p2-backbone-stage p2-backbone-stage--maps">
        {[0, 1, 2, 3].map(index => <rect key={index} x={116 + index * 7} y={39 + index * 7} width="58" height="82" rx="4" />)}
        <text x="148" y="151" textAnchor="middle">卷积特征块</text>
      </g>
      <path className="p2-backbone-flow" d="M202 90H233" markerEnd="url(#p2-backbone-arrow)" />
      <g className="p2-backbone-stage p2-backbone-stage--deep">
        {[0, 1, 2].map(index => <rect key={index} x={236 + index * 7} y={54 + index * 7} width="43" height="60" rx="4" />)}
        <text x="260" y="151" textAnchor="middle">深层表示</text>
      </g>
      <path className="p2-backbone-flow" d="M301 90H330" markerEnd="url(#p2-backbone-arrow)" />
      <g className="p2-backbone-stage p2-backbone-stage--pool">
        <rect x="334" y="57" width="80" height="66" rx="8" />
        {[0, 1, 2, 3, 4, 5].map(index => <line key={index} x1={348 + index * 10} y1={106 - (index % 3) * 13} x2={348 + index * 10} y2="112" />)}
        <text x="374" y="151" textAnchor="middle">聚合为向量</text>
      </g>
    </svg>
    <p>共享骨架持续更新 Θ；新类别到来时不会复制第二个特征提取器。</p>
  </div>;
}

export function SharedTrainingHead() {
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const target = expanded ? 10 : 5;
    if (reducedMotion) {
      setVisibleCount(target);
      return;
    }
    if (visibleCount === target) return;
    const direction = target > visibleCount ? 1 : -1;
    const timer = window.setTimeout(() => setVisibleCount(value => value + direction), 95);
    return () => window.clearTimeout(timer);
  }, [expanded, reducedMotion, visibleCount]);

  return <section className="p2-head-panel panel">
    <div className="p2-panel-heading">
      <div><span className="p2-eyebrow">共享骨架 + 一个可扩展输出层</span><h2>新类别到来，扩展的是逐类训练输出</h2></div>
      <button className="p2-quiet-action" type="button" aria-expanded={expanded} aria-controls="p2-training-network" onClick={() => setExpanded(value => !value)}>{expanded ? "重置为第一批" : "加入下一批"}</button>
    </div>

    <div className="p2-expansion-status" role="status" aria-live="polite">
      <strong>{visibleCount} 个输出节点</strong><span>C1–C{visibleCount} · {expanded ? (visibleCount < 10 ? "正在接入第 2 批" : "第 2 批已加入") : "第 1 批"}</span>
    </div>

    <div className={`p2-network${expanded ? " is-expanded" : ""}`} id="p2-training-network" aria-label={`同一个共享特征提取器连接一个覆盖 C1 到 C${visibleCount} 的训练输出层`}>
      <div className="p2-network__input"><span className="p2-eyebrow">INPUT</span><SampleToken sample={sampleById("x_7")} role="raw" /><small>同一张 image x</small></div>
      <span className="p2-network__flow-arrow" aria-hidden="true">→</span>
      <FeatureExtractorDiagram />
      <span className="p2-network__flow-arrow" aria-hidden="true">→</span>
      <div className="p2-network__representation">
        <span className="p2-eyebrow">REPRESENTATION</span>
        <div className="p2-representation-vector" aria-hidden="true">{[38, 66, 47, 82, 56, 72, 43, 61].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
        <b>z = φ<sub>Θ</sub>(x)</b><small>同一个 z 送往每个类别权重</small>
      </div>
      <span className="p2-network__flow-arrow p2-network__flow-arrow--output" aria-hidden="true">→</span>
      <div className="p2-output-layer" aria-label={`训练输出层当前包含 ${visibleCount} 个类别节点`}>
        <div className="p2-output-layer__heading"><span className="p2-eyebrow">ONE TRAINING OUTPUT LAYER</span><strong>C1–C{visibleCount}</strong></div>
        <div className="p2-output-layer__bus" aria-hidden="true"><i /></div>
        {Array.from({ length: 10 }, (_, index) => {
          const number = index + 1;
          const initialTop = number <= 5 ? 78 + number * 66 : 408;
          const expandedTop = 78 + number * 34;
          const isNew = number > 5;
          return <div key={number} className={`p2-output-row${isNew ? " is-new" : ""}`} style={{ "--initial-top": `${initialTop}px`, "--expanded-top": `${expandedTop}px`, "--node-delay": `${(number - 6) * 75}ms` } as CSSProperties} aria-hidden={number > visibleCount}>
            <i className="p2-output-row__branch" aria-hidden="true" />
            <span className="p2-output-row__weight">w<sub>{number}</sub></span>
            <span className="p2-output-row__response"><b>g<sub>{number}</sub>(x)</b><i style={{ "--response": `${outputStrengths[index]}%` } as CSSProperties} /><em>σ</em></span>
          </div>;
        })}
      </div>
    </div>

    <div className="p2-network-notes">
      <p><strong>保持不变：</strong>image x、共享 φ<sub>Θ</sub> 与表示 z 沿同一条路径流动。</p>
      <p><strong>发生变化：</strong>输出层从 w<sub>1</sub>…w<sub>5</sub> 扩展到 w<sub>1</sub>…w<sub>10</sub>，每个权重产生对应的 g<sub>y</sub>(x)。</p>
    </div>
    <div className="p2-head-boundary"><strong>训练输出 ≠ 最终预测</strong><p>这些 sigmoid 响应用于学习表示；iCaRL 最终根据样本到 exemplar 类均值的距离分类。</p></div>
  </section>;
}
