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
  pendingPrefixIndex: number | null;
  pendingPrefixProgress: number;
  quotaChangeProgress: number;
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
  const quotaChangeProgress = ease((p - 0.12) / 0.16);
  const tailMotion = ease((p - 0.34) / (0.86 - 0.34));
  const tailState: BudgetTailState = p < 0.16 ? "steady" : p < 0.34 ? "pending" : p < 0.86 ? "removing" : "removed";
  const isRemoved = tailState === "removed";
  const prefix = isRemoved
    ? makePrefixState(4, 3, 1, 3)
    : makePrefixState(4, 4, 1, 4);
  return {
    ...prefix,
    pendingPrefixIndex: p >= 0.16 && !isRemoved ? 3 : null,
    pendingPrefixProgress: p < 0.16 ? 0 : p < 0.34 ? ease((p - 0.16) / 0.18) : isRemoved ? 0 : 0.82,
    quotaChangeProgress,
    tailOpacity: 1 - tailMotion,
    tailDisplacement: 30 * tailMotion,
    tailState,
  };
}
