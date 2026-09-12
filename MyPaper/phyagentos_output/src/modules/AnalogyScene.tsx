import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

// 类比场景（每章共用一个「徒步」视觉世界）：
// 一个主角 + 一个动词（沿小路走） + 一个目标（山顶旗子），
// 各章通过道具与路径状态变化表达隐喻。纯 SVG + CSS offset-path 动画，可缩放、无 canvas。

const TRAIL = 'M 28 122 C 130 66 220 138 320 96 C 400 62 460 92 524 58';
const TRAIL_HALF = 'M 28 122 C 130 66 220 138 320 96';

interface Variant {
  walkTo: string;
  trailBroken?: boolean;
  flagColor: string;
  prop?: 'map' | 'notebook' | 'gate' | 'signposts' | 'check' | 'fork';
  rocky?: boolean;
}

const VARIANTS: Record<string, Variant> = {
  'chap-1': { walkTo: '48%', trailBroken: true, flagColor: '#c43f52' },
  'chap-2': { walkTo: '82%', flagColor: '#228d5c', prop: 'map' },
  'chap-3': { walkTo: '82%', flagColor: '#228d5c', prop: 'notebook' },
  'chap-4': { walkTo: '40%', flagColor: '#228d5c', prop: 'gate' },
  'chap-5': { walkTo: '72%', flagColor: '#228d5c', prop: 'signposts' },
  'chap-6': { walkTo: '56%', flagColor: '#228d5c', prop: 'fork' },
  'chap-7': { walkTo: '60%', flagColor: '#228d5c', prop: 'notebook' },
  'chap-8': { walkTo: '82%', flagColor: '#228d5c', prop: 'signposts' },
  'chap-9': { walkTo: '82%', flagColor: '#228d5c', rocky: true },
  'chap-10': { walkTo: '96%', flagColor: '#228d5c', prop: 'check' },
};

function Hiker() {
  return (
    <g className="analogy-hiker">
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

      {/* 小路：浅色路基 + 主线 */}
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
          {/* 用背景色盖掉中断点之后的部分，再画红色虚线强调「走不完」 */}
          <path d={TRAIL_HALF} fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path
            d="M 320 96 C 400 62 460 92 524 58"
            fill="none"
            stroke="#dce7d5"
            strokeWidth={3.4}
            strokeDasharray="7 7"
            strokeLinecap="round"
          />
          <text x={216} y={148} fontSize={11} fill="#c43f52" fontWeight={600}>
            路径在此中断：走到了 ≠ 到达了
          </text>
        </g>
      ) : null}
      {v.prop === 'fork' ? (
        <path
          d="M 320 96 C 360 118 420 124 500 116"
          fill="none"
          stroke="#92400e"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="6 6"
          opacity={0.7}
        />
      ) : null}

      {/* 道具 */}
      {v.prop === 'map' ? (
        <g>
          <rect x={438} y={24} width={92} height={62} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          <path d="M 452 74 Q 486 36 516 44" fill="none" stroke="#27446e" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={516} cy={44} r={4} fill="#228d5c" />
          <text x={484} y={20} textAnchor="middle" fontSize={11} fill="#68778f">
            共享的地图
          </text>
        </g>
      ) : null}
      {v.prop === 'notebook' ? (
        <g>
          <rect x={442} y={30} width={86} height={58} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          {[42, 54, 66].map((y) => (
            <line
              key={y}
              x1={454}
              y1={y}
              x2={514}
              y2={y}
              stroke="#27446e"
              strokeWidth={2.2}
              strokeLinecap="round"
              opacity={0.75}
            />
          ))}
          <text x={485} y={104} textAnchor="middle" fontSize={11} fill="#68778f">
            会话记录
          </text>
        </g>
      ) : null}
      {v.prop === 'gate' ? (
        <g>
          <line x1={196} y1={64} x2={196} y2={110} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={236} y1={58} x2={236} y2={104} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path d="M 196 72 Q 216 84 236 68" fill="none" stroke="#f07e47" strokeWidth={3} strokeLinecap="round" />
          <text x={216} y={130} textAnchor="middle" fontSize={11} fill="#f07e47" fontWeight={600}>
            出发前检查
          </text>
        </g>
      ) : null}
      {v.prop === 'signposts' ? (
        <g>
          <line x1={318} y1={90} x2={318} y2={56} stroke="#92400e" strokeWidth={2.4} />
          <rect x={318} y={56} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={335} y={68} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>
            S₀
          </text>
          <line x1={452} y1={76} x2={452} y2={42} stroke="#92400e" strokeWidth={2.4} />
          <rect x={452} y={42} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={469} y={54} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>
            S_T
          </text>
        </g>
      ) : null}
      {v.prop === 'check' ? (
        <g>
          <circle cx={498} cy={32} r={13} fill="#228d5c" opacity={0.14} />
          <path
            d="M 492 32 L 497 37 L 506 26"
            fill="none"
            stroke="#228d5c"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : null}

      <Flag color={v.flagColor} />

      {/* 主角：沿路径行走（offset-path 与 CSS 变量 --walk-to 配合 keyframes） */}
      <g className="analogy-walker" style={walkerStyle}>
        <Hiker />
      </g>
    </svg>
  );
};

export default AnalogyScene;
