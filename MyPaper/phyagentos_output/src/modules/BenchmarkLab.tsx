import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 10.1 — 按协议比较 First/Final 或 本文方法/最强基线。
// 每个基准的数值只在自己的协议内对齐；单位与指标方向必须一起看。

type DS = 'optimus' | 'stardojo' | 'dst' | 'libero' | 'calvin' | 'robocasa';

interface Group {
  name: string;
  a: number; // 基线 / First
  b: number; // 本文 / Final
  note?: string;
}

interface DatasetDef {
  chip: string;
  aLabel: string;
  bLabel: string;
  aColor: string;
  bColor: string;
  metric: string;
  higherBetter: boolean;
  protocol: string;
  limit: string;
  highlight?: number; // 重点关注组
  groups: Group[];
}

const DATA: Record<DS, DatasetDef> = {
  optimus: {
    chip: 'Optimus-67 · Minecraft',
    aLabel: '最强基线 Optimus-3',
    bLabel: 'PhyAgentOS',
    aColor: '#8b97ab',
    bColor: '#228d5c',
    metric: '成功率 SR（更高更好）',
    higherBetter: true,
    protocol: '67 个长程任务 · 7 组难度（表 1）',
    limit: 'Armor 15% 落后于 Optimus-3 的 23%：终局装备生产仍是前沿任务。',
    highlight: 5,
    groups: [
      { name: 'Wood', a: 99, b: 99 },
      { name: 'Stone', a: 95, b: 96 },
      { name: 'Iron', a: 55, b: 52 },
      { name: 'Gold', a: 10, b: 6 },
      { name: 'Diamond', a: 15, b: 19, note: '+4 pt' },
      { name: 'RedStone', a: 29, b: 30, note: '超过全部已报告基线' },
      { name: 'Armor', a: 23, b: 15 },
    ],
  },
  stardojo: {
    chip: 'StarDojo Lite-100',
    aLabel: '最强基线 SPIKE (Qwen3.5-397B)',
    bLabel: 'PhyAgentOS（纯文本 deepseek-v4-flash）',
    aColor: '#8b97ab',
    bColor: '#228d5c',
    metric: '成功率（更高更好）',
    higherBetter: true,
    protocol: '100 个程序化生成任务 · 五类能力（表 2）',
    limit: 'hard 任务 0.0%、medium 3.7%：成功集中在 easy（37.5%）。',
    highlight: 1,
    groups: [
      { name: 'Farming', a: 34.9, b: 28.6 },
      { name: 'Crafting', a: 23.8, b: 50.0, note: '+26.2 pt，验证过的配方累积在 KNOWLEDGE.md' },
      { name: 'Exploration', a: 13.1, b: 17.9 },
      { name: 'Combat', a: 8.3, b: 16.7 },
      { name: 'Social', a: 10.7, b: 8.0 },
      { name: 'Total', a: 18.0, b: 22.0, note: 'GPT-4.1 多模态为 12.7%' },
    ],
  },
  dst: {
    chip: 'DST-Dojo · 饥荒',
    aLabel: 'Raw LLM',
    bLabel: '+ PhyAgentOS',
    aColor: '#8b97ab',
    bColor: '#228d5c',
    metric: '生存指标（见各组方向）',
    higherBetter: true,
    protocol: 'DeepSeek v4 Flash · 秋 0 日 · 白天开局 · 10 episodes（表 3）',
    limit: '黑暗（Charlie）仍是主要死因（80%）；饿死上升到 10%——活得更久、吃得多。',
    groups: [
      { name: '生存天数', a: 1.02, b: 2.1, note: '×2.06' },
      { name: '第 3 天存活率 %', a: 0, b: 30, note: '0% → 30%' },
      { name: '黑暗致死 %（更低好）', a: 90, b: 80 },
      { name: '怪物致死 %', a: 10, b: 10 },
    ],
  },
  libero: {
    chip: 'LIBERO · 操作',
    aLabel: 'First（策略首试）',
    bLabel: 'Final（验证器触发恢复后）',
    aColor: '#8b97ab',
    bColor: '#228d5c',
    metric: '总体成功率（更高更好）',
    higherBetter: true,
    protocol: '四个策略后端 · 只在失败后介入 · 不改权重（表 4）',
    limit: '首试成功率已很高的后端留给恢复的空间很小——增益 +0.4~+1.3 pt。',
    groups: [
      { name: 'OpenVLA', a: 74.5, b: 75.5, note: '+1.0' },
      { name: 'π0', a: 92.8, b: 93.2, note: '+0.4' },
      { name: 'π0.5', a: 97.0, b: 97.8, note: '+0.8' },
      { name: 'X-VLA', a: 97.3, b: 98.6, note: '+1.3' },
    ],
  },
  calvin: {
    chip: 'CALVIN ABC→D · 长程链',
    aLabel: 'First',
    bLabel: 'Final',
    aColor: '#8b97ab',
    bColor: '#228d5c',
    metric: '5/5 全链完成率（更高更好）',
    higherBetter: true,
    protocol: '五子任务链 · 中途不重置环境（表 5）',
    limit: 'π0 平均完成子任务数 3.125 → 3.249：链中段恢复是主要收益来源。',
    highlight: 1,
    groups: [
      { name: 'X-VLA', a: 74.3, b: 75.7, note: '+1.4' },
      { name: 'π0', a: 38.9, b: 45.6, note: '+6.7 pt' },
      { name: 'π0.5', a: 85.3, b: 89.4, note: '+4.1 pt' },
    ],
  },
  robocasa: {
    chip: 'RoboCasa365 · 家务',
    aLabel: 'First',
    bLabel: 'Final',
    aColor: '#8b97ab',
    bColor: '#228d5c',
    metric: '总体成功率（更高更好）',
    higherBetter: true,
    protocol: 'target50 · 18 原子技能 + 32 复合活动 · 250 episodes（表 6）',
    limit: 'π0.5 的复合活动仅 4.4% → 10.0%：长程家务失败大部分仍不可恢复。',
    highlight: 0,
    groups: [
      { name: 'π0.5', a: 17.6, b: 26.8, note: '+9.2 pt · 救回 23 个 episode' },
      { name: 'RLDX-1', a: 35.6, b: 42.8, note: '+7.2 pt · 救回 18 个' },
      { name: 'WorldDreamer', a: 34.0, b: 42.4, note: '+8.4 pt · 救回 21 个' },
    ],
  },
};

