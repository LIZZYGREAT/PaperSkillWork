import { useState } from 'react';
import { SampleToken } from '../../../foundation/visual-parts/SampleToken';
import { FeatureBlocks } from '../../../foundation/visual-parts/FeatureBlocks';
import { FeatureAggregation } from '../../../foundation/visual-parts/FeatureAggregation';
import { RepresentationVector } from '../../../foundation/visual-parts/RepresentationVector';
import { ResponseMeter } from '../../../foundation/visual-parts/ResponseMeter';
import { FlowConnector } from '../../../foundation/visual-parts/FlowConnector';
import { SemanticMark } from '../../../foundation/visual-parts/SemanticMark';
import { MiniNetworkGlyph } from '../../../foundation/neural-network/MiniNetworkGlyph';
import './parts-specimen.css';

export function PartsSpecimen() {
  const [value, setValue] = useState(-1.5);
  return <section className="parts-specimen" id="gallery-parts" aria-labelledby="parts-title">
    <header><h2 className="rk-type--heading-2" id="parts-title">从一个小件开始</h2><p className="rk-caption">可单独使用的绘图单元。每个小件自带默认样式；示意数据由此样张提供。</p></header>
    <div className="parts-specimen__shelf">
      <SampleToken sampleId="demo-a" label="示意样本 x"><span aria-hidden="true">▧</span></SampleToken>
      <FeatureBlocks label="卷积特征块" />
      <FeatureAggregation label="聚合" />
      <RepresentationVector values={[1, .5, -1]} label="表示 z" />
      <div className="parts-specimen__response"><ResponseMeter value={value} min={-4} max={4} label="得分 g" /><label>改变原始得分<input aria-label="改变原始得分" type="range" min="-4" max="4" step=".5" value={value} onChange={e => setValue(Number(e.target.value))} /></label></div>
    </div>
    <div className="parts-specimen__signals">{(['data', 'control', 'gradient', 'reference'] as const).map(kind => <FlowConnector key={kind} kind={kind} label={kind} />)}<SemanticMark state="frozen">参数冻结</SemanticMark><SemanticMark state="trainable">可训练</SemanticMark></div>
    <div className="parts-specimen__network"><div><h3 className="rk-type--heading-3">一个紧凑的学习器</h3><p className="rk-caption">同一个 Glyph 嵌入正文；节点和标签保持对齐。</p></div><MiniNetworkGlyph density="compact" layers={[{ id: 'in', label: '输入', nodeCount: 3 }, { id: 'h', label: '表示', nodeCount: 4 }, { id: 'out', label: '输出', nodeCount: 2 }]} connectAdjacent showDetails={false} label="紧凑学习器" description="3–4–2 教学示意" /></div>
    <details className="parts-specimen__inspect"><summary>放大检查同一套绘图规则</summary><MiniNetworkGlyph density="inspect" layers={[{ id: 'in', label: '输入', nodeCount: 3 }, { id: 'h', label: '隐藏层', nodeCount: 5 }, { id: 'out', label: '输出', nodeCount: 3 }]} connectAdjacent label="放大检查网络" description="完整 3–5–3 教学结构；放大不改变拓扑或文字字号。" /></details>
  </section>;
}
