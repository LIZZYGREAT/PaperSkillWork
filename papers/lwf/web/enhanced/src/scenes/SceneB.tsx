import React from 'react';
import { useReferenceHub } from '../components/ReferencePrimitives';
import { openWorkspaceFor } from '../components/workspaceActions';
import type { BoundaryId, LearningAction, LearningSession, ParamGroupId, TrainingPhase } from '../data/session';

const sampleIds = [427, 428, 901];
const groups: { id: ParamGroupId; symbol: string; title: string; names: Record<BoundaryId, string[]>; shape: string; meaning: string }[] = [
  {
    id: 'theta_s', symbol: 'θ_s', title: 'Shared parameters',
    names: { fc7: ['features.*', 'fc6.*', 'fc7.*'], features: ['features.*'] },
    shape: '多个张量；结构由共享模块决定', meaning: '多个任务共同使用的模块参数集合。',
  },
  {
    id: 'theta_o', symbol: 'θ_o', title: 'Old-task parameters',
    names: { fc7: ['old_classifier.weight', 'old_classifier.bias'], features: ['old_fc6.*', 'old_fc7.*', 'old_classifier.*'] },
    shape: 'W_o:[C_o,D] · b_o:[C_o]（分类头示意）', meaning: '旧任务分支的参数集合；边界前移时会包含更多任务专属模块。',
  },
  {
    id: 'theta_n', symbol: 'θ_n', title: 'New-task parameters',
    names: { fc7: ['new_classifier.weight', 'new_classifier.bias'], features: ['new_fc6.*', 'new_fc7.*', 'new_classifier.*'] },
    shape: 'W_n:[C_n,D] · b_n:[C_n]（分类头示意）', meaning: '根据新任务输出结构新建，不从旧类别参数中“找出”。',
  },
];

const phaseGroups: Record<TrainingPhase, ParamGroupId[]> = {
  warmup: ['theta_n'],
  joint: ['theta_s', 'theta_o', 'theta_n'],
};

