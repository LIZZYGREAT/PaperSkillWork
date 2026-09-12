import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 2.1 — 点击五份协议文件，看各自为共享认知状态贡献哪一类字段。
// 左侧文件列表 + 右侧文件窗口（YAML 风格字段），并标注对应的记忆层次。

interface FileDef {
  name: string;
  role: string;
  memory: string;
  memoryTone: 'info' | 'good' | 'warn' | 'neutral' | 'bad';
  fields: [string, string][];
  contributes: string;
}

const FILES: FileDef[] = [
  {
    name: 'SESSIONS.md',
    role: '事务中心',
    memory: 'episodic · 情景记忆',
    memoryTone: 'info',
    fields: [
      ['id', 'sess-0142'],
      ['objective', '把红色积木放进抽屉'],
      ['runtime / target', 'PolicySkillRuntime · franka-fr3'],
      ['preconditions', '[夹爪为空, 抽屉未锁]'],
      ['acceptance_criteria', '积木位于抽屉内 且 夹爪为空'],
      ['lifecycle', 'running'],
      ['attempts', '[{verdict, evidence_refs}] 追加式'],
    ],
    contributes: '执行契约 + 可审计的解决历史',
  },
  {
    name: 'SKILLRUNTIME.md',
    role: '执行方法库',
    memory: 'procedural · 程序记忆',
    memoryTone: 'warn',
    fields: [
      ['policy_flow', 'required_obs=[rgb, proprio]'],
      ['action_forms', '[atomic, chunk(20)]'],
      ['orchestration', 'runtime-managed loop @10Hz'],
      ['adapters', '[PolicyAdapter, ActionBridge]'],
      ['params', '{ctrl_freq: 10Hz, timeout: 45s}'],
    ],
    contributes: '执行方法需要什么、产出什么',
  },
  {
    name: 'TARGETS.md',
    role: '目标端库',
    memory: '能力约束',
    memoryTone: 'neutral',
    fields: [
      ['type', 'robot-arm (franka-fr3)'],
      ['capabilities', '[grasp, place, open_drawer]'],
      ['obs_modalities', '[rgb, depth, proprio]'],
      ['action_semantics', 'ee-pose @ 10Hz'],
      ['constraints', '{ws_bounds, speed, e_stop: local}'],
    ],
    contributes: '目标端能力、模态与安全约束',
  },
  {
    name: 'ENVIRONMENT.md',
    role: '环境快照',
    memory: 'working · 工作记忆',
    memoryTone: 'good',
    fields: [
      ['entities', '[cup#7, drawer#2, table]'],
      ['relations', '{cup#7: on(table)}'],
      ['state_changes', '[cup#7.moved → 未发生]'],
      ['evidence_ptrs', '[obs/0042.png, obs/0087.png]'],
    ],
    contributes: '实体、关系与任务相关状态（非原始传感流）',
  },
  {
    name: 'LESSONS.md',
    role: '经验记录',
    memory: 'semantic · 语义记忆',
    memoryTone: 'bad',
    fields: [
      ['lesson#31.objective', 'grasp(cup#7)'],
      ['cause', '感知位置偏移 1.8cm，闭空'],
      ['correction', '抓取前先对齐真实位置'],
      ['verified', 'true（由 sess-0141 复验）'],
      ['provenance', 'franka-fr3 · tabletop 场景'],
    ],
    contributes: '失败原因 + 已验证的纠正及其适用范围',
  },
];

export const ProtocolViews: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState(0);
  const f = FILES[sel];
  return (
    <div className="lab">
      <div className="lab-stage lab-protocol">
        <div className="lab-protocol-tabs" role="tablist" aria-label="协议文件">
          {FILES.map((file, i) => (
            <button
              key={file.name}
              role="tab"
              aria-selected={sel === i}
              className={`lab-file-tab ${sel === i ? 'is-active' : ''}`}
              onClick={() => setSel(i)}
            >
              <span className="lab-file-icon" aria-hidden>📄</span>
              <span className="lab-file-name">{file.name}</span>
              <span className="lab-file-role">{file.role}</span>
            </button>
          ))}
        </div>
        <div className="lab-protocol-window" key={f.name}>
          <div className="lab-protocol-head">
            <span className="lab-protocol-dot" aria-hidden />
            <span className="lab-protocol-title">{f.name}</span>
            <span className={`lab-pill tone-${f.memoryTone}`}>{f.memory}</span>
          </div>
          <div className="lab-protocol-body">
            {f.fields.map(([k, v]) => (
              <div className="lab-protocol-line" key={k}>
                <span className="lab-protocol-key">{k}</span>
                <span className="lab-protocol-val">{v}</span>
              </div>
            ))}
          </div>
          <div className="lab-protocol-foot">
            <span className="lab-protocol-foot-label">贡献给共享状态</span>
            {f.contributes}
          </div>
        </div>
      </div>
      <Feedback tone="info">
        五份文档合起来构成统一认知状态空间：意图、能力、环境、执行状态与历史经验对齐到同一参照系——两层读同一份文件，而不是互访私有对象。
      </Feedback>
    </div>
  );
};

export default ProtocolViews;
