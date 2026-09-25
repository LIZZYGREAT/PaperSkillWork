import type { SceneProps } from './types';

const protocol = [
  ['任务构造', '每个任务使用一组固定的随机像素排列；同一任务内的图像共享该置换。'],
  ['数据流', '任务依次训练；完成当前任务后，后续任务不再用旧任务样本训练。'],
  ['Figure 2A', '两层、每层 400 单元的全连接 ReLU 网络；每个数据集训练 20 个 epoch。'],
  ['对照方法', 'SGD、均匀二次约束与 EWC；另一面板比较 EWC 和 SGD + dropout。'],
];

export function SceneMNISTProtocol(_props: SceneProps) {
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">实验设计 · Permuted MNIST</div>
        <div className="protocol-cards">
          {protocol.map(([label, text], index) => <article key={label}><span className="protocol-index">{String(index + 1).padStart(2, '0')}</span><div><h3>{label}</h3><p>{text}</p></div></article>)}
        </div>
        <div className="protocol-note"><strong>比较前先对齐条件</strong><p>任务是输入映射不同的 MNIST 分类任务。Figure 2 的性能对照检验连续学习表现；任务数增加时的曲线与 Fisher overlap 属于不同分析。</p></div>
        <p className="source-note">协议依据论文 §2.1、Figure 2 与 Appendix 4.1。此处不补录图中未逐项列出的推测数值。</p>
      </section>
      <section className="explain-grid">
        <article><span className="mini-label">不要误读“置换”</span><p>固定是指任务内所有图像使用同一置换，不是每一张图片重新抽一套排列。</p></article>
        <article><span className="mini-label">实验边界</span><p>这是小型图像分类基准，不是任意任务序列或大语言模型上的保证。</p></article>
      </section>
    </div>
  );
}
