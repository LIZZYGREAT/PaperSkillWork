import { euclideanDistance, mean, normalize, type Vector2 } from "./icarl-runtime";

export type HerdingTeachingPoint = {
  id: string;
  angleDegrees: number;
  feature: Vector2;
};

export type HerdingTeachingCandidate = {
  point: HerdingTeachingPoint;
  rawPrefixMean: [number, number];
  prefixMean: [number, number];
  distanceToTarget: number;
  individualDistanceToTarget: number;
};

export type HerdingTeachingStep = {
  chosen: HerdingTeachingPoint;
  rawPrefixMean: [number, number];
  prefixMean: [number, number];
  distanceToTarget: number;
  candidates: HerdingTeachingCandidate[];
};

export type HerdingTeachingResult = {
  points: HerdingTeachingPoint[];
  targetRawMean: [number, number];
  target: [number, number];
  ordered: HerdingTeachingPoint[];
  steps: HerdingTeachingStep[];
};

const FEATURE_ANGLES = [-160, -84, -73, -69, -63, -9, 38, 58] as const;

/** Fixed synthetic teaching points. Each feature is L2-normalized onto the unit circle. */
export const HERDING_TEACHING_POINTS: HerdingTeachingPoint[] = FEATURE_ANGLES.map((angleDegrees, index) => {
  const radians = angleDegrees * Math.PI / 180;
  return { id: `h${index + 1}`, angleDegrees, feature: [Math.cos(radians), Math.sin(radians)] };
});

export const HERDING_TEACHING_QUOTA = 5;

export function runFeatureHerding(
  points: readonly HerdingTeachingPoint[] = HERDING_TEACHING_POINTS,
  quota = HERDING_TEACHING_QUOTA,
): HerdingTeachingResult {
  if (points.length === 0) throw new Error("Herding teaching example needs at least one feature point.");
  const targetRawMean = mean(points.map((point) => point.feature));
  const target = normalize(targetRawMean);
  const selected: HerdingTeachingPoint[] = [];
  const steps: HerdingTeachingStep[] = [];
  const count = Math.max(0, Math.min(Math.floor(quota), points.length));

  for (let index = 0; index < count; index += 1) {
    const candidates = points
      .filter((point) => !selected.some((item) => item.id === point.id))
      .map((point): HerdingTeachingCandidate => {
        const rawPrefixMean = mean([...selected.map((item) => item.feature), point.feature]);
        const prefixMean = normalize(rawPrefixMean);
        return {
          point,
          rawPrefixMean,
          prefixMean,
          distanceToTarget: euclideanDistance(prefixMean, target),
          individualDistanceToTarget: euclideanDistance(point.feature, target),
        };
      })
      .sort((left, right) => left.distanceToTarget - right.distanceToTarget || left.point.id.localeCompare(right.point.id));
    const winner = candidates[0];
    if (!winner) break;
    selected.push(winner.point);
    steps.push({
      chosen: winner.point,
      rawPrefixMean: winner.rawPrefixMean,
      prefixMean: winner.prefixMean,
      distanceToTarget: winner.distanceToTarget,
      candidates,
    });
  }

  return { points: [...points], targetRawMean, target, ordered: selected, steps };
}

export function summarizeFeaturePrefix(points: readonly HerdingTeachingPoint[]) {
  if (points.length === 0) return null;
  const rawMean = mean(points.map((point) => point.feature));
  return { rawMean, normalizedMean: normalize(rawMean) };
}

export const HERDING_TEACHING_RESULT = runFeatureHerding();
