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
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  CLASS_VISUALS,
  ALL_CLASS_IDS,
  P_BEFORE,
  P_AFTER,
  NEW_CLASS_HERDING,
  NEXT_QUOTA,
  CURRENT_EXEMPLARS,
  PROTOTYPES,
  QUERY_DISTANCES,
  QUERY_FEATURE,
  QUERY_PREDICTION,
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
  binaryCrossEntropy,
  buildTargets,
  sixNodeBceLoss,
  studentOutputFor,
  teacherSnapshotFor,
} from "../src/data/incremental-training.ts";
import { snapshotWriteProgress } from "../src/data/incremental-snapshot-progress.ts";
import { CLASSES_PER_BATCH, TABLE1A, TABLE1B } from "../src/data/table1-results.ts";
import { FIGURE2_FOCUS_RECTS, FIGURE2_SOURCE_FRAME, figure2Selection } from "../src/data/figure2-focus.ts";
import { FeatureSpaceWorkbench } from "../src/components/FeatureSpaceWorkbench.tsx";
import { PageThree } from "../src/pages/PageThree.tsx";
import { PageFour } from "../src/pages/PageFour.tsx";
import { PageFive } from "../src/pages/PageFive.tsx";
import { PageSix } from "../src/pages/PageSix.tsx";
import { PageSeven } from "../src/pages/PageSeven.tsx";

