import { useState } from 'react';
import type { SceneProps } from './types';

type EvidenceView = 'setup' | 'comparison' | 'overlap';

const views: Record<EvidenceView, { tab: string; heading: string; protocol: string[]; interpretation: string; limit: string }> = {
  setup: {
    tab: '任务构造', heading: '同一排列定义一个任务',
    protocol: ['数据：MNIST 手写数字', '任务：每个任务抽取一组固定随机像素置换，并用于该任务内所有图片', '模型：全连接网络 + ReLU；固定训练一段时间后，不再使用旧任务数据训练'],
    interpretation: '每个任务需要不同输入映射，因而测试网络在容量固定时能否保留较早映射。',
    limit: '这里不是任务之间每张图片都重新随机排列。',
  },
  comparison: {
    tab: '方法对照', heading: '保留旧任务与继续学习要同时看',
    protocol: ['Figure 2A：SGD、统一强度的二次约束、EWC', 'Figure 2B：EWC 与 SGD + dropout，观察任务数增加时的平均表现', '测试：在已见任务的测试集上报告曲线'],
    interpretation: '原文定性报告：B-only SGD 遗忘旧任务；统一约束更能保留 A，但妨碍 B；EWC 在所测设置中兼顾两者。',
    limit: '原文以曲线呈现，本页不从图上估读或补造精确数值。',
  },
  overlap: {
    tab: 'Fisher overlap', heading: '参数使用相似度不是准确率',
    protocol: ['Figure 2C：比较每层的 Fisher overlap', '置换区域：中央 8×8 与 26×26 像素区域', '网络：六层全连接网络，隐藏层宽度 100'],
    interpretation: '置换差异较大时，早期层 overlap 降低；输出邻近层仍可能重用，因为两任务输出仍是数字类别。',
    limit: 'Overlap 基于归一化 Fisher 矩阵的 Fréchet 距离构造，用来分析参数依赖关系，不是性能指标。',
  },
};

export function SceneMNIST(_props: SceneProps) {
  const [view, setView] = useState<EvidenceView>('setup');
  const active = views[view];
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">交互 · 检查实验主张</div>
        <div className="evidence-tabs" role="group" aria-label="选择 Permuted MNIST 证据">
          {(Object.keys(views) as EvidenceView[]).map((key) => <button key={key} className={view === key ? 'evidence-tab is-active' : 'evidence-tab'} aria-pressed={view === key} onClick={() => setView(key)}>{views[key].tab}</button>)}
        </div>
        <div className="experiment-card" aria-live="polite">
          <div className="experiment-heading"><span className="figure-chip">arXiv Figure 2</span><h3>{active.heading}</h3></div>
          <ul className="protocol-list">{active.protocol.map((item) => <li key={item}>{item}</li>)}</ul>
          <div className="supported-claim"><span>原文支持的结论</span><p>{active.interpretation}</p></div>
          <div className="evidence-boundary"><span>证据边界</span><p>{active.limit}</p></div>
        </div>
        <p className="source-note">这是对原文实验设置和图示结论的文字重述；浏览器没有运行 MNIST 网络。</p>
      </section>
    </div>
  );
}
