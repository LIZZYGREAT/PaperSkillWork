import { useState } from 'react';
import type { SceneProps } from './types';

type Mode = 'plain' | 'uniform' | 'ewc';

const modes: Record<Mode, { label: string; signal: string; result: string; risk: string }> = {
  plain: { label: '只按 B 更新', signal: '∇Lᴮ', result: '参数顺着新任务目标移动。', risk: '梯度没有旧任务约束信号，可能损害 A。' },
  uniform: { label: '统一二次约束', signal: '∇Lᴮ + κ(θ−θ*)', result: '所有参数离开旧解都付相同代价。', risk: '重要和不重要参数都被同样限制，B 可能学不充分。' },
  ewc: { label: '按 Fisher 加权', signal: '∇Lᴮ + λF⊙(θ−θ*)', result: '不同参数的偏移成本由旧任务重要性调节。', risk: '要估计 F；保护强弱仍受 λ 和近似质量影响。' },
};

export function SceneProblem(_props: SceneProps) {
  const [mode, setMode] = useState<Mode>('plain');
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">交互 · 目标信号对照</div>
        <div className="segmented-control" role="group" aria-label="选择参数更新目标">
          {(Object.keys(modes) as Mode[]).map((key) => (
            <button key={key} aria-pressed={mode === key} className={mode === key ? 'segment is-active' : 'segment'} onClick={() => setMode(key)}>{modes[key].label}</button>
          ))}
        </div>
        <div className="signal-map" aria-live="polite">
          <div className="signal-node"><span>旧任务 A</span><strong>θ*</strong><small>只在后续约束中成为参考</small></div>
          <div className="signal-center"><span>当前共享参数</span><strong>θ</strong><code>{modes[mode].signal}</code></div>
          <div className="signal-node is-current"><span>新任务 B</span><strong>Lᴮ</strong><small>当前样本产生学习信号</small></div>
        </div>
        <div className="feedback-panel"><strong>{modes[mode].result}</strong><p>{modes[mode].risk}</p></div>
        <p className="source-note">图示表达 Figure 1 的机制关系，不是论文测得的参数轨迹或精度曲线。</p>
      </section>
      <section className="explain-grid">
        <article><span className="mini-label">如果只优化 B</span><p>当前网络会尽量降低 <code>Lᴮ</code>，但优化目标里没有 A 的误差信号。</p></article>
        <article><span className="mini-label">如果处处一样硬</span><p>即使某些参数对 A 影响很小，它们也会被同样限制，减少新任务可用的自由度。</p></article>
      </section>
    </div>
  );
}
