import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 8.1 — 点击架构组件，追踪它参与的可审计路径：
// 谁规划、谁监督、谁执行、谁验证，全部落在一张图上。

type NodeId =
  | 'planner'
  | 'compiler'
  | 'selector'
  | 'protocol'
  | 'watchdog'
  | 'runner'
  | 'skillruntime'
  | 'target'
  | 'verifier';

interface NodeDef {
  title: string;
  sub?: string;
  plane: string;
  color: string;
  duty: string;
  out: string;
}

const NODES: Record<NodeId, NodeDef> = {
  planner: {
    title: 'Goal Planner',
    plane: 'Agent 平面',
    color: '#7c3aed',
    duty: '把自然语言请求解释为任务目标，并锁定执行中必须保持不变的约束。',
    out: '目标表示 + 约束',
  },
  compiler: {
    title: 'Goal Graph / Session Compiler',
    plane: 'Agent 平面',
    color: '#7c3aed',
    duty: '按依赖关系分解目标，把每个可执行单元编译成会话契约。',
    out: '写入 SESSIONS.md 的会话',
  },
  selector: {
    title: 'SkillRuntime-Target Selector',
    plane: 'Agent 平面',
    color: '#7c3aed',
    duty: '匹配能力、观测模态、动作语义与目标约束，决定「在哪跑、怎么跑」。',
    out: '绑定运行时与目标端的会话',
  },
  protocol: {
    title: '协议边界（State-as-a-File）',
    plane: '共享状态',
    color: '#27446e',
    duty: '记录请求了什么、选了哪种能力与目标、当前观测到什么、学到了什么。两个平面之间唯一的通道。',
    out: 'SESSIONS / SKILLRUNTIME / TARGETS / ENVIRONMENT / LESSONS + YAML',
  },
  watchdog: {
    title: 'WatchdogSupervisor',
    plane: 'Runtime 平面',
    color: '#f07e47',
    duty: '唯一监督入口：认领会话、执行预检、创建 Runner、监控心跳、写回终止结果。监督而不控制。',
    out: '受监督的会话生命周期',
  },
  runner: {
    title: 'SessionRunner',
    plane: 'Runtime 平面',
    color: '#27446e',
    duty: '拥有具体交互的生命周期：重置、观测获取、终止条件、证据收集。',
    out: '证据包（S₀ / S_T / τ / 事件）',
  },
  skillruntime: {
    title: 'SkillRuntime',
    plane: 'Runtime 平面',
    color: '#27446e',
    duty: '供给任务执行逻辑：策略流（VLA 推理）或工具流（Agent 调用受控工具）。',
    out: '动作 / 动作块 / 工具调用',
  },
  target: {
    title: 'Target',
    plane: '目标端',
    color: '#5b6b84',
    duty: '游戏引擎、模拟器或机器人 SDK 的受控接口；保留本地安全权威（限位、碰撞、急停）。',
    out: '观测 + 执行状态',
  },
  verifier: {
    title: 'SessionVerifier',
    plane: '语义验收',
    color: '#228d5c',
    duty: '把证据包与接受标准对齐，区分「执行终止」与「任务完成」。不产生动作，只产出判定。',
    out: 'success / failure / replan + 状态转移',
  },
};

// 每个节点被选中时高亮的路径（边 id 集合）
const HOT_PATHS: Record<NodeId, string[]> = {
  planner: ['e-planner-compiler', 'e-compiler-selector', 'e-selector-protocol', 'e-protocol-watchdog'],
  compiler: ['e-planner-compiler', 'e-compiler-selector', 'e-selector-protocol', 'e-protocol-watchdog'],
  selector: ['e-planner-compiler', 'e-compiler-selector', 'e-selector-protocol', 'e-protocol-watchdog'],
  protocol: ['e-selector-protocol', 'e-protocol-watchdog', 'e-verifier-protocol'],
  watchdog: ['e-protocol-watchdog', 'e-wd-runner', 'e-runner-sr', 'e-sr-target'],
  runner: ['e-wd-runner', 'e-runner-sr', 'e-sr-target', 'e-runner-verifier'],
  skillruntime: ['e-runner-sr', 'e-sr-target'],
  target: ['e-sr-target'],
  verifier: ['e-runner-verifier', 'e-verifier-protocol'],
};

