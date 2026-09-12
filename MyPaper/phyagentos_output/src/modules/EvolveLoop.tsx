import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Btn } from './kit';

// Lab 7.1 — 六步闭环：Execute → Verify → Diagnose → Revise → Re-verify → Consolidate。
// 未验证的修复假设在 Consolidate 之前始终是「猜测」。

interface StepDef {
  name: string;
  actor: string;
  color: string;
  desc: string;
  write: string;
  file: string;
}

const STEPS: StepDef[] = [
  {
    name: 'Execute',
    actor: 'Runtime',
    color: '#27446e',
    desc: '会话经标准运行时路径执行，产出轨迹 τ 与终止证据——与部署完全相同的路径。',
    write: 'trace + terminal evidence',
    file: 'LOG.md',
  },
  {
    name: 'Verify',
    actor: 'SessionVerifier',
    color: '#228d5c',
    desc: '语义判定把「未标注的轨迹」变成已验收的成功、已归因的失败，或需要重规划的延续——这是自演化的监督信号来源。',
    write: 'verdict ∈ {success, failure, replan}',
    file: 'attempts',
  },
  {
    name: 'Diagnose',
    actor: 'Agent',
    color: '#7c3aed',
    desc: '结合任务契约、环境转移、运行时事件与既有教训，提出候选原因。注意：此时它只是一个假设。',
    write: 'correction_hypothesis（未验证）',
    file: '诊断记录',
  },
  {
    name: 'Revise',
    actor: 'Agent',
    color: '#7c3aed',
    desc: '恢复策略修改子目标、运行时、目标配置或动作方法，并编译为新的 child session。',
    write: 'revised_strategy → child session',
    file: 'SESSIONS.md',
  },
  {
    name: 'Re-verify',
    actor: 'Runtime + Verifier',
    color: '#27446e',
    desc: '修订后的策略在完全相同的验收语义下重新执行——用同一把尺子确认修复真的有效。',
    write: 'verdict（第二次）',
    file: 'attempts',
  },
  {
    name: 'Consolidate',
    actor: 'Epistemic Memory',
    color: '#f07e47',
    desc: '只有通过再验证的结果才被写 入持久记忆：成功模式进 KNOWLEDGE.md，验证过的纠正进 LESSONS.md。',
    write: 'validated pattern / verified lesson',
    file: 'KNOWLEDGE.md · LESSONS.md',
  },
];

const MEMORY_CARDS = [
  {
    name: 'KNOWLEDGE.md',
    tone: 'good' as const,
    title: '已验证的成功模式',
    lines: [
      'pattern: 深色环境先取火把再外出',
      'scope: Don\'t Starve · 夜间 · 低资源',
      'provenance: sess-0088 → sess-0104 复验',
    ],
  },
  {
    name: 'LESSONS.md',
    tone: 'bad' as const,
    title: '带验证状态的纠正记录',
    lines: [
      'failure: 感知偏移导致闭空',
      'correction: 抓取前对齐真实位置',
      'verified: true · by sess-0141',
    ],
  },
];

export const EvolveLoop: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  return (
    <div className="lab">
      <div className="lab-stage">
        <div className="lab-rail">
          {STEPS.map((st, i) => (
            <React.Fragment key={st.name}>
              {i > 0 ? <span className={`lab-rail-link ${i <= step ? 'is-done' : ''}`} aria-hidden /> : null}
              <button
                type="button"
                className={`lab-rail-node ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
                style={{ '--node-color': st.color } as React.CSSProperties}
                onClick={() => setStep(i)}
                aria-label={`步骤 ${st.name}`}
              >
                <span className="lab-rail-dot">{i < step ? '✓' : i + 1}</span>
                <span className="lab-rail-label">{st.name}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="lab-detail" key={s.name}>
          <div className="lab-detail-head">
            <span className="lab-detail-state">{s.name}</span>
            <span className="lab-detail-plane" style={{ color: s.color, borderColor: s.color }}>
              {s.actor}
            </span>
          </div>
          <p className="lab-detail-desc">{s.desc}</p>
          <div className="lab-detail-write">
            <span className="lab-file-chip">{s.file}</span>
            <code>{s.write}</code>
          </div>

          {/* 假设 → 验证 → 固化 的状态徽章 */}
          {step >= 2 ? (
            <div className="lab-hypo-track">
              <span className="lab-hypo-chip">💡 假设：抓取前先对齐真实位置</span>
              <span className={`lab-hypo-stage ${step >= 4 ? 'is-ok' : ''}`}>
                {step < 4 ? '未验证 · 不得写入' : '已复验 ✓'}
              </span>
              <span className={`lab-hypo-stage ${step >= 5 ? 'is-ok' : ''}`}>
                {step < 5 ? '等待 Consolidate' : '已固化 ✓'}
              </span>
            </div>
          ) : null}
        </div>

        {step === 5 ? (
          <div className="lab-memory-grid">
            {MEMORY_CARDS.map((m) => (
              <div className={`lab-memory-card tone-${m.tone}`} key={m.name}>
                <div className="lab-memory-head">
                  <span className="lab-file-chip">{m.name}</span>
                  <b>{m.title}</b>
                </div>
                {m.lines.map((l) => (
                  <div className="lab-protocol-line" key={l}>
                    <code>{l}</code>
                  </div>
                ))}
              </div>
            ))}
            <div className="lab-memory-note">
              记忆三层：episodic 保留单次会话 · semantic 聚合模式 · methodological 晋升为可复用技能
            </div>
          </div>
        ) : null}
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
      <Feedback tone={step === 5 ? 'good' : step >= 2 && step < 4 ? 'warn' : 'info'}>
        {step < 2 && '闭环的输入永远是「已验证的判定」——没有 Verify，后面每一步都在没有监督信号的情况下猜测。'}
        {step === 2 && '诊断只是假设：最常见的失败模式就是把修复假设当成事实记进记忆。'}
        {step === 3 && '修订可以改变四件事之一：子目标、运行时、目标配置、动作方法——然后编译成新会话。'}
        {step === 4 && '再验证用同一套验收语义：修复是否有效，由判定函数说了算，而不是由提出者说了算。'}
        {step === 5 && 'Consolidate 是唯一的写入口：跨会话、跨任务、跨 embodiment 的自演化由此发生，全程无需重训模型。'}
      </Feedback>
    </div>
  );
};

export default EvolveLoop;