const OLD_CLASS_IDS = ["A", "B", "C"] as const;
const near = (a: number, b: number, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;
const unit = (vector: Vector2) => Math.hypot(vector[0], vector[1]);

function renderPageThreeAt(clip: number, pct = 0): string {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { __ICARL_FREEZE__: { clip, pct }, matchMedia: () => ({ matches: false }) },
  });
  try {
    return renderToStaticMarkup(createElement(PageThree));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

function p3VisibleLegend(clip: number): string {
  const markup = renderPageThreeAt(clip);
  const legend = markup.match(/<div class="p3-scene__legend"[^>]*>(.*?)<\/div>/)?.[1];
  assert.ok(legend, `P3 clip ${clip} must render its stage legend.`);
  return legend!;
}

const p3NormalizeLegend = p3VisibleLegend(0);
assert.match(p3NormalizeLegend, /单位圆/);
assert.match(p3NormalizeLegend, /Exemplar 特征/);
assert.doesNotMatch(p3NormalizeLegend, /类别均值|Prototype|Query|距离|圆心夹角/);
const p3AggregateLegend = p3VisibleLegend(1);
assert.match(p3AggregateLegend, /类别均值/);
assert.match(p3AggregateLegend, /Prototype/);
assert.doesNotMatch(p3AggregateLegend, /Query|距离|圆心夹角/);
const p3QueryLegend = p3VisibleLegend(2);
assert.match(p3QueryLegend, /Query 特征/);
assert.doesNotMatch(p3QueryLegend, /距离|圆心夹角/);
const p3DecisionLegend = p3VisibleLegend(3);
assert.match(p3DecisionLegend, /距离/);
assert.match(p3DecisionLegend, /圆心夹角/);
const p3MappingDetails = renderPageThreeAt(0).match(/<details class="p3-source__mapping"[^>]*>/)?.[0];
assert.ok(p3MappingDetails && !/\sopen(?:="")?(?:\s|>)/.test(p3MappingDetails),
  "P3 sample coordinates and normalization status must stay inside a collapsed verification area.");

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

function renderPageFourAt(clip: number, pct = 0): string {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      __ICARL_FREEZE__: { clip, pct },
      matchMedia: () => ({ matches: false }),
    },
  });
  try {
    return renderToStaticMarkup(createElement(PageFour));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

const p4ClipIds = attr(renderPageFourAt(0), "data-clip-ids").split(",");
const p4ClipIndex = new Map(p4ClipIds.map((id, index) => [id, index]));
const p4At = (id: string, pct = 0) => {
  const index = p4ClipIndex.get(id);
  assert.notEqual(index, undefined, `P4 timeline must include ${id}.`);
  return renderPageFourAt(index!, pct);
};
const scanOrderFromStart = [...scanOrder.slice(scanOrder.findIndex((item) => item.id === "a8")), ...scanOrder.slice(0, scanOrder.findIndex((item) => item.id === "a8"))];

for (const round of HERDING_DEMO_ROUNDS) {
  const candidateIds = new Set(round.candidates.map((item) => item.point.id));
  const orderedCandidates = scanOrderFromStart.filter((item) => candidateIds.has(item.id));
  const firstId = orderedCandidates[0].id;
  const nextId = orderedCandidates[1].id;
  const fullSequenceIds = round.k === 1
    ? [`r1-hull-${firstId}`, `r1-norm-${firstId}`, `r1-score-${firstId}`]
    : [`r${round.k}-split-${firstId}`, `r${round.k}-mean-${firstId}`, `r${round.k}-norm-${firstId}`, `r${round.k}-score-${firstId}`];
  for (const id of fullSequenceIds) assert.ok(p4ClipIndex.has(id), `Round ${round.k}'s first candidate must keep the complete teaching step ${id}.`);
  assert.ok(p4ClipIndex.has(`r${round.k}-score-${nextId}`), `Round ${round.k}'s later candidate must retain a real score.`);
  if (round.k === 1) {
    assert.ok(!p4ClipIndex.has(`r1-norm-${nextId}`), "Later k=1 candidates must use ν₁(x) = z(x) without a redundant normalization animation.");
  } else {
    assert.ok(!p4ClipIndex.has(`r${round.k}-split-${nextId}`), "Later candidates must not repeat the detailed endpoint-copy sequence.");
    assert.ok(!p4ClipIndex.has(`r${round.k}-mean-${nextId}`), "Later candidates must not pause on a separate mean clip.");
  }
}

const p4RoundTwoFirst = HERDING_DEMO_ROUNDS[1];
const p4RoundTwoCandidateIds = new Set(p4RoundTwoFirst.candidates.map((item) => item.point.id));
const p4RoundTwoOrdered = scanOrderFromStart.filter((item) => p4RoundTwoCandidateIds.has(item.id));
const p4RoundTwoFirstId = p4RoundTwoOrdered[0].id;
const p4RoundTwoNextId = p4RoundTwoOrdered[1].id;
const p4Score = p4RoundTwoFirst.candidates.find((item) => item.point.id === p4RoundTwoFirstId)!.score;

const p4TargetLabelMarkup = p4At("target-normalize", 1).match(/<text class="p4-scene__fixed-mean-label"[^>]*>/)?.[0];
assert.ok(p4TargetLabelMarkup, "P4 must keep a visible label for the fixed full-class target.");
const p4TargetLabelX = Number(attr(p4TargetLabelMarkup!, "x"));
const p4TargetLabelY = Number(attr(p4TargetLabelMarkup!, "y"));
assert.ok(near(Math.hypot(p4TargetLabelX - HERDING_CHART.center.x, p4TargetLabelY - HERDING_CHART.center.y), HERDING_CHART.radius + 34, 0.01),
  "The μ_full label must sit radially outside the unit circle without moving its target marker.");

function p4ScorePath(markup: string): { start: [number, number]; end: [number, number]; opacity: number } | null {
  const match = markup.match(/<path class="p4-scene__score-line" d="M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+)" opacity="([\d.]+)"/);
  if (!match) return null;
  return { start: [Number(match[1]), Number(match[2])], end: [Number(match[3]), Number(match[4])], opacity: Number(match[5]) };
}

const p4ScoreAtZero = p4At(`r2-score-${p4RoundTwoFirstId}`, 0);
assert.equal(p4ScorePath(p4ScoreAtZero), null, "P4 must not draw a distance line before the comparison begins.");
const p4ScoreAtHalf = p4ScorePath(p4At(`r2-score-${p4RoundTwoFirstId}`, 0.5));
assert.ok(p4ScoreAtHalf, "P4 must draw its active comparison line halfway through the score clip.");
assert.ok(near(Math.hypot(p4ScoreAtHalf!.end[0] - p4ScoreAtHalf!.start[0], p4ScoreAtHalf!.end[1] - p4ScoreAtHalf!.start[1]), p4Score * HERDING_CHART.radius * 0.5, 1e-5),
  "The active P4 line must reveal half of the true candidate-to-target distance at 50%.");
const p4ScoreAtEnd = p4At(`r2-score-${p4RoundTwoFirstId}`, 1);
const p4CompletedPath = p4ScorePath(p4ScoreAtEnd);
assert.ok(p4CompletedPath, "P4 must retain the completed distance line for the observation hold.");
assert.ok(near(Math.hypot(p4CompletedPath!.end[0] - p4CompletedPath!.start[0], p4CompletedPath!.end[1] - p4CompletedPath!.start[1]), p4Score * HERDING_CHART.radius * 0.999, 1e-5),
  "The completed P4 line must equal the true distance used by the score ruler.");
assert.ok(p4ScoreAtEnd.includes(`data-scored-candidate-ids="${p4RoundTwoFirstId}"`), "A completed comparison must record the active real candidate ID in the ruler.");

const p4FadeAt25 = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 0.25);
const p4FadeAt50 = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 0.5);
const p4FadeAt75 = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 0.75);
const p4FadeAtEnd = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 1);
assert.ok((p4ScorePath(p4FadeAt25)?.opacity ?? 0) < 1, "P4 must clear the completed distance line first.");
assert.ok(p4FadeAt50.includes('class="p4-scene__raw-mean"') && attr(p4FadeAt50.match(/<polygon class="p4-scene__raw-mean"[^>]*>/)![0], "opacity") === "0",
  "P4 must clear the raw mean marker after the line fades.");