// 每个节点被选中时同时点亮的相关节点
const HOT_NODES: Record<NodeId, NodeId[]> = {
  planner: ['planner', 'compiler', 'selector', 'protocol', 'watchdog'],
  compiler: ['planner', 'compiler', 'selector', 'protocol', 'watchdog'],
  selector: ['planner', 'compiler', 'selector', 'protocol', 'watchdog'],
  protocol: ['protocol', 'selector', 'watchdog', 'verifier'],
  watchdog: ['watchdog', 'runner', 'skillruntime', 'target', 'protocol'],
  runner: ['runner', 'skillruntime', 'target', 'verifier', 'watchdog'],
  skillruntime: ['skillruntime', 'target', 'runner'],
  target: ['target', 'skillruntime'],
  verifier: ['verifier', 'runner', 'protocol'],
};

const GEO: Record<string, { x: number; y: number; w: number; h: number }> = {
  planner: { x: 40, y: 74, w: 200, h: 48 },
  compiler: { x: 285, y: 74, w: 210, h: 48 },
  selector: { x: 540, y: 74, w: 200, h: 48 },
  watchdog: { x: 55, y: 316, w: 190, h: 48 },
  runner: { x: 310, y: 316, w: 180, h: 48 },
  skillruntime: { x: 565, y: 316, w: 170, h: 48 },
  verifier: { x: 55, y: 400, w: 190, h: 40 },
  target: { x: 565, y: 400, w: 170, h: 40 },
};

const FILES: { name: string; cx: number; w: number }[] = [
  { name: 'SESSIONS', cx: 92, w: 104 },
  { name: 'SKILLRUNTIME', cx: 217, w: 122 },
  { name: 'TARGETS', cx: 338, w: 96 },
  { name: 'ENVIRONMENT', cx: 459, w: 122 },
  { name: 'LESSONS', cx: 580, w: 96 },
  { name: 'safety.yaml', cx: 688, w: 96 },
];

const EDGES: { id: string; d: string; dashed?: boolean }[] = [
  { id: 'e-planner-compiler', d: 'M 240 98 L 285 98' },
  { id: 'e-compiler-selector', d: 'M 495 98 L 540 98' },
  { id: 'e-selector-protocol', d: 'M 640 122 V 170', dashed: true },
  { id: 'e-protocol-watchdog', d: 'M 150 250 V 316', dashed: true },
  { id: 'e-wd-runner', d: 'M 245 340 L 310 340' },
  { id: 'e-runner-sr', d: 'M 490 340 L 565 340' },
  { id: 'e-sr-target', d: 'M 650 364 V 400' },
  { id: 'e-runner-verifier', d: 'M 400 364 Q 300 402 249 417' },
  { id: 'e-verifier-protocol', d: 'M 150 400 V 250', dashed: true },
];

function ArchNode({
  id,
  geo,
  selected,
  hot,
  onSelect,
}: {
  id: NodeId;
  geo: { x: number; y: number; w: number; h: number };
  selected: boolean;
  hot: boolean;
  onSelect: (id: NodeId) => void;
}) {
  const n = NODES[id];
  const dim = selected && !hot;
  const fill = selected ? n.color : hot ? `${n.color}14` : '#fff';
  return (
    <g
      onClick={() => onSelect(id)}
      className={`lab-arch-node ${selected ? 'is-selected' : ''} ${dim ? 'is-dim' : ''}`}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={n.title}
    >
      <rect
        x={geo.x}
        y={geo.y}
        width={geo.w}
        height={geo.h}
        rx={10}
        fill={fill}
        stroke={selected || hot ? n.color : '#c9d2e0'}
        strokeWidth={selected ? 2.4 : 1.5}
      />
      <text
        x={geo.x + geo.w / 2}
        y={geo.y + (id === 'compiler' || id === 'selector' ? 22 : 29)}
        textAnchor="middle"
        fontSize={id === 'compiler' ? 12 : 13.5}
        fontWeight={700}
        fill={selected ? '#fff' : '#21324a'}
      >
        {n.title.length > 22 ? n.title.slice(0, 22) + '…' : n.title}
      </text>
      {id === 'compiler' || id === 'selector' ? (
        <text x={geo.x + geo.w / 2} y={geo.y + 38} textAnchor="middle" fontSize={10} fill={selected ? 'rgba(255,255,255,.8)' : '#68778f'}>
          {id === 'compiler' ? '分解目标 · 编译会话' : '选择运行时与目标端'}
        </text>
      ) : null}
    </g>
  );
}

