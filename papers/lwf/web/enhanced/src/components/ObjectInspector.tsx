import React from 'react';
import { useReferenceHub } from './ReferencePrimitives';
import type { LearningSession, SceneId } from '../data/session';

type ObjectId = 'theta_s' | 'theta_o' | 'theta_n' | 'teacher' | 'student' | 'x_n' | 'y_n' | 'y_o';

const objects: Record<ObjectId, { symbol: string; label: string; paper: string; where: string; runtime: string; shape: string; evidence: string }> = {
  theta_s: { symbol: 'θ_s', label: '共享参数集合', paper: '由多个任务共同使用的 CNN 参数；不是一个单独矩阵。', where: '共享特征提取部分。', runtime: '实现映射：分配给 shared / backbone 模块的参数集合。', shape: '多个参数张量；具体形状由模型结构决定。', evidence: 'A01' },
  theta_o: { symbol: 'θ_o', label: '旧任务分支参数', paper: '已训练旧任务的专属输出参数；warm-up 冻结，joint-optimize 可更新。', where: '共享表示之后的旧任务输出分支。', runtime: '实现映射：旧任务 head 中注册的参数。', shape: '例如 W_o:[C_o,D]、b_o:[C_o]；不是论文指定的唯一层形状。', evidence: 'A02' },
  theta_n: { symbol: 'θ_n', label: '新任务分支参数', paper: '新任务到来时添加的专属参数；类别输出数决定其形状。', where: '共享表示之后的新任务输出分支。', runtime: '实现映射：新任务 head 中新建的参数。', shape: '例如 W_n:[C_n,D]、b_n:[C_n]；具体取决于模型。', evidence: 'A03' },
  teacher: { symbol: 'Teacher', label: '旧模型快照', paper: '由已训练旧模型参数构成；用于在新任务输入上产生旧任务响应。', where: '(θ_s^T, θ_o^T)。', runtime: '实现解释：独立模型对象；评估模式并关闭梯度跟踪。', shape: '取决于原模型及旧任务类别数。', evidence: 'A04' },
  student: { symbol: 'Student', label: '扩展后的当前模型', paper: '保留旧任务分支并为新任务增加 θ_n。', where: '共享部分之后分出旧任务和新任务输出。', runtime: '实现解释：复制初始参数值，但使用独立 Parameter 对象。', shape: '包含共享参数、旧分支和新分支。', evidence: 'A03' },
  x_n: { symbol: 'X_n', label: '当前新任务输入', paper: '生成 Y_o 与 Student 当前输出的共同输入。', where: 'DataLoader 当前 batch。', runtime: '实现映射：一个图像 batch tensor。', shape: '[B,C,H,W]（图像输入；预处理依 backbone）。', evidence: 'A04' },
  y_n: { symbol: 'Y_n', label: '新任务真实标签', paper: '由新任务数据集提供，监督新任务输出。', where: '与 X_n 样本对齐的标签 batch。', runtime: '实现映射：类别索引或 one-hot target。', shape: '[B] 或 [B,C_n]。', evidence: 'F01' },
  y_o: { symbol: 'Y_o', label: '旧模型响应', paper: '旧模型在当前 X_n 上产生的旧任务软响应；不是旧任务真实标签。', where: 'Teacher 的旧任务输出端。', runtime: '实现映射：与样本 ID 对齐的 response tensor。', shape: '[B,C_o]。', evidence: 'A04' },
};

export function ObjectInspector({ selectedObject, scene, session, onInspect }: {
  selectedObject: string;
  scene: SceneId;
  session: LearningSession;
  onInspect: (id: string) => void;
}) {
  const { openHub } = useReferenceHub();
  const id = (selectedObject in objects ? selectedObject : 'theta_s') as ObjectId;
  const object = objects[id];
  const notCreated = (id === 'theta_n' && !session.newTaskArrived) || (id === 'student' && !session.studentCreated) || (id === 'y_o' && !session.oldResponseRevealed && !session.responseCacheReady);

  const currentState = id === 'theta_s' && scene === 'A'
    ? session.selectedMethod === 'finetune' || session.selectedMethod === 'joint' ? '当前路线允许共享表示更新' : '当前路线冻结共享表示'
    : id === 'theta_o' && session.phase === 'warmup' && scene !== 'A' ? 'Warm-up 冻结；joint-optimize 阶段允许训练' : '状态随场景和训练阶段变化';

  return (
    <section className="v2-inspector-card" aria-labelledby="inspector-title">
      <header className="v2-inspector-header">
        <div><p className="v2-eyebrow">OBJECT INSPECTOR</p><h2 id="inspector-title">对象检查器</h2></div>
        <span className="v2-layer-tag">{id === 'teacher' || id === 'student' ? 'Implementation' : 'Paper + mapping'}</span>
      </header>
      <div className="v2-inspector-picker" role="group" aria-label="选择检查对象">
        {(Object.keys(objects) as ObjectId[]).map((key) => (
          <button type="button" key={key} className={id === key ? 'is-selected' : ''} aria-pressed={id === key} onClick={() => onInspect(key)}>
            <code>{objects[key].symbol}</code><span>{objects[key].label}</span>
          </button>
        ))}
      </div>
      <article className="v2-inspector-detail" aria-live="polite">
        <div className="v2-inspector-title"><code>{object.symbol}</code><h3>{object.label}</h3></div>
        {notCreated ? <p className="v2-object-not-created">当前状态：尚未创建或生成。进入后续步骤后，此对象才会出现在 Workspace 中。</p> : null}
        <dl>
          <div><dt>论文含义</dt><dd>{object.paper}</dd></div>
          <div><dt>模型位置</dt><dd>{object.where}</dd></div>
          <div><dt>Runtime 对象</dt><dd>{object.runtime}</dd></div>
          <div><dt>Shape / 结构</dt><dd>{object.shape}</dd></div>
          <div><dt>当前状态</dt><dd>{currentState}</dd></div>
        </dl>
        <button className="v2-inspector-evidence" type="button" onClick={() => openHub({ evidenceId: object.evidence })}>
          查看依据 {object.evidence} <span aria-hidden="true">↗</span>
        </button>
      </article>
    </section>
  );
}
