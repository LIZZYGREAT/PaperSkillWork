import { probabilityComparison, logitComparison, REFERENCE_P, PROBABILITY_CASES, HISTORY_Z, LOGIT_CASES } from "../math-model.ts";

// Teaching comparison paths, never optimizer trajectories. No timers or mutable model state.
export const clamp = (t: number) => Math.max(0, Math.min(1, t));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t);
export const phase = (clip: number, progress: number, index: number) => clip > index ? 1 : clip < index ? 0 : clamp(progress);
export const KL_CLIPS = [
  { id: "建立参考", durationMs: 1200, holdMs: 700 },
  { id: "观察偏离", durationMs: 2200, holdMs: 900 },
  { id: "比较猫", durationMs: 1400, holdMs: 1100 },
  { id: "比较狗", durationMs: 1400, holdMs: 1100 },
  { id: "形成贡献", durationMs: 2200, holdMs: 1200 },
  { id: "汇总与优化", durationMs: 1800, holdMs: 1800 },
];
export const LOGIT_CLIPS = [
  { id: "同类对齐", durationMs: 1500, holdMs: 700 },
  { id: "形成偏差", durationMs: 2500, holdMs: 1100 },
  { id: "偏差平方", durationMs: 2300, holdMs: 1200 },
  { id: "求和与对照", durationMs: 1800, holdMs: 1800 },
];
export const FREEZE_CLIPS = [
  { id: "生成输出", durationMs: 2400, holdMs: 1100 },
  { id: "复制数值", durationMs: 2600, holdMs: 1300 },
  { id: "参数更新", durationMs: 1800, holdMs: 1500 },
  { id: "候选交接", durationMs: 2500, holdMs: 1800 },
];
export function klSceneAt(clip: number, progress: number, selected: number) {
  const q = REFERENCE_P.map((p, i) => lerp(p, PROBABILITY_CASES[selected].values[i], phase(clip, progress, 1)));
  const result = probabilityComparison(REFERENCE_P, q);
  return { ...result, referenceGrowth: phase(clip, progress, 0),
    category: clip === 3 ? 1 : 0, comparison: clip >= 2 ? phase(clip, progress, clip === 2 ? 2 : 3) : 0,
    contributionGrowth: phase(clip, progress, 4), sumGrowth: phase(clip, progress, 5) };
}
export function logitSceneAt(clip: number, progress: number, selected: number) {
  const a = HISTORY_Z.map((z, i) => lerp(z, LOGIT_CASES[selected].values[i], phase(clip, progress, 1)));
  return { ...logitComparison(HISTORY_Z, a), pairing: phase(clip, progress, 0),
    squareGrowth: phase(clip, progress, 2), sumGrowth: phase(clip, progress, 3) };
}
export function freezeSceneAt(clip: number, progress: number) {
  const forward = phase(clip, progress, 0);
  const copy = phase(clip, progress, 1);
  const update = phase(clip, progress, 2);
  const handoff = phase(clip, progress, 3);
  return { forward, copy, update, handoff, hasRecord: copy > 0, updated: update >= .5,
    recordX: lerp(780, 470, copy) + 350 * handoff,
    recordY: lerp(144, 365, copy), inputX: lerp(80, 360, clamp(forward * 2)),
    outputCount: Math.floor(clamp((forward - .45) / .55) * 3 + 1e-9),
    recordId: "x2@t", z: HISTORY_Z, inMemory: false };
}
