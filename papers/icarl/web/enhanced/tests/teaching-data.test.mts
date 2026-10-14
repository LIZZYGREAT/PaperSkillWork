/**
 * Paper-specific data checks for the P3/P4/P5 teaching examples.
 *
 * These assert the facts the animations claim: every plotted vector has unit length where the
 * narration says so, category prototypes come from their own exemplars, the Query prediction is
 * the real argmin, the Herding winners match the greedy computation, and Q has one row per D
 * sample whose three values are exactly the teacher responses.
 *
 * Run with `npm test`.
 */
import assert from "node:assert/strict";

import {
  CLASS_VISUALS,
  P_BEFORE,
  encode2D,
  euclideanDistance,
  mean,
  normalize,
  type Vector2,
} from "../src/data/icarl-runtime.ts";
import {
  HERDING_DEMO_ORDER,
  HERDING_DEMO_POINTS,
  HERDING_DEMO_ROUNDS,
  HERDING_DEMO_TARGET,
  HERDING_DEMO_TARGET_RAW,
} from "../src/data/herding-teaching-demo.ts";
import {
  HERDING_CHART,
  clockwiseOffsetFromTop,
  projectHerdingFeature,
} from "../src/data/herding-teaching-geometry.ts";
import {
  INCREMENTAL_STAGE_DATA,
  buildTargets,
  teacherSnapshotFor,
} from "../src/data/incremental-training.ts";
import { snapshotWriteProgress } from "../src/data/incremental-snapshot-progress.ts";

const OLD_CLASS_IDS = ["A", "B", "C"] as const;
const near = (a: number, b: number, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;
const unit = (vector: Vector2) => Math.hypot(vector[0], vector[1]);

/* ------------------------------------------------------------------ P3 --- */

const exemplars = OLD_CLASS_IDS.flatMap((classId) => P_BEFORE[classId]);
assert.equal(exemplars.length, 12, "P3 must show the twelve saved exemplars.");

for (const sample of exemplars) {
  const raw = encode2D(sample, "before");
  const normalized = normalize(raw);
  assert.ok(near(unit(normalized), 1), `${sample.id} must normalize to unit length.`);
  // The displayed raw feature must be the un-normalized encoder output.
  assert.ok(unit(raw) > 1e-6, `${sample.id} must have a usable raw feature.`);
}

const prototypes = OLD_CLASS_IDS.map((classId) => {
  const classFeatures = P_BEFORE[classId].map((sample) => normalize(encode2D(sample, "before")));
  const rawMean = mean(classFeatures);
  return { classId, rawMean, prototype: normalize(rawMean) };
});

for (const entry of prototypes) {
  const recomputed = mean(P_BEFORE[entry.classId].map((sample) => normalize(encode2D(sample, "before"))));
  assert.ok(near(entry.rawMean[0], recomputed[0]) && near(entry.rawMean[1], recomputed[1]),
    `Prototype mean for ${entry.classId} must come from its own four exemplars.`);
  assert.ok(near(unit(entry.prototype), 1), `Prototype ${entry.classId} must lie on the unit circle.`);
}

const queryRaw = encode2D({ id: "query", classId: "A", raw: [1.732, -1.0] }, "before");
const queryUnit = normalize(queryRaw);
assert.ok(near(unit(queryUnit), 1), "The query feature must be normalized before comparison.");

const distances = prototypes
  .map((entry) => ({ classId: entry.classId, distance: euclideanDistance(queryUnit, entry.prototype) }))
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId));
assert.equal(distances.length, 3, "P3 compares the query against three prototypes.");
assert.ok(distances[0].distance <= distances[1].distance && distances[1].distance <= distances[2].distance,
  "The displayed distances must be ordered by the real argmin.");
for (const entry of distances) {
  assert.ok(entry.distance <= 2 + 1e-9, `Distance to ${entry.classId} must be a valid chord length.`);
}
assert.ok(CLASS_VISUALS[distances[0].classId].index >= 1, "The prediction must name a real class.");

