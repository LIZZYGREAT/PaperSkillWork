import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

// 类比场景（每章共用一个「徒步」视觉世界）：
// 一个主角 + 一条小路 + 一个目标（山顶旗子），各章用道具表达隐喻。
// V2 修订：
//   · 小路中段留一段平整路面，大本营 / 无线电 / 检查门落在平面上；
//   · 「角色地图 / 会话记录」移到左上天空区，不遮挡路径；
//   · 徒步者整体上移，让脚落在曲线上；
//   · 顶部增加「隐喻 ↔ 论文概念」对应标签，把场景映射到论文机制。

const TRAIL = 'M 28 122 C 110 106 200 88 280 88 L 380 88 C 448 88 498 72 524 58';
const TRAIL_SOLID_PREFIX = 'M 28 122 C 110 106 200 88 280 88 L 380 88';
const TRAIL_DASHED_SUFFIX = 'M 380 88 C 448 88 498 72 524 58';
const FORK = 'M 330 88 C 380 108 440 120 500 114';

interface Variant {
  walkTo: string;
  trailBroken?: boolean;
  flagColor: string;
  prop?: 'map' | 'notebook' | 'gate' | 'signposts' | 'check' | 'fork' | 'camp' | 'radio';
  rocky?: boolean;
}

// mapsTo：把本章隐喻显式映射到论文机制（渲染为场景顶部的对应标签）
const VARIANTS: Record<string, Variant & { mapsTo: string }> = {
  'chap-1': { walkTo: '56%', flagColor: '#c43f52', prop: 'map', mapsTo: '地图 ↔ 组件分工与缺口' },
  'chap-2': { walkTo: '46%', trailBroken: true, flagColor: '#c43f52', mapsTo: '走到 ≠ 到达 ↔ 执行结束 ≠ 任务完成' },
  'chap-3': { walkTo: '40%', flagColor: '#228d5c', prop: 'camp', mapsTo: '大本营 ↔ 运行时 / OS 层' },
  'chap-4': { walkTo: '52%', flagColor: '#228d5c', prop: 'radio', mapsTo: '同一频道 ↔ State-as-a-File' },
  'chap-5': { walkTo: '38%', flagColor: '#228d5c', prop: 'gate', mapsTo: '行程治理 ↔ Session 生命周期' },
  'chap-6': { walkTo: '52%', flagColor: '#228d5c', prop: 'fork', mapsTo: '两种走法 ↔ Policy 流 / Agent 工具流' },
  'chap-7': { walkTo: '66%', flagColor: '#228d5c', prop: 'signposts', mapsTo: '对回地图 ↔ 证据语义验收' },
  'chap-8': { walkTo: '56%', flagColor: '#228d5c', prop: 'notebook', mapsTo: '手册只收验证过的路 ↔ 六步闭环' },
  'chap-9': { walkTo: '82%', flagColor: '#228d5c', rocky: true, mapsTo: '逐层加险 ↔ 渐进验证 · 五层安全' },
  'chap-10': { walkTo: '96%', flagColor: '#228d5c', prop: 'check', mapsTo: '查完整记录 ↔ 基准协议与边界' },
};

