import { HERDING_DEMO_ROUNDS } from "./herding-teaching-demo";
import type { Vector2 } from "./icarl-runtime";

export type PrefixReviewState = {
  visiblePrefixCount: number;
  activePrefixIndex: number;
  fromPrefixIndex: number;
  targetPrefixIndex: number;
  markerProgress: number;
  currentPrefixPoint: Vector2;
  lineOpacity: number;
};

export type BudgetTailState = "steady" | "pending" | "removing" | "removed";

export type BudgetState = PrefixReviewState & {
  tailOpacity: number;
  tailDisplacement: number;
  tailState: BudgetTailState;
};

const REVIEW_WINDOWS = [0.2, 0.45, 0.7, 0.95] as const;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function prefixPoint(index: number): Vector2 {
  return HERDING_DEMO_ROUNDS[index - 1].normalizedPrefixMean;
}

function makePrefixState(fromPrefixIndex: number, targetPrefixIndex: number, markerProgress: number, visiblePrefixCount: number): PrefixReviewState {
  const progress = clamp01(markerProgress);
  const activePrefixIndex = targetPrefixIndex;
  return {
    visiblePrefixCount,
    activePrefixIndex,
    fromPrefixIndex,
    targetPrefixIndex,
    markerProgress: progress,
    currentPrefixPoint: prefixPoint(activePrefixIndex),
    lineOpacity: 0.22 + progress * 0.42,
  };
}

/** Derives the automatic review state from the timeline; manual selection pins an exact result. */
export function reviewAt(progress: number, manualReviewIndex: number | null = null): PrefixReviewState {
  if (manualReviewIndex !== null) {
    const selected = Math.max(1, Math.min(HERDING_DEMO_ROUNDS.length, Math.round(manualReviewIndex)));
    return makePrefixState(selected, selected, 1, selected);
  }

  const p = clamp01(progress);
  if (p < REVIEW_WINDOWS[0]) return makePrefixState(1, 1, 1, 1);
  if (p < REVIEW_WINDOWS[1]) return makePrefixState(1, 2, ease((p - REVIEW_WINDOWS[0]) / (REVIEW_WINDOWS[1] - REVIEW_WINDOWS[0])), 2);
  if (p < REVIEW_WINDOWS[2]) return makePrefixState(2, 3, ease((p - REVIEW_WINDOWS[1]) / (REVIEW_WINDOWS[2] - REVIEW_WINDOWS[1])), 3);
  if (p < REVIEW_WINDOWS[3]) return makePrefixState(3, 4, ease((p - REVIEW_WINDOWS[2]) / (REVIEW_WINDOWS[3] - REVIEW_WINDOWS[2])), 4);
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
