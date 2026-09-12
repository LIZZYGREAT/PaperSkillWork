import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Btn, Slider } from './kit';

// Lab 1.1 — 执行进度与返回码变绿，但目标证据揭示杯子从未被握住。
// 一个滑块 + 一次「核对证据」操作，让返回码与语义判定分道扬镳。

const EXEC_GOOD = '#228d5c';
const EXEC_BLUE = '#27446e';
const FAIL_RED = '#c43f52';
const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

function Gripper({ x, closed, color }: { x: number; closed: boolean; color: string }) {
  const closeOffset = closed ? 7 : 0;
  return (
    <g>
      <rect x={x - 5} y={38} width={10} height={46} rx={3} fill={color} />
      <rect x={x - 21} y={84} width={42} height={11} rx={4} fill={color} />
      <g style={{ transition: 'transform 420ms cubic-bezier(.34,1.4,.64,1)' }}>
        <rect
          x={x - 19}
          y={95}
          width={8}
          height={30}
          rx={3.5}
          fill={color}
          transform={`translate(${closeOffset} 0)`}
        />
        <rect
          x={x + 11}
          y={95}
          width={8}
          height={30}
          rx={3.5}
          fill={color}
          transform={`translate(${-closeOffset} 0)`}
        />
      </g>
    </g>
  );
}

function Cup({ x, solid = true }: { x: number; solid?: boolean }) {
  const stroke = solid ? '#92400e' : '#b09a82';
  return (
    <g opacity={solid ? 1 : 0.6}>
      <rect
        x={x - 15}
        y={216}
        width={30}
        height={42}
        rx={5}
        fill={solid ? '#fdf6ea' : 'none'}
        stroke={stroke}
        strokeWidth={2.4}
        strokeDasharray={solid ? undefined : '5 4'}
      />
      <ellipse cx={x} cy={216} rx={15} ry={4.5} fill={solid ? '#eaddc4' : 'none'} stroke={stroke} strokeWidth={2} strokeDasharray={solid ? undefined : '5 4'} />
      <path d={`M ${x + 15} 226 q 13 2 0 20`} fill="none" stroke={stroke} strokeWidth={2.6} strokeDasharray={solid ? undefined : '5 4'} />
    </g>
  );
}

function Table() {
  return (
    <g>
      <rect x={24} y={258} width={672} height={13} rx={6} fill="#b8c9a7" />
      <rect x={24} y={258} width={672} height={4} rx={2} fill="#76906a" opacity={0.45} />
    </g>
  );
}