export const ArchMap: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<NodeId>('watchdog');
  const n = NODES[sel];
  const hotEdges = new Set(HOT_PATHS[sel]);
  const hotNodes = new Set(HOT_NODES[sel]);

  return (
    <div className="lab">
      <div className="lab-stage">
        <svg viewBox="0 0 760 470" role="img" aria-label="PhyAgentOS 架构图，可点击组件">
          {/* 平面底板 */}
          <rect x={20} y={30} width={720} height={110} rx={14} fill="rgba(124,58,237,0.05)" />
          <text x={38} y={56} fontSize={13} fontWeight={700} fill="#7c3aed">
            Agent 平面 · 决定做什么
          </text>
          <rect x={20} y={170} width={720} height={80} rx={14} fill="rgba(39,68,110,0.05)" />
          <text x={38} y={194} fontSize={13} fontWeight={700} fill="#27446e">
            协议边界 · 显式状态 · 可审计 · 松耦合
          </text>
          <rect x={20} y={270} width={720} height={184} rx={14} fill="rgba(39,68,110,0.04)" />
          <text x={38} y={296} fontSize={13} fontWeight={700} fill="#27446e">
            Runtime 平面 · 决定怎么做
          </text>

          {/* 边 */}
          {EDGES.map((e) => (
            <path
              key={e.id}
              d={e.d}
              fill="none"
              stroke={hotEdges.has(e.id) ? '#27446e' : '#c9d2e0'}
              strokeWidth={hotEdges.has(e.id) ? 2.6 : 1.6}
              strokeDasharray={e.dashed ? '6 5' : undefined}
              markerEnd="url(#arch-arrow)"
              className={hotEdges.has(e.id) ? 'is-hot' : ''}
            />
          ))}
          <defs>
            <marker id="arch-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6.5} markerHeight={6.5} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8fa1bb" />
            </marker>
          </defs>

          {/* 协议文件 chips */}
          {FILES.map((f) => (
            <g
              key={f.name}
              className={`lab-arch-file ${sel === 'protocol' ? 'is-selected' : hotEdges.has('e-selector-protocol') ? 'is-hot' : ''}`}
              onClick={() => setSel('protocol')}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={f.cx - f.w / 2}
                y={210}
                width={f.w}
                height={28}
                rx={8}
                fill={sel === 'protocol' ? '#27446e' : '#fff'}
                stroke={sel === 'protocol' ? '#27446e' : '#c9d2e0'}
              />
              <text
                x={f.cx}
                y={228}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={600}
                fontFamily="var(--ui-font-mono)"
                fill={sel === 'protocol' ? '#fff' : '#27446e'}
              >
                {f.name}
              </text>
            </g>
          ))}

          {/* 节点 */}
          {(Object.keys(GEO) as NodeId[]).map((id) => (
            <ArchNode
              key={id}
              id={id}
              geo={GEO[id]}
              selected={sel === id}
              hot={sel !== id && hotNodes.has(id)}
              onSelect={setSel}
            />
          ))}
        </svg>

        <div className="lab-detail lab-arch-detail" key={sel}>
          <div className="lab-detail-head">
            <span className="lab-detail-state">{n.title}</span>
            <span className="lab-detail-plane" style={{ color: n.color, borderColor: n.color }}>
              {n.plane}
            </span>
          </div>
          <p className="lab-detail-desc">{n.duty}</p>
          <div className="lab-detail-write">
            <span className="lab-file-chip">输出</span>
            <code>{n.out}</code>
          </div>
        </div>
      </div>
      <Feedback tone="info">
        高亮的路径就是该组件参与的责任链——例如选中 WatchdogSupervisor 时，能看到它从协议认领会话、驱动 Runner 与 SkillRuntime、直到 Target 的完整监督链。
      </Feedback>
    </div>
  );
};

export default ArchMap;