export function SceneB({ session, dispatch, onNext, onPrevious }: {
  session: LearningSession;
  dispatch: React.Dispatch<LearningAction>;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const { openHub } = useReferenceHub();
  const isWarmupConfig = phaseGroups.warmup.every((group) => session.optimizerGroups.includes(group))
    && session.optimizerGroups.length === 1 && session.optimizerGroups[0] === 'theta_n';
  const responseAligned = session.responseCacheReady && (session.responseMode === 'online' || session.cacheBySampleId);
  const ready = session.studentCreated && responseAligned && !session.teacherStudentShared && isWarmupConfig;

  return (
    <div className="v2-scene-content v2-scene-b">
      <section className="v2-state-card v2-b-entry" aria-labelledby="b-entry-title">
        <div className="v2-state-card-heading">
          <span className="v2-step-number">01</span>
          <div><p className="v2-eyebrow">AVAILABLE FOR CONSTRUCTION</p><h2 id="b-entry-title">从旧模型检查点和新任务数据集开始</h2></div>
        </div>
        <div className="v2-b-assets">
          <AssetCard symbol="old_model.pt" label="已训练旧模型" state="可加载 · Teacher 来源" tone="old" />
          <AssetCard symbol="new_dataset" label="新任务数据" state="X_n 与 Y_n 可用" tone="new" />
          <AssetCard symbol="X_o / Y_o^GT" label="旧训练数据" state="当前不可用" tone="missing" />
        </div>
        <p className="v2-b-fact"><span className="v2-source-badge is-paper">PAPER</span> <code>θ_s</code> 与 <code>θ_o</code> 是按模型模块边界划分出的参数集合；它们不是框架自动生成的特殊变量。模型图是结构示意，不宣称论文实验只使用这一种 backbone。</p>
      </section>

      <section className="v2-b-section" aria-labelledby="partition-title">
        <SectionHeading step="02" eyebrow="PARAMETER PARTITION EXPLORER" title="先决定任务边界，再得到参数集合" />
        <div className="v2-boundary-control" role="group" aria-label="选择共享与任务专属模块的边界">
          <button type="button" aria-pressed={session.boundary === 'fc7'} className={session.boundary === 'fc7' ? 'is-active' : ''} onClick={() => dispatch({ type: 'SET_BOUNDARY', boundary: 'fc7' })}>
            <strong>边界在 fc7 之后</strong><span>θ_s = features + fc6 + fc7</span><small>θ_o / θ_n 只含各自分类头</small>
          </button>
          <button type="button" aria-pressed={session.boundary === 'features'} className={session.boundary === 'features' ? 'is-active' : ''} onClick={() => dispatch({ type: 'SET_BOUNDARY', boundary: 'features' })}>
            <strong>边界在 features 之后</strong><span>θ_s = features</span><small>fc6、fc7 和分类头分别进入两任务分支</small>
          </button>
        </div>

        <div className="v2-module-tree-card">
          <div className="v2-module-tree-head"><code>old_model</code><span>module tree · current boundary highlighted</span></div>
          <div className="v2-module-tree">
            <ModuleRow name="features" group="θ_s · shared" tone="shared" dispatch={dispatch} />
            {session.boundary === 'features' ? <BoundaryLine label="shared / task-specific boundary" /> : null}
            <ModuleRow name="fc6" group={session.boundary === 'fc7' ? 'θ_s · shared' : 'old / new task branch'} tone={session.boundary === 'fc7' ? 'shared' : 'branch'} dispatch={dispatch} />
            <ModuleRow name="fc7" group={session.boundary === 'fc7' ? 'θ_s · shared' : 'old / new task branch'} tone={session.boundary === 'fc7' ? 'shared' : 'branch'} dispatch={dispatch} />
            {session.boundary === 'fc7' ? <BoundaryLine label="shared / task-specific boundary" /> : null}
            <ModuleRow name="old_classifier" group="θ_o · old task" tone="old" dispatch={dispatch} />
            <div className="v2-module-tree-branch"><i aria-hidden="true" /><span>new_classifier <small>θ_n · on Student only</small></span></div>
          </div>
          <p className="v2-module-tree-note">{session.boundary === 'fc7' ? '此划分下共享表征延伸到 fc7，任务分支从分类头开始。' : '边界前移后，Student 要为新任务复制/创建对应的 fc6 与 fc7 分支；Teacher 仍保留旧模型路径。'}</p>
        </div>

        <div className="v2-parameter-registry">
          <div className="v2-parameter-registry-heading"><div><span className="v2-source-badge is-implementation">IMPLEMENTATION MAPPING</span><h3>参数注册表</h3></div><span>示意模型 · 形状用符号表达</span></div>
          <div className="v2-parameter-groups">
            {groups.map((group) => (
              <button type="button" key={group.id} className={`v2-parameter-group is-${group.id} ${session.selectedObject === group.id ? 'is-selected' : ''}`} onClick={() => openWorkspaceFor(group.id)}>
                <header><code>{group.symbol}</code><strong>{group.title}</strong><span>{group.id === 'theta_n' && session.studentCreated ? 'created' : group.id === 'theta_n' ? '待创建' : 'parameter set'}</span></header>
                <div className="v2-parameter-name-list">{group.names[session.boundary].map((name) => <code key={name}>{name}</code>)}</div>
                <small>{group.shape}</small>
                <p>{group.meaning}</p>
              </button>
            ))}
          </div>
          <div className="v2-parameter-set-note"><strong>θ 是集合，不是单一矩阵。</strong> 点击 θ_s 可在对象检查器查看论文含义、Runtime 映射和依据。当前结构没有配置真实 tensor 尺寸，因此不显示虚构参数量。</div>
        </div>
      </section>

      <section className="v2-b-section" aria-labelledby="student-title">
        <SectionHeading step="03" eyebrow="CREATE THE STUDENT MODEL" title="复制初始值，建立独立的参数对象" />
        <div className="v2-create-student-grid">
          <div className="v2-student-state-card is-teacher">
            <span className="v2-source-badge is-paper">PAPER OBJECT</span><h3>Teacher · 旧模型快照</h3>
            <p><code>(θ_s^T, θ_o^T)</code> 来自已训练检查点；供生成旧任务响应。</p>
            <dl><div><dt>模式</dt><dd>eval</dd></div><div><dt>梯度跟踪</dt><dd>关闭</dd></div><div><dt>Optimizer</dt><dd>不加入</dd></div></dl>
            <button type="button" className="v2-inline-inspect" onClick={() => openWorkspaceFor('teacher')}>检查 Teacher ↗</button>
          </div>
          <div className="v2-student-create-action">
            <span className="v2-create-arrow" aria-hidden="true">→</span>
            <button type="button" className="v2-primary-action" onClick={() => dispatch({ type: 'CREATE_STUDENT' })} disabled={session.studentCreated}>{session.studentCreated ? 'Student 已创建 ✓' : '创建扩展后的 Student'}</button>
            <small>复制 θ_s、θ_o 的初始值，再创建 θ_n；参数对象分别存储。</small>
          </div>
          <div className={`v2-student-state-card is-student ${session.studentCreated ? 'is-ready' : ''}`}>
            <span className="v2-source-badge is-implementation">RUNTIME OBJECTS</span><h3>Student · 可训练的扩展模型</h3>
            <p><code>θ_s^S</code>、<code>θ_o^S</code> 初始值复制自 Teacher；新建 <code>θ_n^S</code>。</p>
            <dl><div><dt>初值相等</dt><dd>{session.studentCreated ? '是' : '创建后成立'}</dd></div><div><dt>同一 Parameter 对象</dt><dd>{session.teacherStudentShared ? '是 · 错误示例' : '否 · 独立对象'}</dd></div><div><dt>后续可分化</dt><dd>{session.studentCreated && !session.teacherStudentShared ? '是' : 'Student 创建后可验证'}</dd></div></dl>
            <button type="button" className="v2-inline-inspect" onClick={() => openWorkspaceFor('student')}>检查 Student ↗</button>
          </div>
        </div>
        <div className={`v2-identity-demo ${session.teacherStudentShared ? 'is-error' : ''}`}>
          <div><span className="v2-source-badge is-implementation">IMPLEMENTATION NOTE</span><strong>对象身份演示</strong><p>{session.teacherStudentShared ? 'student.backbone = teacher.backbone：两者指向相同 Module，更新 Student 可能同时改动 Teacher。' : '正确关系：初始数值可以相同，但 Parameter / Module 对象独立，后续可以分化。'}</p></div>
          <button type="button" className="v2-secondary-action" onClick={() => dispatch({ type: 'TOGGLE_SHARED_TEACHER' })}>{session.teacherStudentShared ? '恢复独立对象' : '演示错误的共享引用'}</button>
          {session.teacherStudentShared ? <code className="v2-code-example">student.backbone = teacher.backbone</code> : null}
        </div>
        <div className="v2-new-head-note"><strong>θ_n 从新任务结构创建。</strong><span>如果 shared feature 为 h:[B,D]，新任务有 C_n 类，则线性分类头示意为 W_n:[C_n,D]、b_n:[C_n]。论文实验初始化采用 Xavier；此页面未生成实际模型权重。</span><button type="button" onClick={() => openHub({ evidenceId: 'A03' })}>查看参数依据 A03 ↗</button></div>
      </section>

      <section className="v2-b-section" aria-labelledby="cache-title">
        <SectionHeading step="04" eyebrow="RECORD OLD RESPONSES" title="Teacher 在 X_n 上生成并缓存 Y_o" />
        <div className="v2-cache-flow">
          <div className="v2-cache-tensor-flow" aria-label="响应张量流">
            <TensorPill name="X_n" shape="[B, 3, H, W]" /><span aria-hidden="true">→</span><TensorPill name="h" shape="[B, D]" /><span aria-hidden="true">→</span><TensorPill name="old logits" shape="[B, C_o]" /><span aria-hidden="true">→</span><TensorPill name="Y_o" shape="[B, C_o]" tone="old" />
          </div>
          <p className="v2-cache-caption"><code>Y_o = f_old(X_n)</code>：每个当前新任务样本得到一个旧任务响应向量，不是旧任务真值或旧样本回放。</p>
          <div className="v2-cache-controls">
            <div><span className="v2-source-badge is-implementation">IMPLEMENTATION CHOICE</span><strong>响应生成方式</strong></div>
            <div className="v2-segmented" role="group" aria-label="选择 Teacher 响应生成方式">
              <button type="button" className={session.responseMode === 'offline' ? 'is-active' : ''} aria-pressed={session.responseMode === 'offline'} onClick={() => dispatch({ type: 'SET_RESPONSE_MODE', mode: 'offline' })}>Offline cache</button>
              <button type="button" className={session.responseMode === 'online' ? 'is-active' : ''} aria-pressed={session.responseMode === 'online'} onClick={() => dispatch({ type: 'SET_RESPONSE_MODE', mode: 'online' })}>Online Teacher</button>
            </div>
          </div>
          {session.responseMode === 'offline' ? (
            session.cacheBySampleId ? (
            <div className="v2-cache-mode-copy"><strong>Offline response cache</strong><span>先让 Teacher 处理新数据集，再保存 <code>sample_id → Y_o</code>。训练阶段读入 <code>(x_n, y_n, cached y_o)</code>。</span></div>
            ) : <div className="v2-cache-mode-copy is-warning"><strong>演示错误：缓存绑定临时 batch 位置</strong><span>shuffle 后位置会变化；恢复 sample_id 键，才能保证当前图像与 Y_o 对应。</span></div>
          ) : (
            <div className="v2-cache-mode-copy is-online"><strong>Online Teacher</strong><span>同一个当前 batch 分别进入冻结 Teacher 与 Student；可避免离线响应对应原图、训练输入却是随机增强图的错位。</span></div>
          )}
          <div className="v2-cache-identity-row">
            <button type="button" className="v2-primary-action" disabled={session.responseCacheReady} onClick={() => dispatch({ type: 'GENERATE_RESPONSE_CACHE' })}>{session.responseCacheReady ? (session.responseMode === 'offline' ? '旧响应已生成 ✓' : '在线响应路径已就绪 ✓') : session.responseMode === 'offline' ? '生成按样本 ID 对齐的响应' : '准备在线 Teacher 响应'}</button>
            <span>示意样本 ID，不是论文数据</span>
            <button type="button" className="v2-identity-risk-toggle" aria-pressed={!session.cacheBySampleId} disabled={session.responseMode === 'online'} onClick={() => dispatch({ type: 'TOGGLE_CACHE_IDENTITY' })}>{session.responseMode === 'online' ? 'Online 同步输入，不需离线索引' : session.cacheBySampleId ? '演示 batch 位置错配' : '恢复 sample_id 对齐'}</button>
          </div>
          {session.responseMode === 'offline' ? (
            <div className="v2-response-table-wrap">
              <table className="v2-response-table"><thead><tr><th>sample_id</th><th>新输入</th><th>新标签</th><th>Teacher response</th></tr></thead><tbody>
                {sampleIds.map((id, index) => {
                  const positionResponses = [901, 427, 428];
                  return <tr key={id}><th scope="row">{id}</th><td><code>x_{id}</code></td><td><code>y_{id}</code></td><td>{session.responseCacheReady ? <code className={!session.cacheBySampleId ? 'is-misaligned' : ''}>{session.cacheBySampleId ? `y_o(${id}) ∈ ℝ^Cₒ` : `y_o(${positionResponses[index]}) · 错位`}</code> : <span>待生成</span>}</td></tr>;
                })}
              </tbody></table>
              <p>{session.cacheBySampleId ? '缓存键绑定样本身份，batch shuffle 后仍可取回同一张图像的 Teacher response。' : '错误示例：当前图像与另一行的 Teacher response 错配，因此不能用于正确训练。'}</p>
            </div>
          ) : (
            <div className="v2-online-teacher-note"><strong>Online 对齐</strong><p>训练循环中给 Teacher 和 Student 输入同一个已变换 batch。Teacher 使用 <code>eval()</code> 与 <code>no_grad()</code>；前者控制 Dropout / BatchNorm 行为，后者阻止构建 autograd graph。</p></div>
          )}
          <details className="v2-implementation-details"><summary>实现边界：shuffle 与数据增强</summary><div><p><strong>按 batch 位置缓存的风险：</strong>如果 DataLoader shuffle 后把 x_A 配给 teacher_response_F，监督目标就和样本错位。这里用 sample_id 说明实现约束。</p><p><strong>增强策略：</strong>离线缓存若来自原图 x，而 Student 接收增强图 Augment(x)，约束就变成 f_S(Augment(x)) ≈ f_T(x)。这是复现实现选择，不是论文指定的唯一策略。</p></div></details>
        </div>
        <div className="v2-cache-paper-link"><span className="v2-source-badge is-paper">PAPER</span><span>旧模型在新任务输入上产生旧任务目标；该目标与 <code>Y_n</code> 一起构成新任务训练监督。</span><button type="button" onClick={() => openHub({ evidenceId: 'A04' })}>查看依据 A04 ↗</button><button type="button" onClick={() => openHub({ evidenceId: 'F01' })}>查看依据 F01 ↗</button></div>
      </section>

      <section className="v2-b-section" aria-labelledby="optimizer-title">
        <SectionHeading step="05" eyebrow="PREPARE WARM-UP" title="Optimizer 管理具体参数对象" />
        <div className="v2-phase-switch" role="group" aria-label="训练阶段">
          <button type="button" aria-pressed={session.phase === 'warmup'} className={session.phase === 'warmup' ? 'is-active' : ''} onClick={() => dispatch({ type: 'SET_PHASE', phase: 'warmup' })}><strong>Warm-up</strong><small>先训练新任务分支</small></button>
          <button type="button" aria-pressed={session.phase === 'joint'} className={session.phase === 'joint' ? 'is-active' : ''} onClick={() => dispatch({ type: 'SET_PHASE', phase: 'joint' })}><strong>Joint optimization</strong><small>之后联合更新参数组</small></button>
        </div>
        <div className="v2-optimizer-panel">
          <div className="v2-optimizer-panel-heading"><div><span className="v2-source-badge is-implementation">OPTIMIZER INSPECTOR</span><h3>optimizer.param_groups</h3></div><button type="button" onClick={() => dispatch({ type: 'SET_PHASE', phase: session.phase })}>恢复本阶段配置</button></div>
          <p>{session.phase === 'warmup' ? '论文 warm-up 设置：冻结 θ_s 与 θ_o，只训练 θ_n。' : 'Joint optimization：允许 θ_s、θ_o、θ_n 一同进入优化器。'}</p>
          <div className="v2-optimizer-groups">{groups.map((group) => {
            const included = session.optimizerGroups.includes(group.id);
            const trainable = phaseGroups[session.phase].includes(group.id);
            return <button key={group.id} type="button" className={`${included ? 'is-included' : ''} is-${group.id}`} aria-pressed={included} onClick={() => dispatch({ type: 'TOGGLE_OPTIMIZER_GROUP', group: group.id })}>
              <span><code>{group.symbol}</code><strong>{group.title}</strong></span><small>requires_grad = {trainable ? 'True' : 'False'}</small><b>{included ? 'optimizer member' : 'excluded'}</b>
            </button>;
          })}</div>
          {session.phase === 'warmup' && !isWarmupConfig ? <p className="v2-warmup-deviation" role="status">当前设置不再匹配论文 warm-up；若 θ_s 入组，L_new 的梯度将有机会改变共享表示。</p> : null}
          {session.phase === 'warmup' && isWarmupConfig ? <p className="v2-warmup-match">✓ Warm-up 配置匹配：optimizer 只包含 θ_n 的参数对象。</p> : null}
        </div>
      </section>

      <section className="v2-system-ready" aria-labelledby="system-ready-title">
        <div><span className="v2-eyebrow">SYSTEM CHECKPOINT</span><h2 id="system-ready-title">进入训练前检查</h2></div>
        <div className="v2-ready-checks"><ReadyCheck label="Teacher 快照" ready /><ReadyCheck label="Student 独立参数对象" ready={session.studentCreated && !session.teacherStudentShared} /><ReadyCheck label="Teacher 响应与输入对齐" ready={responseAligned} /><ReadyCheck label="Warm-up optimizer" ready={isWarmupConfig} /></div>
        <p>{ready ? '系统对象和 warm-up 参数组已准备好。' : '完成 Student、旧响应缓存和 warm-up 参数组后，再开始 Scene C 的训练步。也可以先翻页查看，页面状态会保留。'}</p>
        <div className="v2-placeholder-actions"><button type="button" className="v2-secondary-action" onClick={onPrevious}>返回 Scene A</button><button type="button" className="v2-primary-action" disabled={!ready} onClick={onNext}>Run One Training Step · Scene C →</button></div>
      </section>

      <footer className="v2-scene-evidence-line"><span>Paper facts 与 Runtime 实现选项分别标注；模型模块和样本 ID 均为教学结构示意。</span><span>Evidence · A03 / A04 / F01</span></footer>
    </div>
  );
}

function SectionHeading({ step, eyebrow, title }: { step: string; eyebrow: string; title: string }) {
  return <div className="v2-section-title-row v2-b-heading"><div className="v2-state-card-heading"><span className="v2-step-number">{step}</span><div><p className="v2-eyebrow">{eyebrow}</p><h2>{title}</h2></div></div></div>;
}

function AssetCard({ symbol, label, state, tone }: { symbol: string; label: string; state: string; tone: 'old' | 'new' | 'missing' }) {
  return <div className={`v2-b-asset is-${tone}`}><code>{symbol}</code><strong>{label}</strong><small>{state}</small></div>;
}

function ModuleRow({ name, group, tone, dispatch }: { name: string; group: string; tone: 'shared' | 'branch' | 'old'; dispatch: React.Dispatch<LearningAction> }) {
  const objectId = tone === 'old' ? 'theta_o' : 'theta_s';
  return <button type="button" className={`v2-module-row is-${tone}`} onClick={() => openWorkspaceFor(objectId)}><span className="v2-tree-marker" aria-hidden="true">├─</span><code>{name}</code><small>{group}</small></button>;
}

function BoundaryLine({ label }: { label: string }) {
  return <div className="v2-module-boundary"><span /> <strong>{label}</strong></div>;
}

function TensorPill({ name, shape, tone }: { name: string; shape: string; tone?: 'old' }) {
  return <div className={`v2-tensor-pill ${tone === 'old' ? 'is-old' : ''}`}><code>{name}</code><small>{shape}</small></div>;
}

function ReadyCheck({ label, ready }: { label: string; ready: boolean }) {
  return <div className={ready ? 'is-ready' : 'is-pending'}><span aria-hidden="true">{ready ? '✓' : '○'}</span><strong>{label}</strong><small>{ready ? 'READY' : 'PENDING'}</small></div>;
}
