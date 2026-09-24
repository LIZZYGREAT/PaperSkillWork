import { useState } from 'react';
import { calculateParameterPenalty, TOY_STATE } from '../data/session';
import type { SceneProps } from './types';

type MatrixMode = 'full' | 'diagonal';

export function SceneFisher({ session, onSessionChange }: SceneProps) {
  const [matrixMode, setMatrixMode] = useState<MatrixMode>('full');
  const { importance, penalty, restoringGradient } = calculateParameterPenalty(session);
  const full = [[4, 2], [2, 4]];
  const diagonal = [[4, 0], [0, 4]];
  const matrix = matrixMode === 'full' ? full : diagonal;
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">交互 · 改变偏移，观察惩罚</div>
        <div className="control-grid">
          <label className="field-label">选择一个玩具参数
            <select value={session.parameterIndex} onChange={(event) => onSessionChange({ parameterIndex: Number(event.target.value) })}>
              {TOY_STATE.fisher.map((value, index) => <option value={index} key={index}>θ{index + 1} · F{index + 1} = {value}</option>)}
            </select>
          </label>
          <label className="field-label">当前与锚点的偏移 Δᵢ <output>{session.delta.toFixed(2)}</output>
            <input type="range" min="-1" max="1" step="0.01" value={session.delta} onChange={(event) => onSessionChange({ delta: Number(event.target.value) })} />
          </label>
        </div>
        <div className="formula-panel formula-panel-quiet">
          <span className="mini-label">Paper · Equation (3) 的单参数部分</span>
          <div className="formula-large">Pᵢ = (λ / 2) Fᵢ Δᵢ²</div>
          <div className="formula-values" aria-live="polite">
            <div><small>λ</small><strong>{session.lambda.toFixed(1)}</strong></div>
            <div><small>Fᵢ</small><strong>{importance}</strong></div>
            <div><small>Penalty Pᵢ</small><strong>{penalty.toFixed(3)}</strong></div>
            <div><small>∂Pᵢ / ∂θᵢ</small><strong>{restoringGradient.toFixed(3)}</strong></div>
          </div>
          <p>梯度符号随 Δᵢ 变化，负梯度方向会把参数推回锚点。高 Fisher 增加恢复力，但不把参数锁死。</p>
        </div>
        <div className="toy-label">Teaching Toy · F = [1, 4, 9] 与偏移值为说明公式而设，不是论文 Fisher 估计。</div>
      </section>
      <section className="learning-card approximation-card">
        <div className="section-kicker">交互 · 查看对角近似舍弃了什么</div>
        <div className="segmented-control" role="group" aria-label="比较精度矩阵">
          <button className={matrixMode === 'full' ? 'segment is-active' : 'segment'} aria-pressed={matrixMode === 'full'} onClick={() => setMatrixMode('full')}>含耦合的示意矩阵</button>
          <button className={matrixMode === 'diagonal' ? 'segment is-active' : 'segment'} aria-pressed={matrixMode === 'diagonal'} onClick={() => setMatrixMode('diagonal')}>只保留对角线</button>
        </div>
        <div className="matrix-and-note" aria-live="polite">
          <div className="matrix-grid" role="img" aria-label={`${matrixMode === 'full' ? '含非对角项' : '只保留对角项'}的二维教学玩具矩阵`}>
            {matrix.flatMap((row, rowIndex) => row.map((value, colIndex) => <div className={rowIndex === colIndex ? 'matrix-cell is-diagonal' : 'matrix-cell'} key={`${rowIndex}-${colIndex}`}><small>{rowIndex === colIndex ? '对角' : '耦合'}</small><strong>{value}</strong></div>))}
          </div>
          <p>{matrixMode === 'full' ? '非对角元素表达参数之间的关联方向。完整高维矩阵计算昂贵。' : '对角 EWC 只保留每个参数的独立精度值；参数间耦合不再显式表示。'}</p>
        </div>
        <div className="toy-label">Teaching Toy · 矩阵元素是演示用例，非实验后验或 Fisher 数值。</div>
      </section>
    </div>
  );
}
