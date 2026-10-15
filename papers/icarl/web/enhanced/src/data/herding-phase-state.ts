import { HERDING_DEMO_ROUNDS } from "./herding-teaching-demo";
import type { Vector2 } from "./icarl-runtime";

export type PrefixReviewState = {
  visiblePrefixCount: number;
  activePrefixIndex: number;
  introducedPrefixIndex: number;
  fromPrefixIndex: number;
  targetPrefixIndex: number;
  markerProgress: number;
  arrivalProgress: number;
  currentPrefixPoint: Vector2;
  lineOpacity: number;
};

export type BudgetTailState = "steady" | "pending" | "removing" | "removed";

export type BudgetState = PrefixReviewState & {
  tailOpacity: number;
  tailDisplacement: number;
  tailState: BudgetTailState;
};

const REVIEW_ENTRY_STARTS = [0.16, 0.36, 0.56] as const;
const REVIEW_ENTRY_DURATION = 0.1;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function prefixPoint(index: number): Vector2 {
  return HERDING_DEMO_ROUNDS[index - 1].normalizedPrefixMean;
}

function makePrefixState(fromPrefixIndex: number, targetPrefixIndex: number, markerProgress: number, visiblePrefixCount: number, arrivalProgress = 1): PrefixReviewState {
  const progress = clamp01(markerProgress);
  const activePrefixIndex = targetPrefixIndex;
  return {
    visiblePrefixCount,
    activePrefixIndex,
    introducedPrefixIndex: targetPrefixIndex,
    fromPrefixIndex,
    targetPrefixIndex,
    markerProgress: progress,
    arrivalProgress: clamp01(arrivalProgress),
    currentPrefixPoint: prefixPoint(activePrefixIndex),
    lineOpacity: 0.24 + progress * 0.7,
  };
}

/** Derives the automatic review state from the timeline; manual selection pins an exact result. */
export function reviewAt(progress: number, manualReviewIndex: number | null = null): PrefixReviewState {
  if (manualReviewIndex !== null) {
    const selected = Math.max(1, Math.min(HERDING_DEMO_ROUNDS.length, Math.round(manualReviewIndex)));
    return makePrefixState(selected, selected, 1, selected);
  }

  const p = clamp01(progress);
  if (p < REVIEW_ENTRY_STARTS[0]) return makePrefixState(1, 1, 1, 1);
  for (let target = 2; target <= HERDING_DEMO_ROUNDS.length; target += 1) {
    const start = REVIEW_ENTRY_STARTS[target - 2];
    const nextStart = REVIEW_ENTRY_STARTS[target - 1] ?? 0.76;
    if (p < nextStart) {
      const arrival = ease((p - start) / REVIEW_ENTRY_DURATION);
      return makePrefixState(target - 1, target, arrival, target, arrival);
    }
  }
  return makePrefixState(4, 4, 1, 4);
}

/** Shows p₄ leaving its slot while preserving all candidate and prefix coordinates. */
export function budgetAt(progress: number): BudgetState {
  const p = clamp01(progress);
  const tailMotion = ease((p - 0.42) / (0.75 - 0.42));
  const markerProgress = tailMotion;
  const tailState: BudgetTailState = p < 0.18 ? "steady" : p < 0.42 ? "pending" : p < 0.75 ? "removing" : "removed";
  const prefix = p < 0.42
    ? makePrefixState(4, 4, 1, 4)
    : makePrefixState(4, 3, markerProgress, p < 0.75 ? 4 : 3);
  return {
    ...prefix,
    tailOpacity: 1 - tailMotion,
    tailDisplacement: 24 * tailMotion,
    tailState,
  };
}
