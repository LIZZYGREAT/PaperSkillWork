import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Chip } from './kit';

// Lab 6.1 — 切换 PolicySkillRuntime 与 BuiltinSkillRuntime：
// 决策循环的位置改变，会话 / 监督 / 证据边界保持不变。
// 布局：三个环节节点位于循环圈外侧（上 / 右 / 左），运动小球沿内侧圆环
// 流动且从不进入任何节点矩形；Watchdog / Agent 平面是循环外角色，放在上角。
// 几何约定：圆心 (360,182) 半径 88；顶部说明文字与站点节点之间保留 ≥10px 间距；
// Watchdog 监视线终点精确落在圆周 45° 点 (422.2, 119.8) 上。

const BLUE = '#27446e';
const PURPLE = '#7c3aed';
const ORANGE = '#f07e47';
const SLATE = '#5b6b84';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#b9c4d6';

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
        strokeWidth={active ? 2.4 : 1.6}
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

// 循环圈：圆心 (360,182)，半径 88；三站点位于正上 (360,94)、正右 (448,182)、正左 (272,182)
const LOOP = 'M 360 94 A 88 88 0 0 1 448 182 A 88 88 0 0 1 360 270 A 88 88 0 0 1 272 182 A 88 88 0 0 1 360 94';
// 可见弧线：上→右、右经底部→左（整段半圆）、左→上，合成完整圆周
const SEGS = [
  'M 360 94 A 88 88 0 0 1 448 182',
  'M 448 182 A 88 88 0 0 1 272 182',
  'M 272 182 A 88 88 0 0 1 360 94',
];
// 站点连接线（节点边缘 → 圆环）
const SPOKES = ['M 360 82 L 360 94', 'M 521 182 L 448 182', 'M 190 182 L 272 182'];

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
        <svg viewBox="0 0 720 360" role="img" aria-label={flow === 'policy' ? '策略流循环' : '工具流循环'}>
          <defs>
            <marker id="df-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={SLATE} />
            </marker>
            <marker id="df-arrow-purple" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={PURPLE} />
            </marker>
          </defs>

          {/* 顶部说明（基线 y=22，与站点节点顶边 y=34 之间留 12px 间距） */}
          <text x={360} y={22} textAnchor="middle" fontSize={12.5} fill={MUTED} fontWeight={600}>
            {flow === 'policy' ? '循环在运行层内：观测 → 推断 → 动作' : '决策点在 Agent：观测 → 决策 → 调用工具'}
          </text>

          {/* 站点连接线 → 循环弧线（带方向箭头）→ 圆心说明 */}
          {SPOKES.map((d, i) => (
            <path key={`spoke-${i}`} d={d} stroke={LINE} strokeWidth={1.6} fill="none" />
          ))}
          {SEGS.map((d, i) => (
            <path key={`seg-${i}`} d={d} fill="none" stroke={SLATE} strokeWidth={2} opacity={0.75} markerEnd="url(#df-arrow)" />
          ))}
          <text x={360} y={176} textAnchor="middle" fontSize={12} fill={SLATE} fontWeight={650}>
            {flow === 'policy' ? '运行层' : 'Agent 在线'}
          </text>
          <text x={360} y={194} textAnchor="middle" fontSize={11} fill={MUTED}>
            {flow === 'policy' ? '观测-推断-动作' : '观测-决策-调用'}
          </text>

          {/* 三个循环站点 */}
          {flow === 'policy' ? (
            <>
              <Node x={360} y={58} w={168} title="SessionRunner" sub="受控执行生命周期" color={BLUE} active />
              <Node x={585} y={182} w={128} title="Policy (VLA)" sub="动作 / 动作块" color={BLUE} active />
              <Node x={135} y={182} w={110} title="Target" sub="受控接口" color={SLATE} active />
            </>
          ) : (
            <>
              <Node x={360} y={58} w={150} title="Agent" sub="在线决策" color={PURPLE} active />
              <Node x={585} y={182} w={138} title="SessionHandle" sub="Manifest 过滤" color={PURPLE} active />
              <Node x={135} y={182} w={110} title="Target" sub="受控接口" color={SLATE} active />
            </>
          )}

          {/* 底部长弧上的转换标注（策略流：ActionBridge 位于 Policy 与 Target 之间） */}
          {flow === 'policy' ? (
            <g>
              <line x1={360} y1={270} x2={360} y2={282} stroke={LINE} strokeWidth={1.4} strokeDasharray="3 3" />
              <rect x={288} y={282} width={144} height={24} rx={12} fill="#fff" stroke={BLUE} strokeWidth={1.5} />
              <text x={360} y={298} textAnchor="middle" fontSize={11} fontWeight={700} fill={BLUE}>
                ActionBridge · 表示转换
              </text>
            </g>
          ) : null}

          {/* 循环外角色（上方两角） */}
          {flow === 'policy' ? (
            <>
              <Node x={128} y={58} w={150} title="Agent 平面" sub="编译会话后退出循环" color={PURPLE} />
              <path d="M 203 58 L 270 58" fill="none" stroke={PURPLE} strokeWidth={1.8} strokeDasharray="6 5" markerEnd="url(#df-arrow-purple)" />
              <text x={128} y={98} textAnchor="middle" fontSize={10.5} fill={PURPLE}>
                不进入低层循环
              </text>
              <Node x={592} y={58} w={150} title="Watchdog" sub="监督整个会话" color={ORANGE} />
              <path d="M 566 82 L 422.2 119.8" fill="none" stroke={ORANGE} strokeWidth={1.8} strokeDasharray="6 5" opacity={0.9} />
              <circle cx={422.2} cy={119.8} r={3.4} fill={ORANGE} />
              <text x={592} y={102} textAnchor="middle" fontSize={10.5} fill={ORANGE}>
                心跳 · 超时 · 取消
              </text>
            </>
          ) : (
            <>
              <Node x={592} y={58} w={150} title="Watchdog" sub="监督整个会话" color={ORANGE} />
              <path d="M 566 82 L 422.2 119.8" fill="none" stroke={ORANGE} strokeWidth={1.8} strokeDasharray="6 5" opacity={0.9} />
              <circle cx={422.2} cy={119.8} r={3.4} fill={ORANGE} />
              <text x={592} y={102} textAnchor="middle" fontSize={10.5} fill={ORANGE}>
                心跳 · 超时 · 取消
              </text>
              <text x={128} y={56} textAnchor="middle" fontSize={11} fill={MUTED}>
                工具清单之外的
              </text>
              <text x={128} y={73} textAnchor="middle" fontSize={11} fill={MUTED}>
                操作默认不可用
              </text>
              <text x={585} y={222} textAnchor="middle" fontSize={10.5} fill={PURPLE}>
                每一步都经过权限与参数校验
              </text>
            </>
          )}

          {/* 接口公式 */}
          <text x={360} y={346} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="Georgia, serif" fill={flow === 'policy' ? BLUE : PURPLE}>
            {flow === 'policy' ? 'Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)' : 'Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)'}
          </text>

          {/* 运动小球：沿圆环流动，最后绘制 */}
          {!reduced ? (
            <circle r={6.5} fill={flow === 'policy' ? BLUE : PURPLE} stroke="#fff" strokeWidth={2}>
              <animateMotion dur="3.4s" repeatCount="indefinite" path={LOOP} />
            </circle>
          ) : null}
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
