import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Btn } from './kit';

// Lab 3.1 — 会话状态机步进：pending → claimed → running → finalizing → verifying → terminal。
// 每一步展示：谁在负责、协议文件里写下了什么。

interface StepDef {
  state: string;
  actor: string;
  plane: 'agent' | 'watchdog' | 'runner' | 'verifier';
  desc: string;
  write: string;
  file: string;
}

const STEPS: StepDef[] = [
  {
    state: 'pending',
    actor: 'Goal Planner / Session Compiler',
    plane: 'agent',
    desc: 'Agent 把自然语言请求编译成结构化会话：任务目标、所选 SkillRuntime 与目标端、前置条件、执行限制与接受标准。',
    write: 'lifecycle = pending · objective / acceptance_criteria 已就位',
    file: 'SESSIONS.md',
  },
  {
    state: 'claimed',
    actor: 'WatchdogSupervisor',
    plane: 'watchdog',
    desc: '监督者原子认领会话并执行兼容性预检：核对观测模态、动作表示与安全配置，产出 AdapterPlan 与 TargetToolManifest。',
    write: 'lifecycle = claimed · adapter_plan + tool_manifest 已生成',
    file: 'SESSIONS.md',
  },
  {
    state: 'running',
    actor: 'SessionRunner + SkillRuntime',
    plane: 'runner',
    desc: 'Runner 通过受控接口执行观测-动作循环；Runner、策略服务与目标端持续上报心跳，超时或取消会被传播与遏制。',
    write: 'heartbeat ✓ · 轨迹与中间事件追加进执行记录',
    file: 'LOG.md',
  },
  {
    state: 'finalizing',
    actor: 'ResultWriter',
    plane: 'runner',
    desc: '到达终止条件后收集证据包：初始与终止观测、ENVIRONMENT.md 快照、动作-观测历史与目标端事件。',
    write: 'evidence_bundle = {S₀, S_T, τ, env_snapshot, events}',
    file: 'SESSIONS.md',
  },
  {
    state: 'verifying',
    actor: 'SessionVerifier',
    plane: 'verifier',
    desc: '依据会话契约评估证据包；自动验收与工具辅助复核共享同一接口，判定与所用证据引用一起追加记录。',
    write: 'attempts += {verdict, evidence_refs, verifier_cfg}',
    file: 'attempts 记录',
  },
  {
    state: 'terminal',
    actor: '状态写回',
    plane: 'watchdog',
    desc: 'success → succeeded；failure → failed（证据保留用于诊断）；replan → replanned，并编译不可变父子关系的 child session。',
    write: 'lifecycle = terminal · verdict 已持久化',
    file: 'SESSIONS.md',
  },
];

const PLANE_LABEL: Record<StepDef['plane'], string> = {
  agent: 'Agent 平面',
  watchdog: 'WatchdogSupervisor',
  runner: 'Runtime 平面',
  verifier: 'SessionVerifier',
};

const PLANE_COLOR: Record<StepDef['plane'], string> = {
  agent: '#7c3aed',
  watchdog: '#f07e47',
  runner: '#27446e',
  verifier: '#228d5c',
};

export const SessionLifecycle: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  return (
    <div className="lab">
      <div className="lab-stage">
        <div className="lab-rail">
          {STEPS.map((st, i) => (
            <React.Fragment key={st.state}>
              {i > 0 ? (
                <span
                  className={`lab-rail-link ${i <= step ? 'is-done' : ''}`}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                className={`lab-rail-node ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
                style={{ '--node-color': PLANE_COLOR[st.plane] } as React.CSSProperties}
                onClick={() => setStep(i)}
                aria-label={`状态 ${st.state}`}
              >
                <span className="lab-rail-dot">{i < step ? '✓' : i + 1}</span>
                <span className="lab-rail-label">{st.state}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="lab-detail" key={s.state}>
          <div className="lab-detail-head">
            <span className="lab-detail-state">{s.state}</span>
            <span
              className="lab-detail-plane"
              style={{ color: PLANE_COLOR[s.plane], borderColor: PLANE_COLOR[s.plane] }}
            >
              {PLANE_LABEL[s.plane]}
            </span>
          </div>
          <p className="lab-detail-desc">{s.desc}</p>
          <div className="lab-detail-write">
            <span className="lab-file-chip">{s.file}</span>
            <code>{s.write}</code>
          </div>
        </div>
      </div>
      <div className="lab-controls lab-controls-center">
        <Btn variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          ← 上一步
        </Btn>
        <Btn onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1}>
          下一步 →
        </Btn>
        <Btn variant="ghost" onClick={() => setStep(0)}>
          重置
        </Btn>
      </div>
      <Feedback tone={step === STEPS.length - 1 ? 'good' : 'info'}>
        {step === 0 && '会话是调度、预检、取证与验收的最小单位——一切从写入这份契约开始。'}
        {step === 1 && '预检不通过就不会进入 running：结构上跑不通的会话在触碰目标端之前被拒绝。'}
        {step === 2 && '监督者只看心跳与生命周期，不参与观测-动作循环——执行策略独立演化。'}
        {step === 3 && '证据包在这里成形：没有 S₀ 就无法判断「变化」，没有 τ 就无法归因。'}
        {step === 4 && 'verdict 与证据引用一起追加进 attempts——自动验收与人工复核同一条记录接口。'}
        {step === 5 && '三种终止各自触发不同转移；replan 保留原尝试并新建 child session，不改写历史。'}
      </Feedback>
    </div>
  );
};

export default SessionLifecycle;
