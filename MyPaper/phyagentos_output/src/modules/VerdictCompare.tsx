import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Btn, Chip } from './kit';

// Lab 5.1 — 同一条轨迹交给两个判定者：返回码对证据不敏感，
// SessionVerifier 依据证据包给出 success / failure / replan。

type Scenario = 'success' | 'failure' | 'replan';

const EVIDENCE = [
  { key: 'S₀', label: '初始观测' },
  { key: 'S_T', label: '终止观测' },
  { key: 'τ', label: '动作-观测轨迹' },
  { key: 'ENV', label: '环境快照' },
  { key: 'EVT', label: '目标端事件' },
];

const SCENARIOS: Record<
  Scenario,
  { chip: string; evidence: string; verdict: string; tone: 'good' | 'bad' | 'info'; transition: string; why: string }
> = {
  success: {
    chip: '成功证据',
    evidence: 'S₀ 杯在桌面 → S_T 杯在收纳盒内且夹爪为空，τ 完整无中断',
    verdict: 'success',
    tone: 'good',
    transition: 'SESSIONS.md：running → succeeded',
    why: '证据满足接受标准：位置变化与「放入」语义一致。',
  },
  failure: {
    chip: '失败证据',
    evidence: 'S₀ 杯在桌面 → S_T 夹爪在感知位置闭空，杯位未变',
    verdict: 'failure',
    tone: 'bad',
    transition: 'SESSIONS.md：running → failed（证据保留用于诊断）',
    why: '轨迹正常终止，但世界没有变成目标要求的样子。',
  },
  replan: {
    chip: '重规划证据',
    evidence: 'S₀ 柜门关闭 → S_T 柜门已开、杯子可及，但夹爪换向失败',
    verdict: 'replan',
    tone: 'info',
    transition: 'SESSIONS.md：running → replanned + child session（原会话不可变）',
    why: '证据支持「带新条件继续」：部分进展有效，剩余目标需要修订策略。',
  },
};

export const VerdictCompare: React.FC<WidgetProps> = () => {
  const [scenario, setScenario] = useState<Scenario>('failure');
  const [runId, setRunId] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  const sc = SCENARIOS[scenario];

  const run = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setRevealed(false);
    setRunId((id) => id + 1);
    timer.current = window.setTimeout(() => setRevealed(true), 1450);
  };

  return (
    <div className="lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group">
          <span className="lab-choice-label">证据情境</span>
          {(Object.keys(SCENARIOS) as Scenario[]).map((k) => (
            <Chip
              key={k}
              active={scenario === k}
              onClick={() => {
                setScenario(k);
                setRevealed(false);
              }}
            >
              {SCENARIOS[k].chip}
            </Chip>
          ))}
        </div>
        <Btn onClick={run}>开始核验</Btn>
      </div>

      <div className="lab-stage lab-verdict-stage" key={runId}>
        <div className="lab-verdict-card">
          <div className="lab-verdict-head">控制器视角</div>
          <div className="lab-verdict-body">
            <div className="lab-rc-line">
              <span className="lab-rc-dot" />
              action_chunks 执行完毕
            </div>
            <div className="lab-rc-line">
              <span className="lab-rc-dot" />
              轨迹偏差在容差内
            </div>
          </div>
          <div className={`lab-verdict-stamp tone-good always`}>
            return code 0 · 轨迹完成
          </div>
          <div className="lab-verdict-note">对证据包不敏感——三种情境下它都说「成功」</div>
        </div>

        <div className="lab-verdict-divider" aria-hidden>
          同一条轨迹
        </div>

        <div className="lab-verdict-card">
          <div className="lab-verdict-head">SessionVerifier 视角</div>
          <div className="lab-verdict-body lab-evidence-list">
            {EVIDENCE.map((e, i) => (
              <div
                className="lab-evidence-item"
                style={{ '--i': i } as React.CSSProperties}
                key={e.key}
              >
                <span className="lab-evidence-check" aria-hidden>
                  {revealed ? '✓' : '…'}
                </span>
                <code className="lab-evidence-key">{e.key}</code>
                <span>{e.label}</span>
              </div>
            ))}
            <div className="lab-evidence-quote">{sc.evidence}</div>
          </div>
          <div
            className={`lab-verdict-stamp tone-${sc.tone} ${revealed ? 'is-in' : 'is-waiting'}`}
          >
            {revealed ? `语义判定 ${sc.verdict}` : '评估中…'}
          </div>
          <div className="lab-verdict-note">{revealed ? sc.why : '证据包正在与接受标准对齐'}</div>
        </div>
      </div>

      <div className={`lab-transition ${revealed ? 'is-in' : ''}`}>
        <span className="lab-transition-label">状态转移</span>
        <code>{revealed ? sc.transition : '等待判定…'}</code>
      </div>

      <Feedback tone={revealed ? sc.tone : 'info'}>
        {revealed
          ? `返回码恒为 0，语义判定却是 ${sc.verdict}——两者回答的是不同的问题。`
          : '先选一个证据情境，再点「开始核验」：注意左右两张卡片对同一轨迹给出什么。'}
      </Feedback>
    </div>
  );
};

export default VerdictCompare;
