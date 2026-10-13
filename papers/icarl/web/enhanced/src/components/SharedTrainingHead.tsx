import { useState, type CSSProperties } from "react";
import { SampleToken } from "./SampleToken";
import { sampleById } from "../data/icarl-runtime";

export function SharedTrainingHead() {
  const [expanded, setExpanded] = useState(false);
  const count = expanded ? 10 : 5;
  return <section className="p2-head-panel panel">
    <div className="p2-panel-heading">
      <div><span className="p2-eyebrow">共享骨架 · 可扩展的训练输出层</span><h2>同一个表示，连接更多类别节点</h2></div>
      <button className="p2-quiet-action" type="button" aria-expanded={expanded} aria-controls="p2-training-outputs" onClick={() => setExpanded(value => !value)}>{expanded ? "重置为第一批" : "加入下一批"}</button>
    </div>
    <div className="p2-expansion-status" role="status"><strong>{count} 个输出节点</strong><span>C1–C{count} · {expanded ? "第 2 批已加入" : "第 1 批"}</span></div>
    <div className={`p2-network${expanded ? " is-expanded" : ""}`} aria-label={`同一共享特征提取器，训练输出层覆盖 C1 到 C${count}`}>
      <div className="p2-network__shared" data-shared-backbone>
        <div className="p2-network__input"><span>输入 image x</span><SampleToken sample={sampleById("x_7")} role="raw" compact /></div>
        <span className="p2-network__down" aria-hidden="true">↓</span>
        <div className="p2-network__backbone">
          <span className="p2-eyebrow">SHARED BACKBONE</span>
          <svg viewBox="0 0 180 100" role="img" aria-label="持续使用的同一共享网络骨架">
            <title>同一个 feature extractor</title>
            {[0, 1].flatMap(layer => [0, 1, 2].flatMap(from => [0, 1, 2].map(to => <line key={`${layer}-${from}-${to}`} x1={30 + layer * 60} y1={20 + from * 30} x2={90 + layer * 60} y2={20 + to * 30} />)))}
            {[0, 1, 2].flatMap(layer => [0, 1, 2].map(row => <circle key={`${layer}-${row}`} cx={30 + layer * 60} cy={20 + row * 30} r="7" />))}
          </svg>
          <strong>φ<sub>Θ</sub> · 特征提取器</strong><small>同一个组件 · 参数持续学习</small>
        </div>
        <span className="p2-network__down" aria-hidden="true">↓</span>
        <div className="p2-network__representation"><b>z = φ<sub>Θ</sub>(x)</b><small>一个共享表示</small></div>
      </div>
      <div className="p2-network__arrow" aria-hidden="true">→</div>
      <div className="p2-network__head" id="p2-training-outputs">
        <span className="p2-eyebrow">TRAINING OUTPUTS</span>
        <div className="p2-output-columns">
          <div className="p2-output-column"><b>C1–C5</b><div className="p2-output-nodes">{Array.from({ length: 5 }, (_, index) => <span key={index} aria-label={`类别 ${index+1} 的响应 g${index+1}`}>g<sub>{index+1}</sub></span>)}</div></div>
          <div className={`p2-output-column p2-output-column--new${expanded ? " is-added" : ""}`}>
            {expanded ? <><b>C6–C10 · 新增</b><div className="p2-output-nodes p2-output-nodes--new">{Array.from({ length: 5 }, (_, index) => <span key={index+6} style={{ "--node-delay": `${index * 70}ms` } as CSSProperties} aria-label={`类别 ${index+6} 的响应 g${index+6}`}>g<sub>{index+6}</sub></span>)}</div></> : <p className="p2-output-placeholder">下一批到来时<br />追加类别节点</p>}
          </div>
        </div>
        <small>各节点读取同一个 z</small>
      </div>
    </div>
    <div className="p2-head-equation"><span>z</span><i>→</i><span>w<sub>y</sub><sup>⊤</sup>z</span><i>→</i><span>sigmoid</span><i>→</i><strong>g<sub>y</sub>(x)</strong></div>
    <p className="p2-head-copy">{expanded ? "新类别加入了 5 组对应的输出权重，原有节点继续保留。" : "第 1 批覆盖 C1–C5，每类拥有对应的输出权重与 sigmoid 响应。"}前面的特征提取器始终是同一个共享学习器，参数会继续更新。</p>
    <div className="p2-head-boundary"><strong>训练输出 ≠ 最终预测</strong><p>iCaRL 最终根据样本到 exemplar 类均值的距离进行分类，不取 sigmoid 输出中最大的类别。</p></div>
  </section>;
}