export const BenchmarkLab: React.FC<WidgetProps> = () => {
  const [ds, setDs] = useState<DS>('robocasa');
  const d = DATA[ds];
  const max = Math.max(...d.groups.flatMap((g) => [g.a, g.b]));
  return (
    <div className="lab">
      <div className="lab-controls lab-controls-top lab-choice-wrap">
        {(Object.keys(DATA) as DS[]).map((k) => (
          <button
            type="button"
            key={k}
            className={`lab-chip ${ds === k ? 'is-active' : ''}`}
            onClick={() => setDs(k)}
          >
            {DATA[k].chip}
          </button>
        ))}
      </div>

      <div className="lab-stage" key={ds}>
        <div className="lab-chart-head">
          <span className="lab-chart-metric">{d.metric}</span>
          <span className="lab-chart-protocol">{d.protocol}</span>
        </div>
        <div className="lab-legend">
          <span className="lab-legend-item">
            <i style={{ background: d.aColor }} /> {d.aLabel}
          </span>
          <span className="lab-legend-item">
            <i style={{ background: d.bColor }} /> {d.bLabel}
          </span>
        </div>
        <div className="lab-chart">
          {d.groups.map((g, gi) => (
            <div className={`lab-chart-group ${d.highlight === gi ? 'is-hot' : ''}`} key={g.name}>
              <div className="lab-chart-name">{g.name}</div>
              <div className="lab-chart-bars">
                <div className="lab-chart-bar-row">
                  <div className="lab-chart-bar">
                    <i
                      style={{
                        width: `${(g.a / max) * 100}%`,
                        background: d.aColor,
                        animationDelay: `${gi * 60}ms`,
                      }}
                    />
                    <span className="lab-chart-val">{g.a}</span>
                  </div>
                  <div className="lab-chart-bar">
                    <i
                      className="is-ours"
                      style={{
                        width: `${(g.b / max) * 100}%`,
                        background: d.bColor,
                        animationDelay: `${gi * 60 + 90}ms`,
                      }}
                    />
                    <span className="lab-chart-val is-ours">{g.b}</span>
                  </div>
                </div>
                {g.note ? <div className="lab-chart-note">{g.note}</div> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="lab-chart-limit">
          <span className="lab-chart-limit-label">诚实的边界</span>
          {d.limit}
        </div>
      </div>

      <Feedback tone="info">
        数值只在同一协议内对齐：First / Final 的含义、数据集、单位与指标方向必须一起看——PhyAgentOS 不把不同 benchmark 的数字拼成一个总分。
      </Feedback>
    </div>
  );
};

export default BenchmarkLab;
