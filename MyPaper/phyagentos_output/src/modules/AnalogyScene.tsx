import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// 类比场景（每章共用一个「徒步」视觉世界）· V3：脚本化叙事动画
//
// 每章不再是无意义的循环走路，而是一段明确的「故事」：
//   人物到达关键节点 → 道具展示它在论文机制中的作用 → 继续前进 / 折返 / 循环。
// 实现：rAF 时间线驱动（getPointAtLength 精确定位 + 分段缓动 + 站点暂停 + FX 触发）。
// 路径起点与中段都是平整路面：出发前检查门立在起点，大本营 / 无线电立在中段。

const TRAIL = 'M 28 105 L 150 105 C 215 105 245 88 305 88 L 385 88 C 450 88 500 70 524 58';
const TRAIL_SOLID = 'M 28 105 L 150 105 C 215 105 245 88 305 88 L 385 88';
const TRAIL_DASH = 'M 385 88 C 450 88 500 70 524 58';
const FORK = 'M 345 88 C 395 106 452 116 506 112';

const TONE: Record<string, { fill: string; stroke: string; text: string }> = {
  blue: { fill: '#eef3fb', stroke: '#27446e', text: '#27446e' },
  green: { fill: '#e9f5ef', stroke: '#228d5c', text: '#1c7a4e' },
  red: { fill: '#fbedef', stroke: '#c43f52', text: '#c43f52' },
  orange: { fill: '#fdf0e7', stroke: '#f07e47', text: '#b85c1e' },
};

/** 弹出式气泡：由 FX 时间线触发（data-fx + .on） */
function Pill({ id, x, y, text, tone = 'blue', fs = 10.5 }: { id: string; x: number; y: number; text: string; tone?: keyof typeof TONE | string; fs?: number }) {
  const t = TONE[tone] ?? TONE.blue;
  const w = text.length * (fs * 1.02) + 20;
  return (
    <g data-fx={id} className="fx">
      <rect x={x - w / 2} y={y - 10} width={w} height={20} rx={10} fill={t.fill} stroke={t.stroke} strokeWidth={1.3} />
      <text x={x} y={y + 3.6} textAnchor="middle" fontSize={fs} fontWeight={700} fill={t.text}>
        {text}
      </text>
    </g>
  );
}

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
      <path className="flag-cloth" d="M 524 22 L 548 30 L 524 38 Z" fill={color} />
    </g>
  );
}

// ---------------------------------------------------------------- 脚本时间线

type Seg =
  | { type: 'walk'; from: number; to: number; ms: number; marks?: { frac: number; fx: () => void }[] }
  | { type: 'hold'; ms: number; fx?: () => void };

interface FxKit {
  pop: (id: string, delay?: number) => void;
  slip: () => void;
  fracAtX: (x: number) => number;
}

const X = { gate: 114, camp: 320, radio: 330, fork: 345, s0: 310, st: 470, brk: 385, rock: 260, ice: 400 };

