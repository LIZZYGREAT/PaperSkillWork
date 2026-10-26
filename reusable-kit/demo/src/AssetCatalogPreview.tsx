import { useState } from 'react';
import { DiagramFlow, type DiagramSpec } from '../../foundation/layout/DiagramFlow';
import { FeatureAggregation } from '../../foundation/visual-parts/FeatureAggregation';
import { FeatureBlocks } from '../../foundation/visual-parts/FeatureBlocks';
import { FlowConnector } from '../../foundation/visual-parts/FlowConnector';
import { RepresentationVector } from '../../foundation/visual-parts/RepresentationVector';
import { ResponseMeter } from '../../foundation/visual-parts/ResponseMeter';
import { SampleToken } from '../../foundation/visual-parts/SampleToken';
import { SemanticMark } from '../../foundation/visual-parts/SemanticMark';
import { FormulaBlock } from '../../optional/formula/FormulaBlock';
import '../../foundation/styles/editorial.css';
import { LocalNetworkExample } from './examples/NetworkExamples';
import { ForwardTimelineExample } from './examples/ForwardTimelineExample';

const relationSpec: DiagramSpec = {
  columns: 3,
  nodes: [
    { id: 'sample', title: '样本 x', role: 'input', column: 1, row: 1 },
    { id: 'representation', title: '表示 z', role: 'model', column: 2, row: 1 },
    { id: 'score', title: '得分 g(x)', role: 'output', column: 3, row: 1 },
  ],
  edges: [
    { id: 'sample-to-representation', from: 'sample', to: 'representation', kind: 'data', label: '提取特征' },
    { id: 'representation-to-score', from: 'representation', to: 'score', kind: 'data', label: '计算得分' },
  ],
  note: '数值和关系仅用于说明图形接口。',
};

function ResponsePreview() {
  const [score, setScore] = useState(-1.5);
  return <div className="asset-catalog__response-preview">
    <ResponseMeter value={score} min={-4} max={4} label="演示原始得分" />
    <label>调整演示得分<input aria-label="调整演示得分" type="range" min="-4" max="4" step="0.5" value={score} onChange={event => setScore(Number(event.target.value))} /></label>
  </div>;
}

/** Render the real Kit component or an existing interactive composition. */
export function AssetCatalogPreview({ name }: { name: string }) {
  switch (name) {
    case 'MiniNetworkGlyph':
      return <LocalNetworkExample />;
    case 'useAnimationTimeline':
      return <ForwardTimelineExample />;
    case 'SampleToken':
      return <SampleToken sampleId="catalog-sample" label="合成输入样本 x₁"><span aria-hidden="true">x₁</span></SampleToken>;
    case 'FeatureBlocks':
      return <FeatureBlocks label="演示特征块" depth={3} active />;
    case 'FeatureAggregation':
      return <FeatureAggregation label="演示聚合步骤" active />;
    case 'RepresentationVector':
      return <RepresentationVector label="演示表示 z" values={[0.8, -0.3, 0.6]} />;
    case 'ResponseMeter':
      return <ResponsePreview />;
    case 'FlowConnector':
      return <FlowConnector kind="gradient" label="演示梯度方向" />;
    case 'SemanticMark':
      return <div className="asset-catalog__mark-preview"><SemanticMark state="frozen">冻结参照</SemanticMark><SemanticMark state="trainable">可训练模型</SemanticMark></div>;
    case 'DiagramFlow':
      return <DiagramFlow label="样本、表示与得分关系" spec={relationSpec} />;
    case 'FormulaBlock':
      return <FormulaBlock formula="g(x) = wᵀz" accessibleLabel="g of x equals w transpose z" description="选择符号查看合成示例的解释。" terms={[
        { id: 'w', label: 'w', explanation: '示意权重向量。' },
        { id: 'z', label: 'z', explanation: '示意中间表示。' },
      ]} />;
    case 'EditorialTypography':
      return <div className="asset-catalog__editorial-preview"><p className="rk-caption">合成版式片段</p><h4 className="rk-headline">让机制<mark>看得见</mark></h4><p className="rk-lead">标题和图文层次由论文场景决定。</p></div>;
    default:
      return null;
  }
}
