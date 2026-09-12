import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Chip } from './kit';

// Lab 6.1 — 切换 PolicySkillRuntime 与 BuiltinSkillRuntime：
// 决策循环的位置改变，会话 / 监督 / 证据边界保持不变。

const BLUE = '#27446e';
const PURPLE = '#7c3aed';
const ORANGE = '#f07e47';
const SLATE = '#5b6b84';
const GREEN = '#228d5c';
const INK = '#21324a';
const MUTED = '#68778f';

function Node({
  x,
  y,
  w = 132,
  title,
  sub,
  color,
  active,
}: {
  x: number;
  y: number;
  w?: number;
  title: string;
  sub?: string;
  color: string;
  active?: boolean;
}) {
  const h = sub ? 48 : 36;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={10}
        fill={active ? color : '#fff'}
        stroke={color}
        strokeWidth={active ? 2.5 : 1.6}
      />
      <text
        x={x}
        y={sub ? y - 3 : y + 5}
        textAnchor="middle"
        fontSize={13.5}
        fontWeight={700}
        fill={active ? '#fff' : INK}
      >
        {title}
      </text>
      {sub ? (
        <text x={x} y={y + 14} textAnchor="middle" fontSize={10.5} fill={active ? 'rgba(255,255,255,.85)' : MUTED}>
          {sub}
        </text>
      ) : null}
    </g>
  );
}

const LOOP = 'M 360 78 A 92 92 0 0 1 452 170 A 92 92 0 0 1 360 262 A 92 92 0 0 1 268 170 A 92 92 0 0 1 360 78';
const SEGS = [
  'M 360 78 A 92 92 0 0 1 452 170',
  'M 452 170 A 92 92 0 0 1 360 262',
  'M 360 262 A 92 92 0 0 1 268 170',
  'M 268 170 A 92 92 0 0 1 360 78',
];

export const DualFlow: React.FC<WidgetProps> = () => {
  const [flow, setFlow] = useState<'policy' | 'tool'>('policy');
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!mq?.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq?.addEventListener?.('change', fn);
    return () => mq?.removeEventListener?.('change', fn);
  }, []);

  return (
    <div className="lab">
      <div className="lab-controls lab-controls-center">
        <div className="lab-choice-group">
          <Chip active={flow === 'policy'} onClick={() => setFlow('policy')}>
            PolicySkillRuntime · 策略流
          </Chip>
          <Chip active={flow === 'tool'} onClick={() => setFlow('tool')}>
            BuiltinSkillRuntime · 工具流
          </Chip>
        </div>
      </div>

      <div className="lab-stage" key={flow}>
        <svg viewBox="0 0 720 318" role="img" aria-label={flow === 'policy' ? '策略流循环' : '工具流循环'}>
          <defs>
            <marker id="df-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={SLATE} />
            </marker>
          </defs>

          {/* 循环弧线 + 箭头 */}
          {SEGS.map((d) => (
            <path key={d} d={d} fill="none" stroke={SLATE} strokeWidth={2} opacity={0.7} markerEnd="url(#df-arrow)" />
          ))}

          {/* 循环中的运动点 */}
          {!reduced ? (
            <circle r={6.5} fill={flow === 'policy' ? BLUE : PURPLE}>
              <animateMotion dur="3.4s" repeatCount="indefinite" path={LOOP} />
            </circle>
          ) : null}

          {/* 顶部说明（节点之间的空白区） */}
          <text x={360} y={26} textAnchor="middle" fontSize={12.5} fill={MUTED} fontWeight={600}>
            {flow === 'policy' ? '循环在运行层内：观测 → 推断 → 动作' : '决策点在 Agent：观测 → 决策 → 调用工具'}
          </text>

          {flow === 'policy' ? (
            <>
              <Node x={360} y={78} title="SessionRunner" sub="受控执行生命周期" color={BLUE} active />
              <Node x={452} y={170} w={124} title="Policy (VLA)" sub="动作 / 动作块" color={BLUE} active />
              <Node x={360} y={262} w={110} title="Target" sub="受控接口" color={SLATE} active />
              <Node x={268} y={170} w={124} title="ActionBridge" sub="表示转换" color={BLUE} active />
              {/* 循环外：Agent */}
              <Node x={128} y={78} w={150} title="Agent 平面" sub="编译会话后退出循环" color={PURPLE} />
              <path d="M 205 96 Q 250 84 292 80" fill="none" stroke={PURPLE} strokeWidth={1.8} strokeDasharray="5 5" markerEnd="url(#df-arrow)" />
              <text x={128} y={116} textAnchor="middle" fontSize={10.5} fill={PURPLE}>
                不进入低层循环
              </text>
              {/* Watchdog */}
              <Node x={590} y={78} w={150} title="Watchdog" sub="心跳监督（循环外）" color={ORANGE} />
              <path d="M 516 86 Q 560 76 585 84" fill="none" stroke={ORANGE} strokeWidth={1.8} strokeDasharray="5 5" />
              <text x={612} y={130} textAnchor="middle" fontSize={10.5} fill={ORANGE}>
                心跳 · 超时 · 取消
              </text>
              <text x={360} y={305} textAnchor="middle" fontSize={13} fill={BLUE} fontWeight={700} fontFamily="Georgia, serif">
                Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)
              </text>
            </>
          ) : (
            <>
              <Node x={360} y={78} title="Watchdog" sub="心跳监督（循环外）" color={ORANGE} />
              <Node x={452} y={170} w={124} title="Agent" sub="在线决策" color={PURPLE} active />
              <Node x={360} y={262} w={110} title="Target" sub="受控接口" color={SLATE} active />
              <Node x={268} y={170} w={132} title="SessionHandle" sub="Manifest 过滤" color={PURPLE} active />
              <text x={268} y={214} textAnchor="middle" fontSize={10.5} fill={PURPLE}>
                只暴露过滤后的受控工具
              </text>
              <text x={360} y={305} textAnchor="middle" fontSize={13} fill={PURPLE} fontWeight={700} fontFamily="Georgia, serif">
                Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)
              </text>
            </>
          )}
        </svg>

        <div className="lab-shared-band">
          <span>两条流共享</span>
          <b>同一会话</b>
          <b>Watchdog 监督</b>
          <b>目标端声明</b>
          <b>结构化证据包</b>
        </div>
      </div>

      <Feedback tone={flow === 'policy' ? 'info' : ''}>
        {flow === 'policy'
          ? '策略流：PhyAgentOS 负责让动作「可执行、安全、可追溯」，策略只负责产出动作——观测归一化、动作块缓冲与安全夹紧都在运行层完成。'
          : '工具流：Agent 动态调整执行序列，但权限来自 TargetToolManifest，心跳与审计仍由运行时持有——在线参与不等于开放权限。'}
      </Feedback>
    </div>
  );
};

export default DualFlow;
