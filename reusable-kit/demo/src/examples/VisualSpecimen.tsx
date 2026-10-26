import { MiniNetworkGlyph } from '../../../foundation/neural-network/MiniNetworkGlyph';
import { SampleToken } from '../../../foundation/visual-parts/SampleToken';
import { FeatureBlocks } from '../../../foundation/visual-parts/FeatureBlocks';
import { RepresentationVector } from '../../../foundation/visual-parts/RepresentationVector';
import '../../../foundation/styles/editorial.css';
import { SectionHeader } from '../../../compositions/section-header/SectionHeader';
import './visual-specimen.css';

export function VisualSpecimen() {
  return <section id="gallery-specimen" className="visual-specimen" aria-labelledby="visual-specimen-title">
    <SectionHeader eyebrow="视觉标本 · 并列素材" title="先看部件本身，不暗示它们组成一条计算链" lead="以下网络、样本、特征块与向量各自展示外观与标签。它们没有彼此连线，也不共享一次计算；完整关系请看上方的机制场景。" headingId="visual-specimen-title" />
    <div className="visual-specimen__grid">
      <figure className="visual-specimen__item visual-specimen__item--network">
        <figcaption><span>01 / 连接拓扑</span><strong>MiniNetworkGlyph</strong></figcaption>
        <MiniNetworkGlyph layers={[{ id: 'x', label: '输入', nodeCount: 3 }, { id: 'h', label: '隐藏层', nodeCount: 5 }, { id: 'y', label: '输出', nodeCount: 3 }]} connectAdjacent showDetails={false} label="3–5–3 网络拓扑样张" description="仅检查网络连线、节点和层标签的默认外观；不对应论文实测架构。" />
        <p>3–5–3 教学示意；连接集合由调用方提供。</p>
      </figure>
      <figure className="visual-specimen__item">
        <figcaption><span>02 / 输入对象</span><strong>SampleToken</strong></figcaption>
        <div className="visual-specimen__sample"><SampleToken sampleId="specimen-x" label="独立样本示意"><span aria-hidden="true">x₁</span></SampleToken></div>
        <p>保留单个示意输入的身份与标记。</p>
      </figure>
      <figure className="visual-specimen__item">
        <figcaption><span>03 / 中间特征</span><strong>FeatureBlocks</strong></figcaption>
        <div className="visual-specimen__features"><FeatureBlocks label="三块特征样张" depth={3} /></div>
        <p>用于表示空间特征；不隐含具体提取算法。</p>
      </figure>
      <figure className="visual-specimen__item">
        <figcaption><span>04 / 带符号向量</span><strong>RepresentationVector</strong></figcaption>
        <div className="visual-specimen__vector"><RepresentationVector values={[1, .5, -1]} label="向量 [1, 0.5, −1]" /></div>
        <p>正负方向与数值相配；尺度由调用方确定。</p>
      </figure>
    </div>
  </section>;
}