function Hiker() {
  return (
    <g transform="translate(0 -12)">
      <rect x={-10} y={-12} width={7} height={10} rx={2} fill="#f07e47" />
      <circle cx={0} cy={-14} r={4.6} fill="#27446e" />
      <path d="M 0 -9 L 0 2" stroke="#27446e" strokeWidth={3} strokeLinecap="round" />
      <path d="M 0 -5 L 8 3" stroke="#27446e" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M 8 3 L 10 9" stroke="#92400e" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M 0 2 L -5 11" stroke="#27446e" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M 0 2 L 5 11" stroke="#27446e" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  );
}

function Flag({ color }: { color: string }) {
  return (
    <g>
      <line x1={524} y1={58} x2={524} y2={22} stroke="#92400e" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M 524 22 L 548 30 L 524 38 Z" fill={color} />
    </g>
  );
}

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const v = VARIANTS[chapterId] ?? VARIANTS['chap-2'];
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!mq?.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq?.addEventListener?.('change', fn);
    return () => mq?.removeEventListener?.('change', fn);
  }, []);

  const walkerStyle: React.CSSProperties = {
    offsetPath: `path("${TRAIL}")`,
    offsetRotate: '0deg',
    ...(reduced
      ? { offsetDistance: v.walkTo }
      : {
          '--walk-to': v.walkTo,
          animation: 'analogy-walk 7s ease-in-out infinite',
        }),
  } as React.CSSProperties;

  // 顶部对应标签的宽度按文本长度估算
  const chipText = v.mapsTo;
  const chipW = Math.min(330, chipText.length * 11.5 + 26);

  return (
    <svg className="analogy-svg" viewBox="0 0 560 150" role="img" aria-label="徒步类比场景">
      {/* 远山 */}
      <path
        d="M 0 96 Q 90 46 190 84 T 380 74 T 560 88 L 560 150 L 0 150 Z"
        fill={v.rocky ? '#9fb0c8' : '#b8c9a7'}
        opacity={v.rocky ? 0.4 : 0.55}
      />
      {/* 近地面 */}
      <path
        d="M 0 116 Q 140 92 300 116 T 560 108 L 560 150 L 0 150 Z"
        fill="#76906a"
        opacity={0.28}
      />

      {/* 小路：浅色路基 + 主线（中段 280–380 为平整路面，道具落在这里） */}
      <path d={TRAIL} fill="none" stroke="#dce7d5" strokeWidth={9} strokeLinecap="round" />
      <path
        d={TRAIL}
        fill="none"
        stroke="#92400e"
        strokeWidth={3.4}
        strokeLinecap="round"
        opacity={0.8}
      />
      {v.trailBroken ? (
        <g>
          {/* 用背景色盖掉中断点之后的部分，再画虚线强调「走不完」 */}
          <path d={TRAIL_SOLID_PREFIX} fill="none" stroke="#dce7d5" strokeWidth={9} strokeLinecap="round" />
          <path d={TRAIL_SOLID_PREFIX} fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path
            d={TRAIL_DASHED_SUFFIX}
            fill="none"
            stroke="#dce7d5"
            strokeWidth={3.4}
            strokeDasharray="7 7"
            strokeLinecap="round"
          />
          <text x={392} y={112} fontSize={11} fill="#c43f52" fontWeight={600}>
            路径在此中断：走到了 ≠ 到达了
          </text>
        </g>
      ) : null}
      {v.prop === 'fork' ? (
        <path
          d={FORK}
          fill="none"
          stroke="#92400e"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="6 6"
          opacity={0.7}
        />
      ) : null}

      {/* 道具（左上天空区 / 平整路面） */}
      {v.prop === 'map' ? (
        <g>
          <rect x={30} y={16} width={92} height={60} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          <path d="M 44 64 Q 78 28 108 36" fill="none" stroke="#27446e" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={108} cy={36} r={4} fill="#228d5c" />
          <text x={76} y={92} textAnchor="middle" fontSize={11} fill="#68778f">
            角色地图
          </text>
        </g>
      ) : null}
      {v.prop === 'notebook' ? (
        <g>
          <rect x={34} y={16} width={86} height={56} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          {[30, 42, 54].map((y) => (
            <line
              key={y}
              x1={46}
              y1={y}
              x2={106}
              y2={y}
              stroke="#27446e"
              strokeWidth={2.2}
              strokeLinecap="round"
              opacity={0.75}
            />
          ))}
          <text x={77} y={88} textAnchor="middle" fontSize={11} fill="#68778f">
            会话记录
          </text>
        </g>
      ) : null}
      {v.prop === 'gate' ? (
        <g>
          {/* 出发前检查门：立在平整路面上 */}
          <line x1={308} y1={88} x2={308} y2={48} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={352} y1={88} x2={352} y2={48} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path d="M 308 56 Q 330 68 352 50" fill="none" stroke="#f07e47" strokeWidth={3} strokeLinecap="round" />
          <text x={330} y={106} textAnchor="middle" fontSize={11} fill="#f07e47" fontWeight={600}>
            出发前检查
          </text>
        </g>
      ) : null}
      {v.prop === 'camp' ? (
        <g>
          {/* 大本营：平整路面上的帐篷 + 旗帜 = 运行时层 */}
          <path d="M 306 88 L 330 54 L 354 88 Z" fill="#e7ddc8" stroke="#92400e" strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M 330 54 L 330 88" stroke="#92400e" strokeWidth={1.6} opacity={0.7} />
          <line x1={358} y1={88} x2={358} y2={46} stroke="#92400e" strokeWidth={2.2} />
          <path d="M 358 46 L 380 53 L 358 60 Z" fill="#228d5c" />
          <text x={330} y={106} textAnchor="middle" fontSize={11} fill="#228d5c" fontWeight={600}>
            大本营 · 系统层
          </text>
        </g>
      ) : null}
      {v.prop === 'radio' ? (
        <g>
          {/* 无线电：平整路面上的天线 + 电波 = 文件协议 */}
          <line x1={330} y1={88} x2={330} y2={42} stroke="#27446e" strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={330} cy={38} r={3.4} fill="#27446e" />
          <path d="M 318 46 q -8 -8 0 -16" fill="none" stroke="#27446e" strokeWidth={2} strokeLinecap="round" opacity={0.75} />
          <path d="M 342 46 q 8 -8 0 -16" fill="none" stroke="#27446e" strokeWidth={2} strokeLinecap="round" opacity={0.75} />
          <rect x={302} y={84} width={56} height={7} rx={3.5} fill="#27446e" opacity={0.5} />
          <text x={330} y={106} textAnchor="middle" fontSize={11} fill="#27446e" fontWeight={600}>
            同一频道 · 共享状态
          </text>
        </g>
      ) : null}
      {v.prop === 'signposts' ? (
        <g>
          {/* S₀ / S_T 路牌：立在小路上 */}
          <line x1={300} y1={88} x2={300} y2={54} stroke="#92400e" strokeWidth={2.4} />
          <rect x={300} y={54} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={317} y={66} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>
            S₀
          </text>
          <line x1={474} y1={78} x2={474} y2={42} stroke="#92400e" strokeWidth={2.4} />
          <rect x={474} y={42} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={491} y={54} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>
            S_T
          </text>
        </g>
      ) : null}
      {v.prop === 'check' ? (
        <g>
          <circle cx={496} cy={30} r={13} fill="#228d5c" opacity={0.14} />
          <path
            d="M 490 30 L 495 35 L 504 24"
            fill="none"
            stroke="#228d5c"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : null}

      <Flag color={v.flagColor} />

      {/* 隐喻 ↔ 论文 对应标签 */}
      <g>
        <rect
          x={280 - chipW / 2}
          y={8}
          width={chipW}
          height={20}
          rx={10}
          fill="#fff"
          stroke="#d7deea"
          strokeWidth={1.4}
        />
        <text x={280} y={22} textAnchor="middle" fontSize={10.5} fill="#27446e" fontWeight={700}>
          {chipText}
        </text>
      </g>

      {/* 主角：沿路径行走（offset-path 与 CSS 变量 --walk-to 配合 keyframes） */}
      <g className="analogy-walker" style={walkerStyle}>
        <Hiker />
      </g>
    </svg>
  );
};

export default AnalogyScene;
