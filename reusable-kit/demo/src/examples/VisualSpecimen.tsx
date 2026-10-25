import { MiniNetworkGlyph } from '../../../foundation/neural-network/MiniNetworkGlyph';
import '../../../foundation/styles/editorial.css';
import './visual-specimen.css';

export function VisualSpecimen() {
  return <section id="gallery-specimen" className="visual-specimen" aria-label="视觉语言校准样张">
    <div className="visual-specimen__copy">
      <p className="rk-caption">PAPERSKILLWORK / VISUAL LANGUAGE</p>
      <h1 className="rk-headline">让机制<mark>看得见</mark>，<br />让理解接着发生。</h1>
      <p className="rk-lead">从一个样本、一条连接开始。用小而完整的视觉部件，组织属于这篇论文的解释。</p>
      <a href="#gallery-mini-network">探索小型网络 ↗</a>
    </div>
    <figure className="visual-specimen__figure">
      <figcaption><span>01 / 一次前向 · 教学示意</span><span className="rk-state" data-state="trainable">可训练模型</span></figcaption>
      <MiniNetworkGlyph layers={[{ id: 'x', label: '输入 x', nodeCount: 3 }, { id: 'h', label: '表示 h', nodeCount: 5 }, { id: 'y', label: '输出 y', nodeCount: 3 }]} connectAdjacent showDetails={false} label="三层教学网络" description="3–5–3 全连接示意；不对应论文实测架构。" />
      <div className="visual-specimen__steps"><span>01 读取输入</span><span>02 形成表示</span><span>03 产生输出</span></div>
      <div className="rk-figure-explanation"><math className="rk-equation" aria-label="h 等于 phi theta 作用于 x"><mi>h</mi><mo>=</mo><msub><mi>φ</mi><mi>θ</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo></math><p className="rk-caption">图形负责呈现；模型结构、数据和计算由当前场景提供。</p></div>
    </figure>
  </section>;
}