/* ------------------------------------------------------------------ P4 --- */

assert.equal(HERDING_DEMO_POINTS.length, 8, "The Herding teaching example uses eight candidates.");
assert.equal(HERDING_DEMO_ORDER.length, 4, "The Herding teaching example selects four exemplars.");
assert.ok(near(unit(HERDING_DEMO_TARGET), 1), "The Herding target must be normalized.");
assert.ok(
  near(HERDING_DEMO_TARGET_RAW[0], mean(HERDING_DEMO_POINTS.map((point) => point.feature))[0]) &&
  near(HERDING_DEMO_TARGET_RAW[1], mean(HERDING_DEMO_POINTS.map((point) => point.feature))[1]),
  "The full-class raw mean must be the mean of all eight unit features.",
);

const projectedOrigin = projectHerdingFeature([0, 0]);
const projectedTop = projectHerdingFeature([0, 1]);
const projectedRight = projectHerdingFeature([1, 0]);
const projectedBottom = projectHerdingFeature([0, -1]);
const projectedLeft = projectHerdingFeature([-1, 0]);
assert.deepEqual(projectedOrigin, HERDING_CHART.center, "The chart projection must preserve the feature-space origin.");
assert.ok(near(clockwiseOffsetFromTop(projectedTop), 0), "The scan must begin at the top of the circle.");
assert.ok(near(clockwiseOffsetFromTop(projectedRight), 90), "Increasing scan angle must move clockwise from top to right.");
assert.ok(near(clockwiseOffsetFromTop(projectedBottom), 180), "The bottom follows the right in clockwise order.");
assert.ok(near(clockwiseOffsetFromTop(projectedLeft), 270), "The left follows the bottom in clockwise order.");

const scanOrder = HERDING_DEMO_POINTS
  .map((point) => ({ id: point.id, offset: clockwiseOffsetFromTop(projectHerdingFeature(point.feature)) }))
  .sort((a, b) => a.offset - b.offset);
assert.deepEqual(
  scanOrder.map((item) => item.id),
  ["a5", "a1", "a7", "a2", "a8", "a4", "a3", "a6"],
  "Herding candidates must be visited in clockwise order from the circle top.",
);

const projectedRawTarget = projectHerdingFeature(HERDING_DEMO_TARGET_RAW);
const projectedTarget = projectHerdingFeature(HERDING_DEMO_TARGET);
const rawTargetFromOrigin = [projectedRawTarget.x - projectedOrigin.x, projectedRawTarget.y - projectedOrigin.y];
const targetFromOrigin = [projectedTarget.x - projectedOrigin.x, projectedTarget.y - projectedOrigin.y];
assert.ok(
  near(Math.hypot(...rawTargetFromOrigin) / HERDING_CHART.radius, unit(HERDING_DEMO_TARGET_RAW)),
  "The raw full-class mean must keep its true length under projection.",
);
assert.ok(
  near(rawTargetFromOrigin[0] * targetFromOrigin[1] - rawTargetFromOrigin[1] * targetFromOrigin[0], 0),
  "The raw and normalized full-class targets must remain on the same radial line.",
);
assert.ok(
  near(Math.hypot(...targetFromOrigin), HERDING_CHART.radius),
  "The normalized full-class target must lie on the displayed unit circle.",
);

