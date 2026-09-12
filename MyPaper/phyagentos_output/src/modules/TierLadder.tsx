import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 9.1 — 渐进验证：游戏 → 模拟 → 真实机器人。
// 每一层隔离什么、加回什么；认知层在三层之间保持不变。

interface TierDef {
  name: string;
  icon: string;
  color: string;
  isolates: string[];
  adds: string[];
  where: string;
  purpose: string;
}

const TIERS: TierDef[] = [
  {
    name: '游戏层',
    icon: '🎮',
    color: '#228d5c',
    isolates: ['刚体动力学', '传感器噪声', '执行摩擦'],
    adds: [],
    where: 'Minecraft（Optimus-67）· Stardew Valley（StarDojo）· Don’t Starve（DST-Dojo）',
    purpose: '把记忆、规划、自演化当作受控变量来研究：失败只能来自认知层。',
  },
  {
    name: '模拟层',
    icon: '🕹️',
    color: '#27446e',
    isolates: ['硬件噪声', '执行器误差'],
    adds: ['刚体动力学', '碰撞检测', '可配置延迟'],
    where: 'LIBERO · CALVIN ABC→D · RoboCasa365',
    purpose: '物理回归测试：验证认知策略在动力学与延迟下是否仍然成立。',
  },
  {
    name: '真实机器人',
    icon: '🤖',
    color: '#f07e47',
    isolates: [],
    adds: ['硬件噪声', '传感器不确定性', '安全关键约束'],
    where: 'Franka FR3 · AgileX PIPER · Dobot Nova 2 等 19+ 种 embodiment',
    purpose: '安全验证：预检拒绝率、SafetyGuard 拦截有效性、急停延迟。',
  },
];

export const TierLadder: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState(0);
  return (
    <div className="lab">
      <div className="lab-stage">
        <div className="lab-tier-grid">
          {TIERS.map((t, i) => (
            <button
              type="button"
              key={t.name}
              className={`lab-tier-card ${sel === i ? 'is-active' : ''} ${i > 0 ? '' : ''}`}
              style={{ '--tier-color': t.color } as React.CSSProperties}
              onClick={() => setSel(i)}
            >
              <span className="lab-tier-icon" aria-hidden>
                {t.icon}
              </span>
              <span className="lab-tier-name">{t.name}</span>
              <span className="lab-tier-ladder" aria-hidden>
                <i style={{ height: 10 + i * 10 }} />
              </span>
              <span className="lab-tier-tag">{t.isolates.length === 0 ? '全部物理因素' : i === 0 ? '物理全隔离' : '物理逐层加回'}</span>
            </button>
          ))}
          <div className="lab-tier-arrow" aria-hidden>
            物理复杂度 →
          </div>
        </div>

        <div className="lab-tier-detail" key={sel}>
          <div className="lab-tier-cols">
            <div className="lab-tier-col">
              <span className="lab-tier-col-title">隔离了什么</span>
              {TIERS[sel].isolates.length ? (
                TIERS[sel].isolates.map((x) => (
                  <span className="lab-tier-item tone-off" key={x}>
                    ✕ {x}
                  </span>
                ))
              ) : (
                <span className="lab-tier-item tone-off">—（全部保留）</span>
              )}
            </div>
            <div className="lab-tier-col">
              <span className="lab-tier-col-title">加回了什么</span>
              {TIERS[sel].adds.length ? (
                TIERS[sel].adds.map((x) => (
                  <span className="lab-tier-item tone-on" key={x}>
                    ＋ {x}
                  </span>
                ))
              ) : (
                <span className="lab-tier-item tone-on">—（无物理因素）</span>
              )}
            </div>
          </div>
          <div className="lab-tier-where">
            <span className="lab-file-chip">平台 / 基准</span>
            {TIERS[sel].where}
          </div>
          <p className="lab-tier-purpose">{TIERS[sel].purpose}</p>
        </div>

        <div className="lab-shared-band lab-shared-constant">
          <span>认知层在三层之间</span>
          <b>保持不变</b>
          <span>—— 性能下降可以归因到具体层，而不是架构崩塌</span>
        </div>
      </div>
      <Feedback tone="info">
        {sel === 0 && '游戏层里「抓取命令必然成功、观测从不出错」——任何失败都能干净地归因到认知。'}
        {sel === 1 && '模拟层是介于游戏与真机之间的受控物理层：LIBERO 的提升 +0.4~+1.3 pt，RoboCasa365 总体 +7.2~+9.2 pt。'}
        {sel === 2 && '真机层强调安全验证而非大规模统计——预检把每一个故意注入的不兼容配置都挡在了电机控制器之前。'}
      </Feedback>
    </div>
  );
};

export default TierLadder;
