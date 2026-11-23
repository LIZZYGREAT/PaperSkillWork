import React from 'react';
import type { LearningAction, LearningSession, SceneId } from '../data/session';
import { AlexNetArchitecture } from './AlexNetArchitecture';
import { InlineNotation } from './InlineNotation';

const methodLabels = { feature: 'Feature extraction', finetune: 'Fine-tuning', joint: 'Joint training' } as const;

export function PersistentWorkspace({ scene, session, dispatch }: {
  scene: SceneId;
  session: LearningSession;
  dispatch: React.Dispatch<LearningAction>;
}) {
  const inspect = (id: string) => dispatch({ type: 'INSPECT_OBJECT', id });
  const activeMethod = methodLabels[session.selectedMethod];
  const taskArrived = scene === '00' || session.newTaskArrived;
  const methodState = scene === '00'
    ? '新任务到来 · 背景设定'
    : scene === 'A' && session.newTaskArrived
    ? activeMethod
    : scene === 'B' || scene === 'C' ? 'Teacher → Student construction'
    : scene === 'E' ? 'shared-gradient diagnostic'
    : scene === 'F' ? 'function-preservation probes'
    : scene === 'G' ? 'domain coverage diagnostic'
    : scene === 'H' ? 'sequential Teacher lineage'
    : scene === 'I' ? 'paper evidence audit'
    : scene === 'J' ? 'end-to-end implementation workflow'
    : '旧任务已训练完成';

  return (
    <section className="v2-workspace-card" aria-labelledby="workspace-title">
      <header className="v2-workspace-card-header">
        <div><p className="v2-eyebrow">PERSISTENT WORKSPACE</p><h2 id="workspace-title">共享工作区</h2></div>
        <span className={`v2-workspace-mode ${session.newTaskArrived ? 'is-active' : ''}`}>{methodState}</span>
      </header>

      <div className="v2-data-availability" aria-label="持续显示的数据可用状态">
        <DataState label="旧图像" symbol="X_o" state={taskArrived ? '不可用于新阶段' : '已有旧任务'} tone={taskArrived ? 'unavailable' : 'available'} />
        <DataState label="旧真值" symbol="Y_o^GT" state={taskArrived ? '不可用于新阶段' : '已有旧任务'} tone={taskArrived ? 'unavailable' : 'available'} />
        <DataState label="旧模型" symbol="(θ_s, θ_o)" state="可运行" tone="available" />
        <DataState label="新数据" symbol="(X_n, Y_n)" state={taskArrived ? '当前可用' : '等待新任务'} tone={taskArrived ? 'available' : 'waiting'} />
      </div>

      {scene === '00' || scene === 'A' ? (
        <AlexNetArchitecture
          compact
          boundary={session.boundary === 'fc7' ? 'fc7' : 'features'}
          inputSymbol={taskArrived ? 'Xₙ' : 'Xₒ'}
          sharedState={scene === '00' ? '待选择更新范围' : session.newTaskArrived ? (session.selectedMethod === 'feature' ? '冻结参数' : '参与训练') : '已训练'}
          oldState={session.selectedMethod === 'joint' && session.newTaskArrived ? '联合训练需要旧数据' : '旧任务分类输出'}
          newState={scene === '00' || !session.studentCreated ? '尚未创建' : session.newTaskArrived ? '新任务类别输出' : '等待新任务'}
          onInspect={inspect}
        />
      ) : (
        <div className="v2-teacher-student-graph" aria-label="Teacher 与 Student 是独立模型对象">
          <div className="v2-runtime-model v2-runtime-teacher">
            <div className="v2-runtime-heading"><span>TEACHER SNAPSHOT</span><strong>Teacher</strong><small>eval · no_grad · 不进 optimizer</small></div>
            <button type="button" className="v2-runtime-trunk" onClick={() => inspect('theta_s')}><code><InlineNotation text="θ_s^T" /></code><span>{session.boundary === 'fc7' ? 'features · fc6 · fc7' : 'features'}</span></button>
            <button type="button" className="v2-runtime-head old" onClick={() => inspect('theta_o')}><code><InlineNotation text="θ_o^T" /></code><span>old classifier</span></button>
            {session.responseCacheReady ? <button type="button" className="v2-runtime-output" onClick={() => inspect('y_o')}><code><InlineNotation text="Y_o" /></code><span>response cache</span></button> : <span className="v2-runtime-output is-pending"><code><InlineNotation text="Y_o" /></code><span>待生成</span></span>}
          </div>
          <div className="v2-runtime-separator" aria-hidden="true"><span>copy values</span><b>≠</b><span>share objects</span></div>
          <div className="v2-runtime-model v2-runtime-student">
            <div className="v2-runtime-heading"><span>EXPANDED MODEL</span><strong>Student</strong><small>{session.studentCreated ? '已创建' : '尚未创建'}</small></div>
            <button type="button" className={`v2-runtime-trunk ${session.teacherStudentShared ? 'is-error' : ''}`} onClick={() => inspect('theta_s')}><code><InlineNotation text="θ_s^S" /></code><span>{session.boundary === 'fc7' ? 'features · fc6 · fc7' : 'features only'}</span></button>
            {session.boundary === 'features' ? <p className="v2-runtime-branch-detail">old branch: fc6 → fc7 → classifier<br />new branch: fc6 → fc7 → classifier</p> : null}
            <div className="v2-runtime-head-row">
              <button type="button" className="v2-runtime-head old" onClick={() => inspect('theta_o')}><code><InlineNotation text="θ_o^S" /></code><span>old branch</span></button>
              <button type="button" className="v2-runtime-head new" onClick={() => inspect('theta_n')}><code><InlineNotation text="θ_n^S" /></code><span>new branch</span></button>
            </div>
            {session.teacherStudentShared ? <p className="v2-runtime-warning">Teacher 与 Student 引用了同一参数对象；更新 Student 会改动 Teacher。</p> : null}
          </div>
        </div>
      )}

      {scene === 'A' && session.oldResponseRevealed ? (
        <div className="v2-workspace-response"><span>旧模型可继续运行：</span><strong><InlineNotation text="X_n → (θ_s, θ_o) → Y_o" /></strong><small><InlineNotation text="旧数据不可用，但模型还在；Y_o 是当前新图像上的旧任务响应。" /></small></div>
      ) : null}

      <footer className="v2-workspace-legend" aria-label="颜色语义">
        <span><i className="is-shared" /><InlineNotation text="Shared · θ_s" /></span><span><i className="is-old" /><InlineNotation text="Old · θ_o / Teacher" /></span><span><i className="is-new" /><InlineNotation text="New · θ_n / Student" /></span>
      </footer>
    </section>
  );
}

function DataState({ label, symbol, state, tone }: { label: string; symbol: string; state: string; tone: 'available' | 'unavailable' | 'waiting' }) {
  return <div className={`v2-data-state is-${tone}`}><span className="v2-data-symbol"><InlineNotation text={symbol} /></span><span className="v2-data-label">{label}</span><strong>{state}</strong></div>;
}