export const ReturnCodeLab: React.FC<WidgetProps> = () => {
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const closed = progress >= 100;
  const gx = 112 + (progress / 100) * 316; // 末端执行器水平位置

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '拖动「执行进度」——返回码只反映轨迹是否被忠实执行，不反映目标端发生了什么。';
  if (closed && !verified) {
    tone = '';
    msg = '轨迹完成，偏差 0.6cm < 容差 1cm，返回码 0。手指确实在指令位闭合了——但指令位上有杯子吗？';
  }
  if (closed && verified) {
    tone = 'bad';
    msg = '证据包：S₀ 杯在桌面、夹爪张开；S_T 夹爪在感知位置闭空，真实杯子位置未变 → 语义判定 failure。返回码 0 ≠ 任务完成。';
  }

  return (
    <div className="lab">
      {!verified ? (
        <div className="lab-stage">
          <svg viewBox="0 0 720 300" role="img" aria-label="机械爪执行抓取轨迹的场景">
            {/* 导轨 */}
            <rect x={40} y={28} width={640} height={8} rx={4} fill={BORDER} />
            <rect x={40} y={28} width={330} height={8} rx={4} fill={EXEC_BLUE} opacity={0.25} />
            {/* 指令位置标记（控制器认为的杯子位置） */}
            <g opacity={closed ? 0.9 : 0}>
              <Cup x={428} solid={false} />
              <text x={428} y={206} textAnchor="middle" fontSize={12} fill={MUTED}>
                感知位置
              </text>
            </g>
            <Table />
            {/* 真实杯子 */}
            <Cup x={462} />
            {/* 目标说明 */}
            <g>
              <rect x={30} y={172} width={172} height={58} rx={8} fill="#f6f8fc" stroke={BORDER} />
              <text x={44} y={195} fontSize={13} fill={INK} fontWeight={600}>
                目标 G
              </text>
              <text x={44} y={215} fontSize={12} fill={MUTED}>
                杯子被夹爪握住
              </text>
            </g>
            {/* 执行轨迹线 */}
            <path
              d={`M 112 62 H ${gx}`}
              stroke={closed ? EXEC_GOOD : EXEC_BLUE}
              strokeWidth={3}
              strokeDasharray={closed ? undefined : '7 6'}
              style={{ transition: 'stroke 300ms' }}
            />
            <Gripper x={gx} closed={closed} color={closed ? EXEC_GOOD : EXEC_BLUE} />
            {/* 容差提示 */}
            {closed ? (
              <g>
                <circle cx={gx} cy={252} r={5} fill={EXEC_GOOD} />
                <text x={gx + 12} y={256} fontSize={12} fill={EXEC_GOOD} fontWeight={600}>
                  轨迹偏差 0.6cm ✓
                </text>
              </g>
            ) : null}
          </svg>
        </div>
      ) : (
        <div className="lab-stage">
          <div className="lab-evidence-row">
            <div className="lab-evidence-card">
              <div className="lab-evidence-head tone-info">S₀ · 初始状态</div>
              <svg viewBox="0 0 320 280" role="img" aria-label="初始状态：杯子在桌面，夹爪张开">
                <text x={160} y={26} textAnchor="middle" fontSize={12.5} fill={MUTED}>
                  杯在桌面 · 夹爪张开 · 感知偏移已存在
                </text>
                <rect x={16} y={216} width={288} height={12} rx={6} fill="#b8c9a7" />
                <Cup x={186} />
                <Gripper x={150} closed={false} color={EXEC_BLUE} />
              </svg>
            </div>
            <div className="lab-evidence-card">
              <div className="lab-evidence-head tone-bad">S_T · 终止状态</div>
              <svg viewBox="0 0 320 280" role="img" aria-label="终止状态：夹爪闭空，杯子未动">
                <text x={160} y={26} textAnchor="middle" fontSize={12.5} fill={MUTED}>
                  夹爪在感知位置闭空
                </text>
                <rect x={16} y={216} width={288} height={12} rx={6} fill="#b8c9a7" />
                <Cup x={186} />
                <text x={186} y={272} textAnchor="middle" fontSize={11.5} fill={FAIL_RED} fontWeight={600}>
                  ↑ 位置未变
                </text>
                <g opacity={0.55}>
                  <Cup x={114} solid={false} />
                </g>
                <Gripper x={114} closed={true} color={FAIL_RED} />
              </svg>
            </div>
          </div>
          <div className="lab-verdict-row">
            <span className="lab-pill tone-good">返回码 0 · 轨迹完成</span>
            <span className="lab-verdict-vs">但</span>
            <span className="lab-pill tone-bad">语义判定 failure · 目标未达成</span>
          </div>
        </div>
      )}

      <div className="lab-controls">
        <Slider
          label="执行进度"
          value={progress}
          onChange={(v) => {
            setProgress(v);
            if (v < 100) setVerified(false);
          }}
          display={`${progress}%`}
        />
        <Btn onClick={() => setVerified(true)} disabled={!closed}>
          核对目标证据
        </Btn>
        {verified ? (
          <Btn variant="ghost" onClick={() => { setVerified(false); setProgress(0); }}>
            重置
          </Btn>
        ) : null}
      </div>
      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default ReturnCodeLab;
