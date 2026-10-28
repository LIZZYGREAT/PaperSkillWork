import { HISTORY_Z, LOGIT_CASES, logitComparison } from "../math-model.ts";

// Given outputs at two training moments, not a simulated optimizer trajectory.
export const LIFECYCLE_FIXTURE = {
  capacity: 2,
  sampleId: "sample:x1",
  recordId: "record:x1:i",
  targetId: "target:x1:i",
  z: HISTORY_Z,
  replayOutput: LOGIT_CASES[0].values,
  currentSampleId: "sample:x2",
} as const;

/** Eight beats, two per keyframe pair: the five keyframes group as 1 | 2 | 3–4 | 5–6 | 7–8. */
export const LIFECYCLE_CLIPS = [
  { id: "原图与当前视图", durationMs: 2800, holdMs: 1100 },
  { id: "前向与整组响应", durationMs: 3800, holdMs: 1400 },
  { id: "复制并冻结", durationMs: 4000, holdMs: 1600 },
  { id: "先更新当前网络", durationMs: 2600, holdMs: 1300 },
  { id: "候选写入空槽", durationMs: 3600, holdMs: 1700 },
  { id: "下一步读取与回放", durationMs: 6000, holdMs: 1700 },
  { id: "对齐、相减与平方", durationMs: 5000, holdMs: 2100 },
  { id: "一次联合更新", durationMs: 2800, holdMs: 2000 },
] as const;

export const bound = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, p: number) => a + (b - a) * bound(p);
export const smooth = (p: number) => { const t = bound(p); return t * t * (3 - 2 * t); };
export const windowAt = (p: number, start: number, end: number) => smooth((p - start) / (end - start));
export type Point = { x: number; y: number };
export function curve(p: number, a: Point, b: Point, c: Point, d: Point): Point {
  const t = bound(p), s = 1 - t;
  return {
    x: s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x,
    y: s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y,
  };
}

/** Stage geometry in the 1120×640 viewBox; the design board keyframes use the same numbers. */
export const LIFECYCLE_GEOMETRY = {
  width: 1120,
  height: 640,
  model: { x: 250, y: 104, w: 340, h: 336 },
  anchor: { x: 34, y: 198, w: 156, h: 154 },
  plot: { x0: 700, unit: 114, rows: [196, 240, 284] as const, axisEnd: 1040 },
  compare: { x0: 360, unit: 130, rows: [168, 232, 296] as const, axisEnd: 680 },
  block: { x: 700, y: 338, w: 240, h: 92 },
  record: { x: 218, y: 488, w: 324, h: 104 },
  recordInner: { x: 290, y: 518, w: 240, h: 66 },
  slot0: { x: 210, y: 486, w: 340, h: 108 },
  sample: { x: 34, y: 150, size: 96 },
  sampleThumb: { x: 230, y: 524, size: 48 },
  view: { size: 64 },
  path: {
    enter: [{ x: 130, y: 198 }, { x: 176, y: 198 }, { x: 196, y: 300 }, { x: 246, y: 300 }],
    replay: [{ x: 206, y: 530 }, { x: 178, y: 530 }, { x: 178, y: 366 }, { x: 246, y: 366 }],
  },
  loss: { y: { x: 34, y: 52, w: 96, h: 46 }, ce: { x: 740, y: 50, w: 142, h: 48 }, pill: { x: 896, y: 60, w: 190, h: 30 } },
  band: { x: 34, y: 456, w: 1052, h: 156 },
} as const;

const G = LIFECYCLE_GEOMETRY;
const blockMarker = (k: number, block: { x: number; y: number; w: number; h: number }): Point => {
  const inner = block.w - 26;
  const cw = inner / 3;
  return { x: block.x + 13 + cw * k + cw / 2 - 20, y: block.y + block.h - 26 };
};

