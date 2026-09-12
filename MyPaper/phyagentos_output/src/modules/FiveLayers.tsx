import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 9.2 — 选择一类故障，看它在五层纵深防御中被哪一层拦下。

interface LayerDef {
  name: string;
  icon: string;
  color: string;
  duty: string;
}

const LAYERS: LayerDef[] = [
  { name: '兼容性预检', icon: '🧾', color: '#27446e', duty: '评估 SkillRuntime、策略、适配器与目标端能否构成合法执行链；产出 AdapterPlan 与 TargetToolManifest。' },
  { name: 'ActionBridge', icon: '🔧', color: '#27446e', duty: '确定性的表示转换：坐标、单位、维度、夹爪映射、动作块重采样；有界投影保留语义。' },
  { name: 'SafetyGuard', icon: '🛡️', color: '#f07e47', duty: '决定命令是否可发：数据类型与维度、NaN/无穷、关节与工作空间限位、速度/加速度、命令时长、频率、急停状态。' },
  { name: '心跳监测', icon: '💓', color: '#7c3aed', duty: '监控 Runner、策略服务与目标端心跳；失联触发超时处理、取消传播与受控终止。' },
  { name: '目标端本地约束', icon: '⚙️', color: '#228d5c', duty: '关节限位、碰撞检测、扭矩/速度限制、硬件急停——最内层、始终生效的最终权威。' },
];

interface FaultDef {
  chip: string;
  layer: number; // 被哪一层拦下
  code: string;
  what: string;
}

const FAULTS: FaultDef[] = [
  {
    chip: '技能需要 RGB，目标只有文本',
    layer: 0,
    code: 'PREFLIGHT_REJECT',
    what: '观测契约无交集，AdapterPlan 无法构成——会话在获得目标端访问权之前被拒绝，物理世界零成本。',
  },
  {
    chip: '坐标系不匹配的关节指令',
    layer: 1,
    code: 'BRIDGE_TRANSFORM',
    what: 'ActionBridge 做坐标转换与单位归一：这是格式转换，不是安全判定——转换后的命令还要继续接受 SafetyGuard 检查。',
  },
  {
    chip: '超出工作空间的末端位置',
    layer: 2,
    code: 'WS_LIMIT',
    what: 'SafetyGuard 拒绝或把指令有界投影回合法范围，附结构化违规码写入证据——安全干预因此可与策略错误区分。',
  },
  {
    chip: '策略服务进程失联',
    layer: 3,
    code: 'HEARTBEAT_TIMEOUT',
    what: '心跳缺失触发超时处理与取消传播：执行路径被受控终止，动作块的生命周期同时被切断。',
  },
  {
    chip: '末端撞击导致急停触发',
    layer: 4,
    code: 'E_STOP_LOCAL',
    what: '目标端本地约束在最靠近执行器的位置保留最终安全权威——即使上面四层全部失效，它仍然生效。',
  },
];

export const FiveLayers: React.FC<WidgetProps> = () => {
  const [fault, setFault] = useState(0);
  const hit = FAULTS[fault].layer;
  return (
    <div className="lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group lab-choice-wrap">
          <span className="lab-choice-label">注入故障</span>
          {FAULTS.map((f, i) => (
            <button
              type="button"
              key={f.chip}
              className={`lab-chip ${fault === i ? 'is-active' : ''}`}
              onClick={() => setFault(i)}
            >
              {f.chip}
            </button>
          ))}
        </div>
      </div>

      <div className="lab-stage lab-layers-stage" key={fault}>
        <div className="lab-layers">
          {LAYERS.map((l, i) => {
            const isHit = i === hit;
            const isPassed = i < hit;
            return (
              <div
                className={`lab-layer ${isHit ? 'is-hit' : ''} ${isPassed ? 'is-passed' : ''}`}
                style={{ '--layer-color': l.color, '--i': i } as React.CSSProperties}
                key={l.name}
              >
                <span className="lab-layer-icon" aria-hidden>{l.icon}</span>
                <div className="lab-layer-body">
                  <div className="lab-layer-name">
                    第 {i + 1} 层 · {l.name}
                    {isHit ? <span className="lab-layer-badge">拦截点</span> : null}
                    {isPassed ? <span className="lab-layer-badge is-pass">已通过</span> : null}
                  </div>
                  <div className="lab-layer-duty">{l.duty}</div>
                </div>
                <code className={`lab-layer-code ${isHit ? 'is-in' : ''}`}>{isHit ? FAULTS[fault].code : ''}</code>
              </div>
            );
          })}
        </div>
        <div className={`lab-layers-why ${'is-in'}`}>
          <b>{LAYERS[hit].name}</b>
          {FAULTS[fault].what}
        </div>
      </div>

      <Feedback tone="warn">
        五层各管一类失败，越内层越不可替代：预检挡结构、桥接管转换、SafetyGuard 判可发性、心跳管失联、目标端保留物理最终权威。
      </Feedback>
    </div>
  );
};

export default FiveLayers;
