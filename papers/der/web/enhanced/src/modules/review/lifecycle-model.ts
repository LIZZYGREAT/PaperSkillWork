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

/** Eight beats; the five design keyframes group as 1 | 2 | 3–4 | 5–6 | 7–8. */
export const LIFECYCLE_CLIPS = [
  { id: "原图与当前视图", durationMs: 2600, holdMs: 1000 },
  { id: "前向与整组响应", durationMs: 3600, holdMs: 1400 },
  { id: "复制并冻结", durationMs: 3600, holdMs: 1500 },
  { id: "先更新当前网络", durationMs: 2600, holdMs: 1300 },
  { id: "候选写入空槽", durationMs: 3400, holdMs: 1600 },
  { id: "下一步读取与回放", durationMs: 5600, holdMs: 1700 },
  { id: "对齐、相减与平方", durationMs: 4800, holdMs: 2000 },
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

/**
 * Stage geometry in the 1120×640 viewBox. The response is three score tiles, not a chart:
 * each tile carries the class, the number and a two-step level meter; the comparison reuses
 * the same tile with a frozen row above the current row.
 */
export const LIFECYCLE_GEOMETRY = {
  width: 1120,
  height: 640,
  model: { x: 250, y: 104, w: 340, h: 336 },
  anchor: { x: 34, y: 180, w: 156, h: 154 },
  tiles: { x: 700, y: 176, w: 96, h: 94, gap: 12 },
  tilesCompare: { x: 420, y: 150, w: 150, h: 124, gap: 20 },
  block: { x: 700, y: 344, w: 244, h: 72 },
  record: { x: 218, y: 488, w: 324, h: 104 },
  recordInner: { x: 286, y: 520, w: 244, h: 68 },
  slot0: { x: 210, y: 486, w: 340, h: 108 },
  sample: { x: 34, y: 150, size: 96 },
  ports: { current: 300, replay: 366 },
  path: {
    enter: [{ x: 130, y: 198 }, { x: 186, y: 200 }, { x: 150, y: 296 }, { x: 218, y: 300 }],
    replay: [{ x: 212, y: 530 }, { x: 132, y: 512 }, { x: 128, y: 372 }, { x: 222, y: 366 }],
  },
  loss: { y: { x: 34, y: 52, w: 96, h: 46 }, ce: { x: 740, y: 50, w: 142, h: 48 }, pill: { x: 896, y: 60, w: 190, h: 30 } },
  band: { x: 34, y: 456, w: 1052, h: 156 },
} as const;

const G = LIFECYCLE_GEOMETRY;
const blockMarker = (k: number, block: { x: number; y: number; w: number; h: number }): Point => {
  const cw = (block.w - 26) / 3;
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

  const [e0, e1, e2, e3] = G.path.enter;
  const [r0, r1, r2, r3] = G.path.replay;
  const input = curve(windowAt(enter, 0.15, 0.92), e0, e1, e2, e3);
  const currentInput = curve(windowAt(replay, 0.02, 0.3), { x: 130, y: 168 }, { x: 186, y: 170 }, { x: 150, y: 296 }, { x: 218, y: 300 });
  const replayInput = curve(windowAt(replay, 0.32, 0.68), r0, r1, r2, r3);

  const copyMotion = windowAt(copy, 0.12, 0.8);
  const restMarker = (k: number): Point => blockMarker(k, G.block);
  const assembly = windowAt(store, 0.1, 0.75);
  const recordVisible = windowAt(store, 0.05, 0.35);
  const blockNow = {
    x: mix(G.block.x, G.recordInner.x, assembly),
    y: mix(G.block.y, G.recordInner.y, assembly),
    w: mix(G.block.w, G.recordInner.w, assembly),
    h: mix(G.block.h, G.recordInner.h, assembly),
  };
  const recordPos = { x: G.record.x, y: G.record.y };

  // Score tiles: the same three tiles grow into the comparison composition.
  const tiles = {
    x: mix(G.tiles.x, G.tilesCompare.x, lens),
    y: mix(G.tiles.y, G.tilesCompare.y, lens),
    w: mix(G.tiles.w, G.tilesCompare.w, lens),
    h: mix(G.tiles.h, G.tilesCompare.h, lens),
    gap: mix(G.tiles.gap, G.tilesCompare.gap, lens),
  };
  const tileX = (k: number) => tiles.x + k * (tiles.w + tiles.gap);

  const match = logitComparison(LIFECYCLE_FIXTURE.z, LIFECYCLE_FIXTURE.replayOutput);
  const baseToken = (k: number): Point => ({ x: tileX(k) + tiles.w * 0.72, y: tiles.y + tiles.h * 0.56 });
  const compareCurrent = (k: number): Point => ({ x: tileX(k) + 22, y: tiles.y + 96 });
  const compareFrozen = (k: number): Point => ({ x: tileX(k) + 22, y: tiles.y + 54 });

  const currentPoints = [0, 1, 2].map(k => ({
    x: mix(baseToken(k).x, compareCurrent(k).x, lens),
    y: mix(baseToken(k).y, compareCurrent(k).y, lens),
  }));
  const sourcePoints = [0, 1, 2].map(k => baseToken(k));
  const copyPoints = [0, 1, 2].map((_, k) => {
    const from = sourcePoints[k];
    const to = restMarker(k);
    return { x: mix(from.x, to.x, copyMotion), y: mix(from.y, to.y, copyMotion) };
  });
  const carried = windowAt(compare, 0.05, 0.42);
  const targetPoints = [0, 1, 2].map((_, k) => ({
    x: mix(restMarker(k).x, compareFrozen(k).x, carried),
    y: mix(restMarker(k).y, compareFrozen(k).y, carried),
  }));

  const difference = windowAt(compare, 0.34, 0.58);
  const squares = windowAt(compare, 0.56, 0.84);
  const sum = windowAt(compare, 0.84, 1);
  const merged = windowAt(joint, 0.1, 0.45);
  const updated = windowAt(joint, 0.45, 0.8);
  const parameter = index < 3 ? "θᵢ" : index === 3 ? (firstUpdated ? "θᵢ₊₁" : "θᵢ") : index < 7 ? "θⱼ" : (joint >= 0.75 ? "θⱼ₊₁" : "θⱼ");

  const outputReveal = [0, 1, 2].map(k => later
    ? windowAt(replay, 0.62 + k * 0.06, 0.76 + k * 0.06)
    : windowAt(forward, 0.4 + k * 0.12, 0.6 + k * 0.12));

  return {
    clip: index, progress: p, enter, forward, copy, update, store, later, replay, compare, joint,
    firstUpdated, stored, lens, recordVisible, assembly, copyMotion,
    parameter, tiles, tileX,
    input, currentInput, replayInput,
    blockNow, recordPos, copyPoints,
    match, currentPoints, sourcePoints, targetPoints,
    referencePoints: targetPoints,
    targetOrigin: carried > 0 ? targetPoints[0] : { x: blockNow.x, y: blockNow.y },
    difference, squares, sum, merged, updated,
    outputReveal,
    enterDocked: windowAt(enter, 0.84, 1),
    replayDocked: windowAt(replay, 0.6, 0.74),
    trailEnter: windowAt(enter, 0.08, 0.9) * (1 - windowAt(enter, 0.94, 1)),
    trailReplay: windowAt(replay, 0.26, 0.7) * (1 - windowAt(replay, 0.78, 0.9)),
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
  };
}