for (const round of HERDING_DEMO_ROUNDS) {
  const prefix = HERDING_DEMO_ORDER.slice(0, round.k - 1).map((point) => point.feature);
  assert.equal(round.chosen.id, HERDING_DEMO_ORDER[round.k - 1].id, `Round ${round.k} winner must equal the recorded order.`);

  let best: { id: string; distance: number } | null = null;
  for (const candidate of round.candidates) {
    const prefixRaw = mean([...prefix, candidate.point.feature]);
    const prefixUnit = normalize(prefixRaw);
    assert.ok(
      near(prefixRaw[0], candidate.rawPrefixMean[0]) && near(prefixRaw[1], candidate.rawPrefixMean[1]),
      `Round ${round.k} candidate ${candidate.point.id} raw prefix mean must be the arithmetic mean of real endpoints.`,
    );
    assert.ok(
      near(prefixUnit[0], candidate.normalizedPrefixMean[0]) && near(prefixUnit[1], candidate.normalizedPrefixMean[1]),
      `Round ${round.k} candidate ${candidate.point.id} unit prefix mean must be normalized.`,
    );
    const projectedPrefix = projectHerdingFeature(candidate.normalizedPrefixMean);
    const projectedExpectedPrefix = projectHerdingFeature(prefixUnit);
    assert.ok(
      near(projectedPrefix.x, projectedExpectedPrefix.x) && near(projectedPrefix.y, projectedExpectedPrefix.y),
      `Round ${round.k} candidate ${candidate.point.id} must be drawn at its actual normalized prefix mean.`,
    );
    const distance = euclideanDistance(prefixUnit, HERDING_DEMO_TARGET);
    assert.ok(near(distance, candidate.score, 1e-9), `Round ${round.k} candidate ${candidate.point.id} score must equal the drawn distance.`);
    const projectedTargetForDistance = projectHerdingFeature(HERDING_DEMO_TARGET);
    const displayedDistance = Math.hypot(
      projectedPrefix.x - projectedTargetForDistance.x,
      projectedPrefix.y - projectedTargetForDistance.y,
    ) / HERDING_CHART.radius;
    assert.ok(
      near(displayedDistance, candidate.score, 1e-9),
      `Round ${round.k} candidate ${candidate.point.id} projected distance must match its distance-ruler score.`,
    );
    if (!best || distance < best.distance) best = { id: candidate.point.id, distance };
  }
  assert.equal(best?.id, round.chosen.id, `Round ${round.k} winner must be the greedy argmin, not a display choice.`);
  assert.ok(
    near(unit(round.normalizedPrefixMean), 1),
    `Round ${round.k} prefix mean must lie on the unit circle.`,
  );
}

// Greedy Herding does not promise a monotonically shrinking distance; the animation must not either.
const roundDistances = HERDING_DEMO_ROUNDS.map((round) => round.score);

/* ------------------------------------------------------------------ P5 --- */

assert.equal(INCREMENTAL_STAGE_DATA.oldExemplars.length, 12, "P5 reads twelve old exemplars.");
assert.equal(INCREMENTAL_STAGE_DATA.incomingSamples.length, 18, "P5 adds eighteen new images.");
assert.equal(INCREMENTAL_STAGE_DATA.trainingSamples.length, 30, "D must contain 12 + 18 = 30 samples.");

const trainingIds = new Set(INCREMENTAL_STAGE_DATA.trainingSamples.map((sample) => sample.id));
assert.equal(trainingIds.size, 30, "Every D sample must have a unique id.");

for (const sample of INCREMENTAL_STAGE_DATA.trainingSamples) {
  const row = teacherSnapshotFor(sample);
  assert.equal(row.length, 3, `${sample.id} must have three old-node responses.`);
  for (const value of row) {
    assert.ok(Number.isFinite(value) && value > 0 && value < 1, `${sample.id} responses must be sigmoid values.`);
  }
  const target = buildTargets(sample, row);
  assert.deepEqual(target.slice(0, 3), [row[0], row[1], row[2]], `${sample.id} target must start with its own Q row.`);
  for (let index = 0; index < 3; index += 1) {
    assert.equal(
      target[3 + index],
      Number(sample.classId === INCREMENTAL_STAGE_DATA.incomingClassIds[index]),
      `${sample.id} new-node target must come from its real label.`,
    );
  }
  // Q is fixed before the update: re-reading it must never depend on the student.
  assert.deepEqual(teacherSnapshotFor(sample), row, `${sample.id} Q row must be stable across reads.`);
}

