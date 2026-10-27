import { HISTORY_Z, LOGIT_CASES, logitComparison } from "../math-model.ts";

// Given outputs at two training moments, not a simulated optimizer trajectory.
export const LIFECYCLE_FIXTURE = {
  capacity: 2, sampleId: "sample:x1", recordId: "record:x1:i", targetId: "target:x1:i",
  z: HISTORY_Z, replayOutput: LOGIT_CASES[0].values, currentSampleId: "sample:x2",
} as const;

export const LIFECYCLE_CLIPS = [
  { id: "原图与当前视图", durationMs: 3000, holdMs: 1200 },
  { id: "生成整组响应", durationMs: 4000, holdMs: 1500 },
  { id: "复制并冻结", durationMs: 4200, holdMs: 1800 },
  { id: "先更新当前网络", durationMs: 2400, holdMs: 1300 },
  { id: "候选写入空槽", durationMs: 3400, holdMs: 1700 },
  { id: "下一步读取与回放", durationMs: 6500, holdMs: 1800 },
  { id: "对齐、相减与平方", durationMs: 5200, holdMs: 2200 },
  { id: "一次联合更新", durationMs: 2800, holdMs: 2000 },
] as const;

export const bound = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, p: number) => a + (b - a) * bound(p);
export const smooth = (p: number) => { const t = bound(p); return t * t * (3 - 2 * t); };
export const windowAt = (p: number, start: number, end: number) => smooth((p - start) / (end - start));
export type Point = { x: number; y: number };
export function curve(p: number, a: Point, b: Point, c: Point, d: Point): Point {
  const t = bound(p), s = 1 - t;
  return { x: s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x,
    y: s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y };
}

export function lifecycleSceneAt(clip: number, progress: number) {
  const index = Math.max(0, Math.min(LIFECYCLE_CLIPS.length - 1, Math.floor(clip)));
  const p = bound(progress);
  const phase = (n: number) => index > n ? 1 : index < n ? 0 : p;
  const enter = phase(0), forward = phase(1), copy = phase(2), update = phase(3), store = phase(4);
  const later = index >= 5, replay = phase(5), compare = phase(6), joint = phase(7);
  const firstUpdated = update >= .7;
  const stored = store >= .92;
  const copyMotion = smooth(copy);
  const storeMotion = windowAt(store, .2, .92);
  const targetOrigin = store > 0
    ? curve(storeMotion, { x: 730, y: 375 }, { x: 730, y: 450 }, { x: 800, y: 475 }, { x: 800, y: 555 })
    : curve(copyMotion, { x: 730, y: 205 }, { x: 1000, y: 205 }, { x: 1000, y: 375 }, { x: 730, y: 375 });
  const targetPoints = HISTORY_Z.map((v, k) => ({
    x: mix(v * mix(55, 48, copyMotion), k * 42, storeMotion),
    y: mix(k * mix(55, 36, copyMotion), 0, storeMotion),
  }));
  const input = { x: mix(105, 305, windowAt(enter, .25, 1)), y: 250 };
  const currentInput = curve(windowAt(replay, .05, .32), { x: 105, y: 180 }, { x: 190, y: 180 }, { x: 240, y: 225 }, { x: 305, y: 250 });
  const replayInput = curve(windowAt(replay, .35, .78), { x: 735, y: 555 }, { x: 125, y: 535 }, { x: 125, y: 390 }, { x: 305, y: 270 });
  const samplePacking = curve(windowAt(store, 0, .6), { x: 105, y: 250 }, { x: 105, y: 445 }, { x: 520, y: 485 }, { x: targetOrigin.x - 65, y: targetOrigin.y });
  const camera = windowAt(compare, 0, .25);
  const difference = windowAt(compare, .28, .55);
  const squares = windowAt(compare, .55, .85);
  const sum = windowAt(compare, .85, 1);
  const match = logitComparison(LIFECYCLE_FIXTURE.z, LIFECYCLE_FIXTURE.replayOutput);
  const currentPoints = match.a.map((v, k) => ({
    x: mix(730, 580, camera) + v * mix(55, 100, camera),
    y: mix(205 + k * 55, 210 + k * 80, camera),
  }));
  const referencePoints = match.z.map((v, k) => ({
    x: mix(800 + k * 42, 580 + v * 100, camera), y: mix(555, 210 + k * 80, camera),
  }));
  const parameter = joint >= .75 ? "θⱼ₊₁" : later ? "θⱼ = θᵢ₊₁" : firstUpdated ? "θᵢ₊₁" : "θᵢ";
  return { clip: index, progress: p, enter, forward, copy, update, store, later, replay, compare, joint,
    firstUpdated, stored, targetOrigin, targetPoints, input, currentInput, replayInput, samplePacking,
    camera, difference, squares, sum, match, currentPoints, referencePoints, parameter,
    hasTarget: copy > 0, memoryCount: stored ? 1 : 0, seen: stored ? 1 : 0,
    replaySelected: later && replay >= .05, currentCE: later ? replay >= .32 : forward >= 1,
    outputReady: later ? replay >= .92 : forward >= 1,
    outputReveal: [0, 1, 2].map(k => later ? windowAt(replay, .78 + k * .045, .86 + k * .045) : windowAt(forward, .5 + k * .1, .7 + k * .1)),
    sampleId: LIFECYCLE_FIXTURE.sampleId, recordId: LIFECYCLE_FIXTURE.recordId,
    targetId: LIFECYCLE_FIXTURE.targetId, z: LIFECYCLE_FIXTURE.z,
    replaySource: later && replay >= .05 ? LIFECYCLE_FIXTURE.recordId : null,
    lossSources: later && replay >= .95 ? ["current-ce", "historical-squared"] : (later ? replay >= .32 : forward >= 1) ? ["current-ce"] : [],
    updateCount: (firstUpdated ? 1 : 0) + (joint >= .75 ? 1 : 0),
    writes: stored ? [LIFECYCLE_FIXTURE.recordId] : [],
  };
}
