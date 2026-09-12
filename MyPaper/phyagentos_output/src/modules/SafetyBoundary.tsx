import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Slider, Chip } from './kit';

// Lab 4.2 — 把动作点推向工作空间边界，区分 ActionBridge 的「格式转换」
// 与 SafetyGuard 的「放行 / 有界投影 / 拦截」两种职责。

const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const RED = '#c43f52';
const BLUE = '#27446e';
const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type Zone = 'inside' | 'clamp' | 'reject';

export const SafetyBoundary: React.FC<WidgetProps> = () => {
  const [risk, setRisk] = useState(30);
  const [needsBridge, setNeedsBridge] = useState(true);

  const zone: Zone = risk < 62 ? 'inside' : risk < 88 ? 'clamp' : 'reject';
  // 动作点水平位置：0 → 150，100 → 720（边界在 x=560，guard 线在 560）
  const px = 150 + (risk / 100) * 570;
  const displayX = zone === 'inside' ? px : 560;
  const pointColor = zone === 'inside' ? GREEN : zone === 'clamp' ? ORANGE : RED;

  let tone: '' | 'good' | 'bad' | 'warn' = 'good';
  let msg =
    '动作在合法范围内：SafetyGuard 放行。ActionBridge 若有需要只做表示转换——它不决定命令是否可发。';
  if (zone === 'clamp') {
    tone = 'warn';
    msg =
      '接近边界：SafetyGuard 把指令有界投影回合法范围（被显式授权的转换），并附结构化违规码记录在案——这与「静默修复」不同。';
  }
  if (zone === 'reject') {
    tone = 'bad';
    msg =
      '命令被拦截（violation: WS_LIMIT），不会到达目标端。畸形、欠指定或不连续危险的命令被拒绝，而不是被悄悄改好。';
  }

  return (
    <div className="lab">
      <div className="lab-stage">
        <svg viewBox="0 0 720 300" role="img" aria-label="工作空间与安全边界">
          {/* 目标端（最右侧，物理执行） */}
          <rect x={636} y={96} width={64} height={128} rx={10} fill="#f6f8fc" stroke={BORDER} />
          <text x={668} y={152} textAnchor="middle" fontSize={12} fill={MUTED}>
            物理
          </text>
          <text x={668} y={170} textAnchor="middle" fontSize={12} fill={MUTED}>
            执行
          </text>
          {/* 合法工作空间 */}
          <rect
            x={80}
            y={70}
            width={480}
            height={180}
            rx={16}
            fill="rgba(34,141,92,0.07)"
            stroke={GREEN}
            strokeWidth={2}
            strokeDasharray="8 6"
          />
          <text x={96} y={94} fontSize={13} fill={GREEN} fontWeight={600}>
            合法工作空间（joint / ws limits）
          </text>
          {/* SafetyGuard 检查线 */}
          <line x1={560} y1={52} x2={560} y2={268} stroke={ORANGE} strokeWidth={2.5} strokeDasharray="10 6" />
          <g>
            <rect x={497} y={28} width={126} height={26} rx={13} fill={ORANGE} opacity={0.12} />
            <text x={560} y={46} textAnchor="middle" fontSize={12.5} fill={ORANGE} fontWeight={700}>
              SafetyGuard 检查
            </text>
          </g>
          {/* ActionBridge 节点 */}
          {needsBridge ? (
            <g opacity={0.95}>
              <rect x={196} y={28} width={190} height={26} rx={13} fill="rgba(39,68,110,0.1)" />
              <text x={291} y={46} textAnchor="middle" fontSize={12.5} fill={BLUE} fontWeight={700}>
                ActionBridge · 坐标转换 ✓
              </text>
            </g>
          ) : (
            <g opacity={0.55}>
              <rect x={226} y={28} width={130} height={26} rx={13} fill="#f6f8fc" stroke={BORDER} />
              <text x={291} y={46} textAnchor="middle" fontSize={12.5} fill={MUTED}>
                无需转换
              </text>
            </g>
          )}
          {/* 动作轨迹 */}
          <path
            d={`M 150 160 H ${Math.min(px, 716)}`}
            stroke={pointColor}
            strokeWidth={3}
            strokeDasharray={zone === 'reject' ? '7 6' : undefined}
            opacity={0.65}
          />
          {/* 拦截标记 */}
          {zone === 'reject' ? (
            <g>
              <circle cx={560} cy={160} r={14} fill={RED} />
              <text x={560} y={165} textAnchor="middle" fontSize={14} fill="#fff" fontWeight={700}>
                ✕
              </text>
              <text x={560} y={196} textAnchor="middle" fontSize={12} fill={RED} fontWeight={600}>
                violation: WS_LIMIT
              </text>
            </g>
          ) : null}
          {zone === 'clamp' ? (
            <text x={560} y={196} textAnchor="middle" fontSize={12} fill={ORANGE} fontWeight={600}>
              投影回边界 · 记录在案
            </text>
          ) : null}
          {/* 动作点 */}
          <circle
            cx={displayX}
            cy={160}
            r={11}
            fill={pointColor}
            stroke="#fff"
            strokeWidth={3}
            style={{ transition: 'cx 120ms linear, fill 200ms' }}
          />
          <text x={150} y={286} fontSize={12} fill={MUTED}>
            动作起点
          </text>
        </svg>
      </div>

      <div className="lab-controls">
        <Slider label="动作越界程度" value={risk} onChange={setRisk} display={risk.toFixed(0)} />
        <div className="lab-choice-group">
          <Chip active={needsBridge} onClick={() => setNeedsBridge(!needsBridge)}>
            {needsBridge ? '✓ 本动作需要坐标转换' : '本动作需要坐标转换？'}
          </Chip>
        </div>
      </div>
      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default SafetyBoundary;