// Both an old exemplar and a new-class image must be traceable to a real Q row.
const oldExample = INCREMENTAL_STAGE_DATA.oldExemplars.find((sample) => sample.classId === "B");
const newExample = INCREMENTAL_STAGE_DATA.incomingSamples.find((sample) => sample.classId === "E");
assert.ok(oldExample && newExample, "P5 must find the planned old B and incoming E demonstrations.");
assert.ok(trainingIds.has(oldExample.id) && trainingIds.has(newExample.id),
  "The demonstrated old and new samples must both belong to D.");

const firstDemoWrite = snapshotWriteProgress([oldExample], 2950, { startMs: 2500, rowTravelMs: 900 });
assert.equal(firstDemoWrite.activeSampleId, oldExample.id, "The old-image demo must write the Q row for that exact old sample.");
assert.deepEqual(firstDemoWrite.activeCellProgress, [1, 0.5, 0], "The old demo's cells must fill in order on its local row clock.");
const secondDemoWrite = snapshotWriteProgress([newExample], 2950, { startMs: 2500, rowTravelMs: 900 });
assert.equal(secondDemoWrite.activeSampleId, newExample.id, "The new-image demo must write the Q row for that exact new sample.");
assert.deepEqual(secondDemoWrite.activeCellProgress, [1, 0.5, 0], "The new demo must use the same row-local cell progression.");
assert.deepEqual(
  snapshotWriteProgress([oldExample], 3400, { startMs: 2500, rowTravelMs: 900 }).completedIds,
  [oldExample.id],
  "A demonstrated row becomes recorded only after its own row animation completes.",
);

const demoIds = new Set([oldExample.id, newExample.id]);
assert.deepEqual([...demoIds], [oldExample.id, newExample.id], "The two teaching examples must be distinct D rows.");
const remainingSamples = INCREMENTAL_STAGE_DATA.trainingSamples.filter((sample) => !demoIds.has(sample.id));
assert.equal(remainingSamples.length, 28, "The four batches must cover the 28 rows not written by the two demonstrations.");
const batchAtStart = snapshotWriteProgress(remainingSamples.slice(0, 3), 0, { rowTravelMs: 260, rowHoldMs: 120 });
assert.equal(batchAtStart.activeSampleId, remainingSamples[0].id, "A batch must begin with its first remaining D sample.");
const batchAtSecondRow = snapshotWriteProgress(remainingSamples.slice(0, 3), 510, { rowTravelMs: 260, rowHoldMs: 120 });
assert.deepEqual(batchAtSecondRow.completedIds, [remainingSamples[0].id], "Batch completion must use IDs in its local ordered slice.");
assert.equal(batchAtSecondRow.activeSampleId, remainingSamples[1].id, "The active batch sample must advance to the second remaining ID.");
assert.deepEqual(batchAtSecondRow.activeCellProgress, [1, 0.5, 0], "Cell progress must reset to the active batch row's local clock.");
const completedBatch = snapshotWriteProgress(remainingSamples.slice(0, 3), 1140, { rowTravelMs: 260, rowHoldMs: 120 });
assert.deepEqual(completedBatch.completedIds, remainingSamples.slice(0, 3).map((sample) => sample.id), "A completed batch must contain each scheduled ID once.");
assert.equal(completedBatch.activeSampleId, null, "A completed batch must not point at an unrelated D row.");
const scheduledIds = [...demoIds, ...remainingSamples.map((sample) => sample.id)];
assert.equal(new Set(scheduledIds).size, INCREMENTAL_STAGE_DATA.trainingSamples.length, "The two demos and remaining batches must cover D exactly once by stable ID.");

/* ---------------------------------------------------------------- report --- */

console.log(
  [
    "icarl teaching data checks passed:",
    `  P3  12 unit features, ${prototypes.length} prototypes from their own exemplars, argmin -> ${CLASS_VISUALS[distances[0].classId].displayLabel}`,
    `  P4  8 candidates, order ${HERDING_DEMO_ORDER.map((point) => point.id).join(" -> ")}, round distances ${roundDistances.map((value) => value.toFixed(3)).join(", ")}`,
    `  P5  P_old 12 + X_new 18 = D 30, Q 30x3 fixed before the update`,
  ].join("\n"),
);
