import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Chip } from './kit';

// Lab 4.1 — 选择执行流 × 目标端，观察 AdapterPlan 何时成立、
// 何时在获得目标端访问权之前被预检拒绝。

type Flow = 'policy' | 'tool';
type Target = 'arm' | 'text';

interface PlanDef {
  ok: boolean;
  chain: string[];
  plan: [string, string][];
  reject?: string;
}

const PLANS: Record<`${Flow}-${Target}`, PlanDef> = {
  'policy-arm': {
    ok: true,
    chain: ['PolicyAdapter', 'ActionBridge', 'TargetAdapter'],
    plan: [
      ['policy_adapter', 'rgb+proprio → 模型张量输入'],
      ['action_bridge', 'ee-pose @10Hz · 工作空间夹紧 · 速度上限'],
      ['target_adapter', 'franka SDK (rtde)'],
      ['tool_manifest', '[observe, step]'],
    ],
  },
  'policy-text': {
    ok: false,
    chain: [],
    reject: 'SkillRuntime 声明 required_obs = [rgb, proprio]，而文本终端仅提供 [text] —— 观测契约无交集，AdapterPlan 无法构成。',
    plan: [],
  },
  'tool-arm': {
    ok: true,
    chain: ['ToolManifest', 'ActionBridge', 'TargetAdapter'],
    plan: [
      ['tool_manifest', '[observe, reset, invoke_tool: grasp / place]（经工具策略过滤）'],
      ['action_bridge', '工具参数类型检查 + 坐标转换'],
      ['target_adapter', 'franka SDK (rtde)'],
    ],
  },
  'tool-text': {
    ok: true,
    chain: ['ToolManifest', 'ArgumentCheck', 'TargetAdapter'],
    plan: [
      ['tool_manifest', '[observe, step, invoke_tool: craft / harvest]'],
      ['argument_check', '参数合法性校验，危险操作默认不可用'],
      ['target_adapter', 'text-terminal adapter'],
    ],
  },
};

export const PreflightLab: React.FC<WidgetProps> = () => {
  const [flow, setFlow] = useState<Flow>('policy');
  const [target, setTarget] = useState<Target>('arm');
  const plan = PLANS[`${flow}-${target}`];

  let tone: '' | 'good' | 'bad' | 'info' = 'good';
  let msg = '契约成立：预检产出 AdapterPlan 与 TargetToolManifest，会话被允许进入目标端。';
  if (!plan.ok) {
    tone = 'bad';
    msg = '预检拒绝发生在目标端访问之前——这次拒绝本身就是一条可审计记录，物理世界零成本。';
  } else if (flow === 'tool') {
    tone = 'info';
    msg = '工具流成立：Agent 在线决策，但只能调用 Manifest 过滤后的受控工具，权限不因「直接参与」而放大。';
  }

  return (
    <div className="lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group">
          <span className="lab-choice-label">执行流</span>
          <Chip active={flow === 'policy'} onClick={() => setFlow('policy')}>
            连续策略流
          </Chip>
          <Chip active={flow === 'tool'} onClick={() => setFlow('tool')}>
            Agent 工具流
          </Chip>
        </div>
        <div className="lab-choice-group">
          <span className="lab-choice-label">目标端</span>
          <Chip active={target === 'arm'} onClick={() => setTarget('arm')}>
            机械臂 · RGB+本体感知
          </Chip>
          <Chip active={target === 'text'} onClick={() => setTarget('text')}>
            文本终端 · 仅文本
          </Chip>
        </div>
      </div>

      <div className="lab-stage">
        <div className="lab-pipeline">
          <div className="lab-node lab-node-session">
            <span className="lab-node-title">Session 契约</span>
            <span className="lab-node-sub">目标 · 运行时 · 验收标准</span>
          </div>
          <span className="lab-arrow" aria-hidden>→</span>
          <div className={`lab-node lab-node-gate ${plan.ok ? 'tone-good' : 'tone-bad'}`}>
            <span className="lab-node-title">预检</span>
            <span className="lab-node-sub">{plan.ok ? '✓ 契约成立' : '✕ 拒绝'}</span>
          </div>
          {plan.ok ? (
            <>
              <span className="lab-arrow" aria-hidden>→</span>
              {plan.chain.map((c) => (
                <React.Fragment key={c}>
                  <div className="lab-node lab-node-chain">
                    <span className="lab-node-title">{c}</span>
                  </div>
                  <span className="lab-arrow" aria-hidden>→</span>
                </React.Fragment>
              ))}
              <div className="lab-node lab-node-target">
                <span className="lab-node-title">{target === 'arm' ? '机械臂目标端' : '文本终端'}</span>
                <span className="lab-node-sub">受控接口</span>
              </div>
            </>
          ) : (
            <div className="lab-reject-banner">
              <span className="lab-reject-icon" aria-hidden>⛔</span>
              {plan.reject}
              <span className="lab-reject-untouched">目标端未被触碰</span>
            </div>
          )}
        </div>
        {plan.ok ? (
          <div className="lab-plan-readout" key={`${flow}-${target}`}>
            {plan.plan.map(([k, v]) => (
              <div className="lab-protocol-line" key={k}>
                <span className="lab-protocol-key">{k}</span>
                <span className="lab-protocol-val">{v}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default PreflightLab;