export function lifecycleSceneAt(clip: number, progress: number) {
  const index = Math.max(0, Math.min(LIFECYCLE_CLIPS.length - 1, Math.floor(clip)));
  const p = bound(progress);
  const phase = (n: number) => index > n ? 1 : index < n ? 0 : p;
  const enter = phase(0), forward = phase(1), copy = phase(2), update = phase(3), store = phase(4);
  const later = index >= 5, replay = phase(5), compare = phase(6), joint = phase(7);

  const firstUpdated = update >= 0.7;
  const stored = store >= 0.9;
  const lens = windowAt(compare, 0, 0.32);
  const recordInSlot = stored ? 1 : 0;

  const [e0, e1, e2, e3] = G.path.enter;
  const [r0, r1, r2, r3] = G.path.replay;
  // The view walks the reserved data corridor, then fades into the input port.
  const input = curve(windowAt(enter, 0.2, 1), e0, e1, e2, e3);
  const currentInput = curve(windowAt(replay, 0.02, 0.3), { x: 130, y: 168 }, { x: 176, y: 168 }, { x: 196, y: 300 }, { x: 246, y: 300 });
  const replayInput = curve(windowAt(replay, 0.34, 0.72), r0, r1, r2, r3);

  // Copy: squares lift from their beads into the frozen block, which then keeps its own life.
  const copyMotion = windowAt(copy, 0.12, 0.8);
  const restMarker = (k: number): Point => {
    const cw = (G.block.w - 26) / 3;
    return { x: G.block.x + 13 + cw * k + cw / 2 - 20, y: G.block.y + G.block.h - 26 };
  };
  const assembly = windowAt(store, 0.1, 0.75);
  const recordVisible = windowAt(store, 0.05, 0.35);
  const blockNow = {
    x: mix(G.block.x, G.recordInner.x, assembly),
    y: mix(G.block.y, G.recordInner.y, assembly),
    w: mix(G.block.w, G.recordInner.w, assembly),
    h: mix(G.block.h, G.recordInner.h, assembly),
  };
  const recordPos = { x: G.record.x, y: G.record.y };

  // Plot geometry interpolates into the comparison composition while the lens opens.
  const plot = {
    x0: mix(G.plot.x0, G.compare.x0, lens),
    unit: mix(G.plot.unit, G.compare.unit, lens),
    rows: G.plot.rows.map((row, k) => mix(row, G.compare.rows[k], lens)),
  };

  const match = logitComparison(LIFECYCLE_FIXTURE.z, LIFECYCLE_FIXTURE.replayOutput);
  const currentPoints = match.a.map((value, k) => ({ x: plot.x0 + value * plot.unit, y: plot.rows[k] }));
  const sourcePoints = LIFECYCLE_FIXTURE.z.map((value, k) => ({ x: plot.x0 + value * plot.unit, y: plot.rows[k] }));

  // Frozen markers: in the block while frozen, then carried onto the shared axis for comparison.
  const carried = windowAt(compare, 0.05, 0.42);
  const targetPoints = match.z.map((value, k) => {
    const inBlock = blockMarker(k, blockNow);
    const onAxis = { x: plot.x0 + value * plot.unit, y: plot.rows[k] };
    return { x: mix(inBlock.x, onAxis.x, carried), y: mix(inBlock.y, onAxis.y, carried) };
  });

  // The three squares keep their identity while leaving the axis for the frozen block.
  const copyPoints = LIFECYCLE_FIXTURE.z.map((_value, k) => {
    const from = sourcePoints[k];
    const to = restMarker(k);
    return {
      x: mix(from.x, to.x, copyMotion),
      y: mix(from.y, to.y, copyMotion) - Math.sin(Math.PI * copyMotion) * 16,
    };
  });

  const difference = windowAt(compare, 0.34, 0.58);
  const squares = windowAt(compare, 0.56, 0.84);
  const sum = windowAt(compare, 0.84, 1);
  const merged = windowAt(joint, 0.1, 0.45);
  const updated = windowAt(joint, 0.45, 0.8);
  const parameter = index < 3 ? "θᵢ" : index === 3 ? (firstUpdated ? "θᵢ₊₁" : "θᵢ") : index < 7 ? "θⱼ" : (joint >= 0.75 ? "θⱼ₊₁" : "θⱼ");

  const outputReveal = [0, 1, 2].map(k => later
    ? windowAt(replay, 0.74 + k * 0.05, 0.86 + k * 0.05)
    : windowAt(forward, 0.42 + k * 0.12, 0.62 + k * 0.12));

  return {
    clip: index, progress: p, enter, forward, copy, update, store, later, replay, compare, joint,
    firstUpdated, stored, lens, recordInSlot,
    parameter,
    plot,
    input, currentInput, replayInput,
    blockNow, recordPos, assembly, recordVisible, copyMotion, copyPoints,
    match, currentPoints, sourcePoints, targetPoints,
    referencePoints: targetPoints,
    targetOrigin: carried > 0
      ? { x: mix(blockNow.x, plot.x0 + LIFECYCLE_FIXTURE.z[0] * plot.unit, carried), y: mix(blockNow.y, plot.rows[0], carried) }
      : { x: blockNow.x, y: blockNow.y },
    samplePacking: curve(assembly, { x: 34, y: 198 }, { x: 260, y: 240 }, { x: 560, y: 330 }, { x: 742, y: 336 }),
    difference, squares, sum, merged, updated,
    outputReveal,
    memoryCount: stored ? 1 : 0,
    seen: stored ? 1 : 0,
    hasTarget: copy > 0,
    replaySource: later && replay >= 0.06 ? LIFECYCLE_FIXTURE.recordId : null,
    lossSources: later && replay >= 0.9 ? ["current-ce", "historical-squared"] : (later ? replay >= 0.32 : forward >= 1) ? ["current-ce"] : [],
    updateCount: (firstUpdated ? 1 : 0) + (joint >= 0.75 ? 1 : 0),
    writes: stored ? [LIFECYCLE_FIXTURE.recordId] : [],
    ceState: index >= 7 ? "joint" : firstUpdated ? "updated" : forward >= 1 ? "formed" : "none",
    sampleId: LIFECYCLE_FIXTURE.sampleId,
    recordId: LIFECYCLE_FIXTURE.recordId,
    targetId: LIFECYCLE_FIXTURE.targetId,
    z: LIFECYCLE_FIXTURE.z,
    plotDim: index === 3 ? windowAt(update, 0, 1) : later ? 1 : 0,
  };
}