const SCRIPTS: Record<string, (k: FxKit) => Seg[]> = {
  // §1 角色地图：走两段、各停一次看地图——地图高亮两处缺口
  'chap-1': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(250), ms: 1900 },
    { type: 'hold', ms: 1300, fx: () => { k.pop('map-glow'); k.pop('q1', 250); } },
    { type: 'walk', from: k.fracAtX(250), to: k.fracAtX(420), ms: 1600 },
    { type: 'hold', ms: 1400, fx: () => { k.pop('map-glow'); k.pop('noowner', 300); } },
    { type: 'walk', from: k.fracAtX(420), to: 0.97, ms: 700 },
  ],
  // §2 路径中断：人物明确走到实线末端，停住，看着够不到的旗子
  'chap-2': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.brk), ms: 2600 },
    { type: 'hold', ms: 2100, fx: () => { k.pop('q-break', 200); k.pop('flag-dim', 600); } },
  ],
  // §3 大本营：到达 → 整备（记录/检查/补给逐个亮起 + 补给路线闪烁）→ 出发登顶
  'chap-3': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.camp), ms: 2100 },
    {
      type: 'hold', ms: 2800, fx: () => {
        k.pop('camp-rest', 100);
        k.pop('camp-fx0', 450);
        k.pop('camp-fx1', 1000);
        k.pop('camp-fx2', 1550);
        k.pop('camp-route', 2100);
      },
    },
    { type: 'walk', from: k.fracAtX(X.camp), to: 1, ms: 1900 },
  ],
  // §4 无线电：经过时电波发出、向大本营上报心跳，然后继续走
  'chap-4': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.radio), ms: 2300 },
    { type: 'hold', ms: 1700, fx: () => { k.pop('radio-w0', 100); k.pop('radio-w1', 380); k.pop('radio-w2', 660); k.pop('radio-msg', 500); } },
    { type: 'walk', from: k.fracAtX(X.radio), to: 1, ms: 1700 },
  ],
  // §5 出发前检查：起点就被检查门拦下 → 三项检查逐项打勾 → 闸门抬起放行
  'chap-5': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.gate), ms: 1100 },
    {
      type: 'hold', ms: 2700, fx: () => {
        k.pop('gate-c0', 200);
        k.pop('gate-c1', 750);
        k.pop('gate-c2', 1300);
        k.pop('gate-open', 1850);
        k.pop('gate-pass', 2100);
      },
    },
    { type: 'walk', from: k.fracAtX(X.gate), to: 1, ms: 2100 },
  ],
  // §6 两条走法：明确走到分叉点 → 两条路线各自标注 → 沿主路走到旗子
  'chap-6': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.fork), ms: 2200 },
    { type: 'hold', ms: 1600, fx: () => { k.pop('fork-main', 150); k.pop('fork-branch', 550); } },
    { type: 'walk', from: k.fracAtX(X.fork), to: 1, ms: 2100 },
  ],
  // §7 语义验收：从 S₀ 走到 S_T，停下后一条虚线把起点和终点连起来对账
  'chap-7': (k) => [
    { type: 'walk', from: k.fracAtX(X.s0), to: k.fracAtX(X.st), ms: 2000 },
    { type: 'hold', ms: 1900, fx: () => { k.pop('s0-flash', 150); k.pop('st-ok', 700); } },
    { type: 'walk', from: k.fracAtX(X.st), to: 1, ms: 700 },
  ],
  // §8 会话记录：第一次失败（红✗）→ 折返重试（绿✓）→ 两条都被写进记录
  'chap-8': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(290), ms: 1400 },
    { type: 'hold', ms: 800, fx: () => { k.pop('fail-x', 120); k.pop('note-l0', 250); } },
    { type: 'walk', from: k.fracAtX(290), to: k.fracAtX(250), ms: 700 },
    { type: 'walk', from: k.fracAtX(250), to: k.fracAtX(415), ms: 1500 },
    { type: 'hold', ms: 700, fx: () => { k.pop('ok-check', 100); k.pop('note-l1', 250); } },
    { type: 'hold', ms: 1300, fx: () => { k.pop('note-l2', 200); k.pop('note-note', 500); } },
  ],
  // §9 逐层加险：平地 → 进入碎石层（动力学与碰撞）→ 进入冰面层（噪声·延迟·安全，脚下滑一下）
  'chap-9': (k) => [
    {
      type: 'walk', from: 0, to: 1, ms: 4800,
      marks: [
        { frac: k.fracAtX(X.rock), fx: () => { k.pop('terr-rock'); k.pop('terr-rock-label', 150); } },
        { frac: k.fracAtX(X.ice), fx: () => { k.pop('terr-ice'); k.pop('terr-ice-label', 150); k.slip(); } },
      ],
    },
    { type: 'hold', ms: 1300, fx: () => { k.pop('terr-done', 200); } },
  ],
  // §10 查完整记录：登顶后逐条弹出记录（协议 / 提升 / 边界）
  'chap-10': (k) => [
    { type: 'walk', from: 0, to: 1, ms: 3000 },
    { type: 'hold', ms: 2300, fx: () => { k.pop('end-check', 150); k.pop('end-r0', 500); k.pop('end-r1', 900); k.pop('end-r2', 1300); } },
  ],
};

