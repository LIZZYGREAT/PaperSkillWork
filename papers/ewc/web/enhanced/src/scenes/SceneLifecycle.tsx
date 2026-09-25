import { useState } from 'react';
import type { SceneProps } from './types';

const states = [
  { title: '学习任务 A', input: 'D_A 批次', read: 'θ 当前参数', write: '优化器更新 θ', retained: '任务 A 结束后将产生参考状态' },
  { title: '估计重要性', input: '任务 A 的数据 / 目标', read: '收敛附近的 θ_A*', write: '估计对角 F_A', retained: 'F_A 与 θ_A* 对齐保存' },
  { title: '交接任务边界', input: '任务 A 完成', read: 'θ_A*、F_A', write: '追加到参考集合', retained: '旧锚点与 Fisher 固定供后续读取' },
  { title: '学习任务 B', input: 'D_B 当前批次', read: 'θ、θ_A*、F_A', write: '优化器仅更新 θ', retained: '参考快照不由这一步改写' },
  { title: '任务 B 结束', input: '任务 B 的目标与数据', read: '已有参考状态 + 当前 θ', write: '估计并追加 θ_B*、F_B', retained: '为下一个任务保留两段信息' },
];

export function SceneLifecycle(_props: SceneProps) {
  const [active, setActive] = useState(0);
  const stage = states[active];
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">交互 · 选择任务生命周期状态</div>
        <div className="stage-selector" role="group" aria-label="EWC 状态生命周期">
          {states.map((item, index) => <button key={item.title} type="button" aria-pressed={active === index} className={active === index ? 'stage-button is-active' : 'stage-button'} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</button>)}
        </div>
        <div className="lifecycle-state" aria-live="polite">
          <div><small>当前输入</small><strong>{stage.input}</strong></div>
          <div><small>读取状态</small><strong>{stage.read}</strong></div>
          <div><small>本阶段写入</small><strong>{stage.write}</strong></div>
          <div className="is-retained"><small>边界后保留</small><strong>{stage.retained}</strong></div>
        </div>
        <p className="source-note">这是通用 EWC 实现映射，状态变量名为讲解所用；原论文给出的是方法与公式，不是这份网页中的具体程序实现。</p>
      </section>
      <section className="explain-grid">
        <article><span className="mini-label">会被优化</span><p>任务 B 的训练步通过合并梯度更新当前参数 θ。</p></article>
        <article><span className="mini-label">作为参考读取</span><p>旧锚点 θ* 与对应 Fisher F 不在 B 的每一步里跟着 θ 一起漂移。</p></article>
      </section>
    </div>
  );
}