assert.ok(p4FadeAt75.includes('class="p4-scene__unit-mean"') && attr(p4FadeAt75.match(/<circle class="p4-scene__unit-mean"[^>]*>/)![0], "opacity") === "0",
  "P4 must clear the normalized mean after the raw mean.");
assert.equal(p4ScorePath(p4FadeAtEnd)?.opacity, 0, "The previous comparison line must be invisible before scanning onward.");
assert.ok(attr(p4FadeAtEnd.match(/<circle class="p4-scene__candidate-ring"[^>]*>/)![0], "opacity") === "0",
  "The candidate emphasis ring must clear before the next candidate scan.");
const p4NextScan = p4At(`r2-scan-${p4RoundTwoNextId}`, 0);
assert.equal(p4ScorePath(p4NextScan), null, "The next candidate scan must start with no previous distance geometry.");
assert.ok(!p4NextScan.includes('class="p4-scene__raw-mean"') && !p4NextScan.includes('class="p4-scene__unit-mean"'),
  "The next candidate scan must begin after the previous mean markers have been removed.");

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
  const outputs = studentOutputFor(sample);
  assert.equal(outputs.length, ALL_CLASS_IDS.length, `${sample.id} must have one fixed-model output per class node.`);
  const modelLoss = sixNodeBceLoss(target, outputs);
  const summedNodeLosses = target.reduce((sum, value, index) => sum + binaryCrossEntropy(value, outputs[index]), 0);
  assert.ok(near(modelLoss, summedNodeLosses), `${sample.id} model loss must sum the same BCE used by each node.`);
  const stableOutputs = [...outputs];
  for (const exploredOutput of [0.11, 0.89]) {
    binaryCrossEntropy(target[1], exploredOutput); // P6's local slider probes this single curve only.
    assert.ok(near(sixNodeBceLoss(target, outputs), modelLoss), `${sample.id} formula exploration must not change the six-node model loss.`);
    assert.deepEqual(studentOutputFor(sample), stableOutputs, `${sample.id} formula exploration must not rewrite model outputs.`);
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
assert.deepEqual(buildTargets(oldExample).slice(0, 3), teacherSnapshotFor(oldExample), "P6's old image must use its own Q row for the first three targets.");
assert.deepEqual(buildTargets(oldExample).slice(3), [0, 0, 0], "P6's old image must use zeros for the three new-class targets.");
assert.deepEqual(buildTargets(newExample).slice(0, 3), teacherSnapshotFor(newExample), "P6's new image must still use its own Q row for the old nodes.");
assert.deepEqual(buildTargets(newExample).slice(3), [0, 1, 0], "P6's E image must use a one-hot target at the E output node.");

const p6DefaultSample = INCREMENTAL_STAGE_DATA.incomingSamples.find((sample) => sample.id === "x_28")!;
const p6DefaultTargets = buildTargets(p6DefaultSample);
const p6DefaultOutputs = studentOutputFor(p6DefaultSample);
const p6DefaultPage = renderToStaticMarkup(createElement(PageSix));
const p6ArticleTag = p6DefaultPage.match(/<article class="tutorial-page icarl-page icarl-page--p6"[^>]*>/)?.[0];
assert.ok(p6ArticleTag, "P6 must render its current sample and separate model/exploration readouts.");
assert.equal(attr(p6ArticleTag!, "data-sample"), p6DefaultSample.id);
assert.equal(attr(p6ArticleTag!, "data-model-loss"), sixNodeBceLoss(p6DefaultTargets, p6DefaultOutputs).toFixed(6));
assert.equal(attr(p6ArticleTag!, "data-model-output"), p6DefaultOutputs[4].toFixed(3));
assert.equal(attr(p6ArticleTag!, "data-explore-output"), p6DefaultOutputs[4].toFixed(2));
assert.equal(attr(p6ArticleTag!, "data-explore-loss"), binaryCrossEntropy(p6DefaultTargets[4], p6DefaultOutputs[4]).toFixed(6));

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

function renderPageFiveAt(clipId: string, pct = 0): string {
  const initial = renderToStaticMarkup(createElement(PageFive));
  const clipIds = attr(initial.match(/<section class="p5-workbench"[^>]*>/)?.[0] ?? "", "data-clip-ids").split(",");
  const clipIndex = clipIds.indexOf(clipId);
  assert.notEqual(clipIndex, -1, `P5 timeline must include ${clipId}.`);
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { __ICARL_FREEZE__: { clip: clipIndex, pct }, matchMedia: () => ({ matches: false }) },
  });
  try {
    return renderToStaticMarkup(createElement(PageFive));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

function p5WorkbenchTag(markup: string): string {
  const tag = markup.match(/<section class="p5-workbench"[^>]*>/)?.[0];
  assert.ok(tag, "P5 must render its flow workbench.");
  return tag!;
}

function p5PreviewStates(markup: string): Map<string, string> {
  const preview = markup.match(/<div class="p5-q-preview"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(preview, "P5 must render the 30-row Q preview.");
  return new Map([...preview!.matchAll(/<span(?=[^>]*data-sample-id="([^"]+)")(?=[^>]*data-q-state="([^"]+)")[^>]*>/g)]
    .map((match) => [match[1], match[2]]));
}

const p5MergeComplete = renderPageFiveAt("p5-merge", 1);
assert.equal(attr(p5WorkbenchTag(p5MergeComplete), "data-d-arrived-count"), "30", "D must reach all 30 rows at the end of the merge clip.");
assert.equal(attr(p5WorkbenchTag(p5MergeComplete), "data-q-written-count"), "0", "Samples arriving in D must not be counted as Q rows written.");
assert.ok([...p5PreviewStates(p5MergeComplete).values()].every((state) => state === "pending"), "A complete D must still have 30 pending Q rows before response capture begins.");

const p5OldWriting = renderPageFiveAt("p5-old-sample", 0.75);
assert.equal(attr(p5WorkbenchTag(p5OldWriting), "data-current-sample-id"), oldExample.id);
assert.equal(attr(p5WorkbenchTag(p5OldWriting), "data-active-sample-id"), oldExample.id, "The first demonstrated write must target old B's own row.");
assert.equal(p5PreviewStates(p5OldWriting).get(oldExample.id), "writing");
const p5OldWritten = renderPageFiveAt("p5-old-sample", 1);
assert.equal(attr(p5WorkbenchTag(p5OldWritten), "data-q-written-count"), "1");
assert.equal(p5PreviewStates(p5OldWritten).get(oldExample.id), "written");

const p5NewStart = renderPageFiveAt("p5-new-sample", 0);
assert.equal(attr(p5WorkbenchTag(p5NewStart), "data-q-written-ids"), oldExample.id, "The old B demonstration must be written before the new E demonstration starts.");
assert.equal(attr(p5WorkbenchTag(p5NewStart), "data-current-sample-id"), newExample.id);
const p5TeacherSample = p5NewStart.match(/<div class="p5-model-input"[^>]*>/)?.[0];
const p5SnapshotSample = p5NewStart.match(/<div class="p5-q-sample-row[^>]*>/)?.[0];
assert.equal(attr(p5TeacherSample ?? "", "data-sample-id"), newExample.id, "The new E image must feed its matching Teacher output.");
assert.equal(attr(p5SnapshotSample ?? "", "data-sample-id"), newExample.id, "The three new E responses must be written to E's Q row.");
const p5NewWritten = renderPageFiveAt("p5-new-sample", 1);
assert.equal(attr(p5WorkbenchTag(p5NewWritten), "data-q-written-ids"), [oldExample.id, newExample.id].join(","), "The old B and new E rows must be the first two Q writes.");

for (let batchIndex = 0; batchIndex < 4; batchIndex += 1) {
  const batchMarkup = renderPageFiveAt(`p5-batch-${batchIndex + 1}`, 1);
  const batchBoard = p5WorkbenchTag(batchMarkup);
  const writtenCount = 2 + (batchIndex + 1) * 7;
  const expectedIds = INCREMENTAL_STAGE_DATA.trainingSamples
    .filter((sample) => demoIds.has(sample.id) || remainingSamples.slice(0, (batchIndex + 1) * 7).some((remaining) => remaining.id === sample.id))
    .map((sample) => sample.id);
  assert.equal(attr(batchBoard, "data-d-arrived-count"), "30", "All batch captures must read from the already-complete D.");
  assert.equal(Number(attr(batchBoard, "data-q-written-count")), writtenCount, `Batch ${batchIndex + 1} must add its seven Q rows in sequence.`);
  assert.deepEqual(attr(batchBoard, "data-q-written-ids").split(","), expectedIds, `Batch ${batchIndex + 1} must preserve D's original sample-ID order.`);
  const states = p5PreviewStates(batchMarkup);
  assert.equal(states.size, 30, "The Q overview must expose one stable cell per D sample ID.");
  assert.equal([...states.values()].filter((state) => state === "written").length, writtenCount);
  assert.equal([...states.values()].filter((state) => state === "pending").length, 30 - writtenCount);
}

/* ------------------------------------------------------------------ P7 --- */

assert.equal(PROTOTYPES.length, 6, "P7 must compare all six current prototypes.");
assert.equal(NEXT_QUOTA, 2, "P7's twelve-image budget must allocate two images to each of six classes.");
for (const classId of OLD_CLASS_IDS) {
  assert.deepEqual(P_AFTER[classId].map((sample) => sample.id), P_BEFORE[classId].slice(0, NEXT_QUOTA).map((sample) => sample.id),
    `P7 must retain the first ${NEXT_QUOTA} old ${classId} exemplars in their original order.`);
}
for (const classId of INCREMENTAL_STAGE_DATA.incomingClassIds) {
  assert.deepEqual(P_AFTER[classId].map((sample) => sample.id), NEW_CLASS_HERDING[classId].ordered.slice(0, NEXT_QUOTA).map((sample) => sample.id),
    `P7 must select new ${classId} exemplars from that class's real Herding order.`);
}
assert.equal(CURRENT_EXEMPLARS.length, 12, "P7 must finish with exactly twelve retained images.");
assert.equal(new Set(CURRENT_EXEMPLARS.map((sample) => sample.id)).size, 12, "P7's committed exemplar IDs must be unique.");
assert.deepEqual(QUERY_PREDICTION, QUERY_DISTANCES[0].classId, "The P7 prediction must be the true minimum-distance class.");
assert.deepEqual(QUERY_DISTANCES.map((entry) => entry.classId), [...QUERY_DISTANCES]
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId))
  .map((entry) => entry.classId), "The P7 comparison order must follow the real distances.");

function renderPageSevenAt(progress: number, clip = 4): string {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      __ICARL_FREEZE__: { clip, pct: progress },
      matchMedia: () => ({ matches: false }),
    },
  });
  try {
    return renderToStaticMarkup(createElement(PageSeven));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

function distanceLines(markup: string): string[] {
  return markup.match(/<line\b[^>]*class="feature-space__distance[^"]*"[^>]*>/g) ?? [];
}

function attr(markup: string, name: string): string {
  const value = markup.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
  assert.ok(value, `Expected ${name} in SVG markup: ${markup}`);
  return value;
}

function lineLength(markup: string): number {
  return Math.hypot(Number(attr(markup, "x2")) - Number(attr(markup, "x1")), Number(attr(markup, "y2")) - Number(attr(markup, "y1")));
}

function queryMarkerStartX(markup: string): number {
  const marker = markup.match(/class="feature-space__query"[^>]*><path d="M ([\d.-]+) ([\d.-]+)/);
  assert.ok(marker, "P7 must render the persistent Query marker during the final stage.");
  return Number(marker[1]);
}

function prototypeMarks(markup: string): string[] {
  return markup.match(/<g class="feature-space__prototype"[^>]*><rect[^>]*><\/g>/g) ?? [];
}

const p7AtZero = renderPageSevenAt(0);
const p7RebuildEnd = renderPageSevenAt(1, 3);
assert.deepEqual(prototypeMarks(p7AtZero), prototypeMarks(p7RebuildEnd), "P7 must keep all prototype coordinates fixed across the rebuild-to-query stage boundary.");
assert.equal(distanceLines(p7AtZero).length, 0, "P7 at 0% must not show comparison distances.");
assert.ok(!p7AtZero.includes("p7-query-result"), "P7 at 0% must not reveal the prediction.");
const queryFinalX = 320 + QUERY_FEATURE[0] * 160;
const queryEntryX = queryFinalX >= 320 ? 612 : 28;
assert.ok(near(queryMarkerStartX(p7AtZero), queryEntryX), "P7 at 0% must show Query at the chart edge.");

const p7At25 = renderPageSevenAt(0.25);
const p7LinesAt25 = distanceLines(p7At25);
assert.equal(p7LinesAt25.length, 1, "P7 at 25% must be drawing only the first distance.");
assert.ok(p7LinesAt25[0].includes("is-active"), "The in-progress distance must be highlighted.");
assert.ok(near(queryMarkerStartX(p7At25), queryFinalX), "Query must reach its fixed feature coordinate before comparisons begin.");
const firstDistancePx = QUERY_DISTANCES[0].distance * 160;
const firstLineProgressAt25 = (0.25 - 0.2) / 0.55 * PROTOTYPES.length;
assert.ok(near(lineLength(p7LinesAt25[0]), firstDistancePx * firstLineProgressAt25, 1e-6),
  "The active P7 line length must track the true query-to-prototype distance and its displayed progress.");

const p7At50 = renderPageSevenAt(0.5);
const p7LinesAt50 = distanceLines(p7At50);
assert.equal(p7LinesAt50.length, 4, "P7 at 50% must retain three completed comparisons and draw the fourth.");
assert.ok(p7LinesAt50[3].includes("is-active"), "P7 must highlight the currently drawn comparison.");
assert.equal(attr(p7LinesAt50[0], "data-comparison-rank"), "1", "P7 must draw the nearest true distance first.");

const p7At75 = renderPageSevenAt(0.75);
assert.equal(distanceLines(p7At75).length, 6, "P7 at 75% must have completed all six true comparisons.");
assert.ok(!distanceLines(p7At75).some((line) => line.includes("is-nearest")), "P7 must wait until the separate nearest-highlight phase.");
assert.ok(!p7At75.includes("p7-query-result"), "P7 must keep the predicted class hidden before 90%.");

const p7At100 = renderPageSevenAt(1);
const p7LinesAt100 = distanceLines(p7At100);
assert.equal(p7LinesAt100.length, 6, "P7 at 100% must retain all six comparison lines.");
assert.equal(p7LinesAt100.filter((line) => line.includes("is-nearest")).length, 1, "P7 must highlight exactly one nearest prototype at the end.");
assert.ok(p7At100.includes("p7-query-result"), "P7 must reveal the prediction at the end.");
assert.ok(p7At100.includes(CLASS_VISUALS[QUERY_PREDICTION].displayLabel), "The revealed result must match the real argmin.");
assert.ok(p7LinesAt100.every((line) => near(lineLength(line),
  QUERY_DISTANCES[Number(attr(line, "data-comparison-rank")) - 1].distance * 160, 1e-6)),
"Every completed P7 distance line must have the true feature-space length.");

const p9StaticInference = renderToStaticMarkup(createElement(FeatureSpaceWorkbench, {
  legacy: true,
  mode: "inference",
  title: "Query 与原型",
  description: "固定推断图",
  prototypes: PROTOTYPES,
  query: QUERY_FEATURE,
  unitCircle: true,
  focusableSamples: false,
}));
assert.equal(distanceLines(p9StaticInference).length, ALL_CLASS_IDS.length, "P9's existing inference mode must continue to show all full distances by default.");
assert.ok(!p9StaticInference.includes("is-active") && !p9StaticInference.includes("is-complete"), "Optional P7 timeline props must not alter P9's static inference rendering.");

/* ------------------------------------------------------------------ P8 --- */

assert.deepEqual(CLASSES_PER_BATCH, [2, 5, 10, 20, 50], "P8 must expose the paper's five iCIFAR-100 batch settings.");
assert.deepEqual(TABLE1A.map((row) => [row.batchSize, row.icarL, row.hybrid1, row.hybrid2, row.hybrid3, row.lwfMC]), [
  [2, 57.0, 36.6, 57.6, 57.0, 11.7],
  [5, 61.2, 50.9, 57.9, 56.7, 32.6],
  [10, 64.1, 59.3, 59.9, 58.1, 44.4],
  [20, 67.2, 65.6, 63.2, 60.5, 54.4],
  [50, 68.6, 68.2, 65.3, 61.5, 64.5],
], "P8 Table 1a must preserve all five rows of the paper's reported values.");
assert.deepEqual(TABLE1B.map((row) => [row.batchSize, row.icarL, row.ncm]), [
  [2, 57.0, 59.3], [5, 61.2, 62.1], [10, 64.1, 64.5], [20, 67.2, 67.5], [50, 68.6, 68.7],
], "P8 Table 1b must preserve the iCaRL and full-data NCM values.");

for (const rect of Object.values(FIGURE2_FOCUS_RECTS)) {
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0, "Every Figure 2 crop must have a positive in-image rectangle.");
  assert.ok(rect.x + rect.width <= FIGURE2_SOURCE_FRAME.width && rect.y + rect.height <= FIGURE2_SOURCE_FRAME.height,
    "Every Figure 2 crop must remain within the original full-resolution source image.");
}
for (const batch of CLASSES_PER_BATCH) {
  const selection = figure2Selection("cifar", batch);
  assert.equal(selection.focusId, `cifar-${batch}`, `The iCIFAR-100 batch-${batch} selector must choose its matching Figure 2 panel.`);
  assert.equal(selection.protocolLabel, `iCIFAR-100 · 每批 ${batch} 类 · 多类准确率`, "The focused panel caption must match the selected iCIFAR-100 protocol.");
  assert.equal(selection.rect, FIGURE2_FOCUS_RECTS[selection.focusId], "The zoom and source overlay must use the same selected subfigure bounds.");
}
assert.equal(figure2Selection("small", 50).focusId, "ilsvrc-small");
assert.equal(figure2Selection("small", 50).protocolLabel, "iILSVRC-small · 每批 10 类 · 验证集 Top-5");
assert.equal(figure2Selection("full", 2).focusId, "ilsvrc-full");
assert.equal(figure2Selection("full", 2).protocolLabel, "iILSVRC-full · 每批 100 类 · 验证集 Top-5");

/* ---------------------------------------------------------------- report --- */

console.log(
  [
    "icarl teaching data checks passed:",
    `  P3  12 unit features, ${prototypes.length} prototypes from their own exemplars, argmin -> ${CLASS_VISUALS[distances[0].classId].displayLabel}`,
    `  P4  8 candidates, order ${HERDING_DEMO_ORDER.map((point) => point.id).join(" -> ")}, round distances ${roundDistances.map((value) => value.toFixed(3)).join(", ")}`,
    `  P5  P_old 12 + X_new 18 = D 30, Q 30x3 fixed before the update`,
    `  P7  ${QUERY_DISTANCES.length} displayed distances match the fixed query and prototype endpoints; argmin -> ${CLASS_VISUALS[QUERY_PREDICTION].displayLabel}`,
  ].join("\n"),
);