const VARIANTS: Record<string, { flagColor: string; mapsTo: string; prop?: string; rocky?: boolean }> = {
  'chap-1': { flagColor: '#c43f52', prop: 'map', mapsTo: '地图 ↔ 组件分工与缺口' },
  'chap-2': { flagColor: '#c43f52', mapsTo: '走到 ≠ 到达 ↔ 执行结束 ≠ 任务完成' },
  'chap-3': { flagColor: '#228d5c', prop: 'camp', mapsTo: '大本营 ↔ 运行时 / OS 层' },
  'chap-4': { flagColor: '#228d5c', prop: 'radio', mapsTo: '同一频道 ↔ State-as-a-File' },
  'chap-5': { flagColor: '#228d5c', prop: 'gate', mapsTo: '行程治理 ↔ Session 生命周期' },
  'chap-6': { flagColor: '#228d5c', prop: 'fork', mapsTo: '两种走法 ↔ Policy 流 / Agent 工具流' },
  'chap-7': { flagColor: '#228d5c', prop: 'signposts', mapsTo: '对回地图 ↔ 证据语义验收' },
  'chap-8': { flagColor: '#228d5c', prop: 'notebook', mapsTo: '手册只收验证过的路 ↔ 六步闭环' },
  'chap-9': { flagColor: '#228d5c', rocky: true, mapsTo: '逐层加险 ↔ 渐进验证 · 五层安全' },
  'chap-10': { flagColor: '#228d5c', prop: 'check', mapsTo: '查完整记录 ↔ 基准协议与边界' },
};

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const v = VARIANTS[chapterId] ?? VARIANTS['chap-2'];
  const [reduced, setReduced] = useState(false);
  const baseRef = useRef<SVGPathElement>(null);
  const walkerRef = useRef<SVGGElement>(null);
  const hikerRef = useRef<SVGGElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!mq?.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq?.addEventListener?.('change', fn);
    return () => mq?.removeEventListener?.('change', fn);
  }, []);

  useEffect(() => {
    const base = baseRef.current;
    const walker = walkerRef.current;
    const stage = stageRef.current;
    if (!base || !walker || !stage) return;
    const total = base.getTotalLength();
    const fracAtX = (x: number) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2;
        if (base.getPointAtLength(mid * total).x < x) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const timeouts: number[] = [];
    const pop = (id: string, delay = 0) => {
      timeouts.push(
        window.setTimeout(() => {
          const el = stage.querySelector(`[data-fx="${id}"]`);
          if (!el) return;
          el.classList.remove('on');
          void el.getBoundingClientRect();
          el.classList.add('on');
        }, delay)
      );
    };
    const slip = () => {
      const inner = hikerRef.current;
      if (!inner) return;
      inner.classList.remove('on');
      void inner.getBoundingClientRect();
      inner.classList.add('on');
      timeouts.push(window.setTimeout(() => inner.classList.remove('on'), 700));
    };
    const kit: FxKit = { pop, slip, fracAtX };
    const script = SCRIPTS[chapterId]?.(kit) ?? [];
    const resetFx = () => stage.querySelectorAll('[data-fx].on').forEach((e) => e.classList.remove('on'));
    const placeWalker = (frac: number) => {
      const p = base.getPointAtLength(Math.max(0, Math.min(1, frac)) * total);
      walker.setAttribute('transform', `translate(${p.x} ${p.y})`);
    };

    if (reduced) {
      const walks = script.filter((s) => s.type === 'walk') as { to: number }[];
      placeWalker(walks.length ? walks[walks.length - 1].to : 0);
      return () => timeouts.forEach((t) => window.clearTimeout(t));
    }

    let stopped = false;
    let raf = 0;
    let segIdx = 0;
    let startT = 0;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const runSeg = () => {
      if (stopped) return;
      if (segIdx >= script.length) {
        timeouts.push(
          window.setTimeout(() => {
            if (stopped) return;
            resetFx();
            segIdx = 0;
            startT = performance.now();
            runSeg();
          }, 1100)
        );
        return;
      }
      const seg = script[segIdx];
      if (seg.type === 'hold') {
        seg.fx?.();
        timeouts.push(
          window.setTimeout(() => {
            if (stopped) return;
            segIdx++;
            startT = performance.now();
            runSeg();
          }, seg.ms)
        );
        return;
      }
      const marks = seg.marks ? [...seg.marks] : [];
      const step = (now: number) => {
        if (stopped) return;
        const t = Math.min(1, (now - startT) / seg.ms);
        const f = seg.from + (seg.to - seg.from) * ease(t);
        const p = base.getPointAtLength(f * total);
        walker.setAttribute('transform', `translate(${p.x} ${p.y})`);
        while (marks.length && f >= marks[0].frac) marks.shift()!.fx();
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          segIdx++;
          startT = now;
          runSeg();
        }
      };
      raf = requestAnimationFrame(step);
    };
    placeWalker(script.length && script[0].type === 'walk' ? (script[0] as { from: number }).from : 0);
    startT = performance.now();
    runSeg();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [chapterId, reduced]);

  const chipText = v.mapsTo;
  const chipW = Math.min(330, chipText.length * 11.5 + 26);

  return (
    <svg ref={stageRef} className="analogy-svg" viewBox="0 0 560 150" role="img" aria-label="徒步类比场景">
      {/* 远山 / 近地 */}
      <path d="M 0 96 Q 90 46 190 84 T 380 74 T 560 88 L 560 150 L 0 150 Z" fill={v.rocky ? '#9fb0c8' : '#b8c9a7'} opacity={v.rocky ? 0.4 : 0.55} />
      <path d="M 0 116 Q 140 92 300 116 T 560 108 L 560 150 L 0 150 Z" fill="#76906a" opacity={0.28} />

      {/* 测量基准路径（不可见） */}
      <path ref={baseRef} d={TRAIL} fill="none" stroke="none" />

      {/* 路径：起点与中段平整 */}
      <path d={TRAIL} fill="none" stroke="#dce7d5" strokeWidth={9} strokeLinecap="round" />
      {v.rocky ? null : <path d={TRAIL} fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" opacity={0.8} />}

      {/* §2 路径中断：实线止于断点，其后为虚线 */}
      {chapterId === 'chap-2' ? (
        <g>
          <path d={TRAIL_SOLID} fill="none" stroke="#dce7d5" strokeWidth={9} strokeLinecap="round" />
          <path d={TRAIL_SOLID} fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path d={TRAIL_DASH} fill="none" stroke="#dce7d5" strokeWidth={5} strokeLinecap="round" />
          <path d={TRAIL_DASH} fill="none" stroke="#c43f52" strokeWidth={2.6} strokeDasharray="6 6" strokeLinecap="round" opacity={0.75} />
          <line x1={385} y1={78} x2={385} y2={98} stroke="#c43f52" strokeWidth={2} />
          <text x={394} y={112} fontSize={11} fill="#c43f52" fontWeight={600}>
            路径在此中断：走到了 ≠ 到达了
          </text>
        </g>
      ) : null}

      {/* §6 支线 */}
      {chapterId === 'chap-6' ? <path d={FORK} fill="none" stroke="#92400e" strokeWidth={3} strokeLinecap="round" strokeDasharray="6 6" opacity={0.7} /> : null}

      {/* §9 地形层（进入时才显现） */}
      {chapterId === 'chap-9' ? (
        <g>
          <path d="M 28 105 L 150 105 C 215 105 245 88 305 88 L 260 88" fill="none" stroke="none" />
          <path d="M 150 105 C 215 105 245 88 305 88" fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" opacity={0.8} />
          <g data-fx="terr-rock" className="fx">
            <path d="M 258 88 L 388 88" fill="none" stroke="#8a6b4a" strokeWidth={3.6} strokeLinecap="round" />
            {[[268, 88], [296, 90], [324, 88], [352, 90], [378, 88]].map(([x, y], i) => (
              <path key={i} d={`M ${x - 4} ${y} l 4 -5 l 4 5 z`} fill="#6b5236" />
            ))}
            <text x={322} y={112} textAnchor="middle" fontSize={10.5} fill="#6b5236" fontWeight={700}>
              碎石层 · 动力学与碰撞
            </text>
          </g>
          <g data-fx="terr-ice" className="fx">
            <path d="M 385 88 C 450 88 500 70 524 58" fill="none" stroke="#6aa7cc" strokeWidth={3.8} strokeLinecap="round" />
            {[[414, 84], [442, 82], [470, 74]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x + 9} y2={y - 3} stroke="#cfe8f5" strokeWidth={2} strokeLinecap="round" />
            ))}
            <text x={468} y={40} textAnchor="middle" fontSize={10.5} fill="#3d7ba6" fontWeight={700}>
              冰面层 · 噪声·延迟·安全
            </text>
          </g>
        </g>
      ) : null}

      {/* 道具与本章 FX */}
      {v.prop === 'map' ? (
        <g>
          <rect x={30} y={16} width={92} height={60} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          <path d="M 44 64 Q 78 28 108 36" fill="none" stroke="#27446e" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={108} cy={36} r={4} fill="#228d5c" />
          <text x={76} y={92} textAnchor="middle" fontSize={11} fill="#68778f">角色地图</text>
          <rect data-fx="map-glow" className="fx fx-glow" x={26} y={12} width={100} height={68} rx={9} fill="none" stroke="#f07e47" strokeWidth={2.4} />
        </g>
      ) : null}

      {v.prop === 'notebook' ? (
        <g>
          <rect x={34} y={16} width={86} height={56} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          {[
            { id: 'note-l0', y: 30, c: '#c43f52' },
            { id: 'note-l1', y: 42, c: '#228d5c' },
            { id: 'note-l2', y: 54, c: '#228d5c' },
          ].map((l) => (
            <g key={l.id}>
              <line x1={46} y1={l.y} x2={106} y2={l.y} stroke="#e2e8f1" strokeWidth={2.6} strokeLinecap="round" />
              <line data-fx={l.id} className="fx-line" x1={46} y1={l.y} x2={106} y2={l.y} stroke={l.c} strokeWidth={2.6} strokeLinecap="round" />
            </g>
          ))}
          <text x={77} y={88} textAnchor="middle" fontSize={11} fill="#68778f">会话记录</text>
        </g>
      ) : null}

      {v.prop === 'gate' ? (
        <g>
          <line x1={92} y1={105} x2={92} y2={62} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={136} y1={105} x2={136} y2={62} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path data-fx="gate-open" className="gate-arc" d="M 92 70 Q 114 84 136 64" fill="none" stroke="#f07e47" strokeWidth={3.2} strokeLinecap="round" />
          <text x={114} y={118} textAnchor="middle" fontSize={10.5} fill="#f07e47" fontWeight={600}>出发前检查</text>
          <g fontSize={9.5} fontWeight={700}>
            <Pill id="gate-c0" x={200} y={44} text="✓ 观测模态" tone="green" />
            <Pill id="gate-c1" x={200} y={66} text="✓ 动作语义" tone="green" />
            <Pill id="gate-c2" x={200} y={88} text="✓ 控制频率" tone="green" />
          </g>
        </g>
      ) : null}

      {v.prop === 'camp' ? (
        <g>
          <path d="M 306 88 L 330 54 L 354 88 Z" fill="#e7ddc8" stroke="#92400e" strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M 330 54 L 330 88" stroke="#92400e" strokeWidth={1.6} opacity={0.7} />
          <line x1={358} y1={88} x2={358} y2={46} stroke="#92400e" strokeWidth={2.2} />
          <path className="flag-cloth" d="M 358 46 L 380 53 L 358 60 Z" fill="#228d5c" />
          <text x={330} y={106} textAnchor="middle" fontSize={10.5} fill="#228d5c" fontWeight={600}>大本营 · 系统层</text>
          <g fontSize={10} fontWeight={700}>
            <text data-fx="camp-fx0" className="fx" x={296} y={50} textAnchor="middle" fill="#27446e">📋 记录</text>
            <text data-fx="camp-fx1" className="fx" x={330} y={38} textAnchor="middle" fill="#27446e">🎒 检查</text>
            <text data-fx="camp-fx2" className="fx" x={364} y={50} textAnchor="middle" fill="#27446e">📦 补给</text>
          </g>
          <path data-fx="camp-route" className="fx-blink" d="M 352 84 C 400 72 440 64 470 62" fill="none" stroke="#228d5c" strokeWidth={2} strokeDasharray="5 5" />
        </g>
      ) : null}

      {v.prop === 'radio' ? (
        <g>
          <line x1={345} y1={88} x2={345} y2={44} stroke="#27446e" strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={345} cy={40} r={3.4} fill="#27446e" />
          <rect x={318} y={84} width={54} height={7} rx={3.5} fill="#27446e" opacity={0.5} />
          <text x={345} y={106} textAnchor="middle" fontSize={10.5} fill="#27446e" fontWeight={600}>同一频道 · 共享状态</text>
          {[0, 1, 2].map((i) => (
            <circle key={i} data-fx={`radio-w${i}`} className="fx-ripple" cx={345} cy={38} r={8} fill="none" stroke="#27446e" strokeWidth={2} />
          ))}
        </g>
      ) : null}

      {v.prop === 'signposts' ? (
        <g>
          <line x1={310} y1={88} x2={310} y2={54} stroke="#92400e" strokeWidth={2.4} />
          <rect x={293} y={40} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={310} y={52} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>S₀</text>
          <line x1={470} y1={64} x2={470} y2={34} stroke="#92400e" strokeWidth={2.4} />
          <rect x={453} y={20} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={470} y={32} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>S_T</text>
          <path data-fx="s0-flash" className="fx-blink" d="M 468 60 C 420 24 360 24 314 80" fill="none" stroke="#f07e47" strokeWidth={2} strokeDasharray="5 5" />
        </g>
      ) : null}

      {v.prop === 'check' ? (
        <g data-fx="end-check" className="fx">
          <circle cx={496} cy={30} r={13} fill="#228d5c" opacity={0.14} />
          <path d="M 490 30 L 495 35 L 504 24" fill="none" stroke="#228d5c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}

      <Flag color={v.flagColor} />

      {/* 本章 FX（随时间线弹出） */}
      {chapterId === 'chap-1' ? (
        <g>
          <Pill id="q1" x={250} y={56} text="这些步骤谁来负责？" tone="blue" />
          <Pill id="noowner" x={424} y={100} text="验证 · 记录：No owner" tone="red" fs={10} />
        </g>
      ) : null}
      {chapterId === 'chap-2' ? (
        <g>
          <Pill id="q-break" x={372} y={52} text="为什么够不到旗子？" tone="red" fs={10} />
          <circle data-fx="flag-dim" className="fx fx-glow" cx={532} cy={32} r={20} fill="none" stroke="#c43f52" strokeWidth={2} />
        </g>
      ) : null}
      {chapterId === 'chap-3' ? <Pill id="camp-rest" x={264} y={66} text="整备中…" tone="green" fs={10} /> : null}
      {chapterId === 'chap-4' ? <Pill id="radio-msg" x={244} y={62} text="上报: state=running ✓" tone="blue" fs={10} /> : null}
      {chapterId === 'chap-5' ? <Pill id="gate-pass" x={205} y={100} text="预检通过 · 放行" tone="green" fs={10} /> : null}
      {chapterId === 'chap-6' ? (
        <g>
          <Pill id="fork-main" x={446} y={72} text="实线主路 → 旗子" tone="green" fs={10} />
          <Pill id="fork-branch" x={446} y={130} text="虚线支路 → 同一目标" tone="blue" fs={10} />
        </g>
      ) : null}
      {chapterId === 'chap-7' ? <Pill id="st-ok" x={448} y={104} text="S₀ → S_T 变化成立 ✓" tone="green" fs={10} /> : null}
      {chapterId === 'chap-8' ? (
        <g>
          <Pill id="fail-x" x={290} y={56} text="✗ 第一次失败" tone="red" fs={10} />
          <Pill id="ok-check" x={415} y={56} text="✓ 重试成功" tone="green" fs={10} />
          <Pill id="note-note" x={166} y={62} text="失败与成功都追加进记录" tone="blue" fs={9.5} />
        </g>
      ) : null}
      {chapterId === 'chap-9' ? <Pill id="terr-done" x={300} y={34} text="同一套认知，逐层加回物理" tone="blue" fs={10} /> : null}
      {chapterId === 'chap-10' ? (
        <g fontSize={9.5} fontWeight={700}>
          <Pill id="end-r0" x={436} y={92} text="协议 ✓" tone="green" fs={9.5} />
          <Pill id="end-r1" x={428} y={106} text="提升 ✓" tone="green" fs={9.5} />
          <Pill id="end-r2" x={438} y={120} text="边界 ⚠" tone="orange" fs={9.5} />
        </g>
      ) : null}

      {/* 隐喻 ↔ 论文 对应标签 */}
      <g>
        <rect x={280 - chipW / 2} y={8} width={chipW} height={20} rx={10} fill="#fff" stroke="#d7deea" strokeWidth={1.4} />
        <text x={280} y={22} textAnchor="middle" fontSize={10.5} fill="#27446e" fontWeight={700}>{chipText}</text>
      </g>

      {/* 主角：位置由 rAF 时间线精确驱动（脚踩在路径上） */}
      <g ref={walkerRef} className="analogy-walker">
        <g ref={hikerRef} className="hiker-bounce">
          <Hiker />
        </g>
      </g>
    </svg>
  );
};

export default AnalogyScene;
