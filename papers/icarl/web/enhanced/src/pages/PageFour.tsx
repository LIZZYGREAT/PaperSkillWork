import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChartLabels, FEATURE_FRAME, featureStar, type ChartLabel } from "../components/FeatureChart";
import {
  HERDING_DEMO_ORDER,
  HERDING_DEMO_POINTS,
  HERDING_DEMO_QUOTA,
  HERDING_DEMO_ROUNDS,
  HERDING_DEMO_TARGET,
  HERDING_DEMO_TARGET_RAW,
} from "../data/herding-teaching-demo";
import type { Vector2 } from "../data/icarl-runtime";
import {
  activeNarrationIndex,
  useAnimationTimeline,
  type AnimationClip,
} from "../shared/animation/useAnimationTimeline";
import {
  angleDeg,
  arcSegmentPath,
  clamp,
  pointAtAngle,
  progressWithin,
  smoothstep,
  type Point,
} from "../shared/animation/easing";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

/* ------------------------------------------------------------- geometry --- */

const VIEW = { width: 620, height: 620 };
const CENTER: Point = { x: 310, y: 310 };
/**
 * The demo features are unit vectors, so one scale serves the circle and every derived mean.
 * The target is mirrored onto the vertical axis for display only: showing it at its literal angle
 * would push the chord fan and its label out of the safe frame. The circle is a teaching construct
 * here, not an experimental measurement, and every length that carries a distance stays exact.
 */
const RADIUS = 232;
const SCAN_START_ANGLE = 90;

function toChartPoint(vector: Vector2): Point {
  return { x: CENTER.x + vector[0] * RADIUS, y: CENTER.y - vector[1] * RADIUS };
}
const TARGET_POINT = pointAtAngle(CENTER, RADIUS, 90);
const TARGET_RAW_POINT = { x: CENTER.x, y: CENTER.y + Math.hypot(HERDING_DEMO_TARGET_RAW[0], HERDING_DEMO_TARGET_RAW[1]) * RADIUS };

function diamond(point: Point, radius = 7) {
  return `${point.x},${point.y - radius} ${point.x + radius},${point.y} ${point.x},${point.y + radius} ${point.x - radius},${point.y}`;
}

/** Scan order: clockwise from the top, crossing the 0/360 boundary without jumping back. */
const SCAN_ORDER = [...HERDING_DEMO_POINTS]
  .map((point) => ({ point, offset: ((SCAN_START_ANGLE - angleDeg(CENTER, toChartPoint(point.feature))) % 360 + 360) % 360 }))
  .sort((a, b) => a.offset - b.offset);
const SCAN_OFFSET_BY_ID = new Map(SCAN_ORDER.map((item) => [item.point.id, item.offset]));
const TOTAL_SWEEP = SCAN_ORDER[SCAN_ORDER.length - 1].offset;
/**
 * Travel time for one candidate step. The last clip of every candidate spends its tail on this, so
 * the ring keeps moving clockwise onto the next candidate while the current distance is still being
 * drawn: the sweep is one continuous scan rather than a stop-start series.
 */
const SWEEP_STEP_MS = Math.round((TOTAL_SWEEP / Math.max(1, SCAN_ORDER.length - 1)) * 4.2);

/* ----------------------------------------------------------------- clips --- */

type ClipKind = "target-contribute" | "target-normalize" | "scan" | "hull" | "hover" | "split" | "gather" | "mean" | "score" | "norm" | "commit" | "review" | "budget";

type DemoClip = AnimationClip & {
  kind: ClipKind;
  round: number;
  candidateIndex: number;
  /** Cumulative clockwise sweep (in candidate steps) at the start of this clip. */
  sweepStart: number;
  /** Sweep when the clip ends; differs from `sweepStart` when the ring travels during the clip. */
  sweepEnd: number;
  /** Millisecond length of the movement part; the renderer derives sub-windows from it. */
  move: number;
};

const ROUNDS = HERDING_DEMO_ROUNDS;
const stepDurations: Record<string, number> = { hull: 700, hover: 500, split: 560, gather: 1100, mean: 620, score: 820, norm: 760, commit: 900 };

function buildClips(): DemoClip[] {
  const clips: DemoClip[] = [];
  const push = (clip: Omit<DemoClip, "id"> & { id: string }) => clips.push(clip);

  push({ id: "target-contribute", kind: "target-contribute", round: 0, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 1500, durationMs: 1500, holdMs: 650, narrative: "八个样本共同决定完整类别的原始均值" });
  push({ id: "target-normalize", kind: "target-normalize", round: 0, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 1300, durationMs: 1300, holdMs: 900, narrative: "原始均值单位化为比较目标 μ_full" });

  for (const round of ROUNDS) {
    const selectedBefore = new Set(round.prefix.slice(0, round.k - 1).map((point) => point.id));
    // The first candidate of every round is demonstrated at full length; later candidates reuse the
    // same computation at a shorter pace so the reader still sees the geometry but not the wait.
    const laterCandidateScale = round.k === 2 ? 0.42 : round.k === 3 ? 0.3 : 1;
    const detailed = round.k === 2 || round.k === 3;

    /**
     * One maintained clockwise array, exactly as the reader would write it down: start at a8, walk
     * clockwise past every candidate, and delete an entry the moment it gets selected. The walk order
     * therefore comes from the circle, never from the scores.
     */
    const waypoints: { id: string; sweep: number; scored: boolean; candidateIndex: number }[] =
      SCAN_ORDER.map((entry) => ({
        id: entry.point.id,
        sweep: entry.offset / TOTAL_SWEEP,
        scored: !selectedBefore.has(entry.point.id),
        candidateIndex: round.candidates.findIndex((candidate) => candidate.point.id === entry.point.id),
      }));
    const scored = waypoints.filter((entry) => entry.scored);
    /** Milliseconds for a leg that covers `span` of the circle, proportional to the real arc. */
    const legDuration = (span: number) => Math.max(240, Math.round(SWEEP_STEP_MS * Math.max(span, 0.12)));

    let sweep = 0;
    for (const [order, candidate] of scored.entries()) {
      const sweepAt = candidate.sweep;
      const nextWaypoint = waypoints[waypoints.findIndex((entry) => entry.id === candidate.id) + 1];
      const isFirst = order === 0;
      const isLast = order === scored.length - 1;
      const scale = isFirst ? 1 : laterCandidateScale;
      const legStart = isFirst ? 0 : sweep;
      const travel = nextWaypoint ? legDuration(nextWaypoint.sweep - sweepAt) : 0;
      const candidateIndex = candidate.candidateIndex;

      if (detailed || isFirst) {
        push({
          id: `r${round.k}-scan-${candidate.id}`,
          kind: "scan",
          round: round.k,
          candidateIndex,
          sweepStart: legStart,
          sweepEnd: sweepAt,
          move: legDuration(sweepAt - legStart),
          durationMs: legDuration(sweepAt - legStart),
          holdMs: isFirst ? 150 : 60,
          narrative: isFirst
            ? `扫描环从圆周顶部出发，按顺时针顺序逐个检查候选`
            : `扫描环沿圆周继续顺时针到达候选 ${candidate.id}`,
        });
      }

      /** The clip that ends this candidate's inspection also carries the ring onto the next entry. */
      const nextSweep = nextWaypoint ? nextWaypoint.sweep : 1;
      const rest = { round: round.k, candidateIndex, sweepStart: sweepAt };

      if (round.k === 1) {
        // k = 1 has no prefix to average: the candidate's own unit feature is the prefix mean.
        push({ id: `r1-hull-${candidate.id}`, kind: "hover", ...rest, sweepEnd: sweepAt, move: Math.round(stepDurations.hover * scale), durationMs: Math.round(stepDurations.hover * scale), holdMs: 100, narrative: `只有一个名额：直接比较候选 ${candidate.id} 自己的单位特征到 μ_full 的距离` });
        push({ id: `r1-norm-${candidate.id}`, kind: "norm", ...rest, sweepEnd: sweepAt, move: Math.round(stepDurations.norm * scale), durationMs: Math.round(stepDurations.norm * scale), holdMs: 120, narrative: "ν₁(x) = z(x)：单个样本的前缀均值就是它自己的单位特征" });
        push({ id: `r1-score-${candidate.id}`, kind: "score", ...rest, sweepEnd: nextSweep, move: Math.round(stepDurations.score * scale) + travel, durationMs: Math.round(stepDurations.score * scale) + travel, holdMs: 140, narrative: `画出 ${candidate.id} 到 μ_full 的距离线；距离刚画完，扫描环已经顺时针走向下一个候选` });
        sweep = nextSweep;
        continue;
      }

      if (!detailed) {
        push({ id: `r${round.k}-hull-${candidate.id}`, kind: "hull", ...rest, sweepEnd: sweepAt, move: 420, durationMs: 420, holdMs: 70, narrative: `固定前 ${round.k - 1} 项，用线段连出本次参与平均的 ${round.k} 个特征点` });
        push({ id: `r${round.k}-gather-${candidate.id}`, kind: "gather", ...rest, sweepEnd: sweepAt, move: 700, durationMs: 700, holdMs: 100, narrative: `${round.k} 个真实端点各复制一个贡献点，聚合成前缀原始均值` });
        push({ id: `r${round.k}-norm-${candidate.id}`, kind: "norm", ...rest, sweepEnd: sweepAt, move: 500, durationMs: 500, holdMs: 100, narrative: "单位化后与 μ_full 比较距离" });
        push({ id: `r${round.k}-score-${candidate.id}`, kind: "score", ...rest, sweepEnd: nextSweep, move: 460 + travel, durationMs: 460 + travel, holdMs: 120, narrative: `${candidate.id} 的距离进入同尺度距离尺，扫描环继续前进` });
        sweep = nextSweep;
        continue;
      }

      push({ id: `r${round.k}-hull-${candidate.id}`, kind: "hull", ...rest, sweepEnd: sweepAt, move: Math.round(stepDurations.hull * scale), durationMs: Math.round(stepDurations.hull * scale), holdMs: 100, narrative: `先固定已有前缀，用线段连接 ${round.k} 个参与平均的特征点` });
      push({ id: `r${round.k}-split-${candidate.id}`, kind: "split", ...rest, sweepEnd: sweepAt, move: Math.round(stepDurations.split * scale), durationMs: Math.round(stepDurations.split * scale), holdMs: 80, narrative: `每个端点复制一个贡献点；原始候选与前缀点保持原位` });
      push({ id: `r${round.k}-gather-${candidate.id}`, kind: "gather", ...rest, sweepEnd: sweepAt, move: Math.round(stepDurations.gather * scale), durationMs: Math.round(stepDurations.gather * scale), holdMs: 200, narrative: round.k === 2 ? "两个贡献点沿连线移动到真实中点" : "三个贡献点同时移动到真实算术重心" });
      push({ id: `r${round.k}-mean-${candidate.id}`, kind: "mean", ...rest, sweepEnd: sweepAt, move: Math.round(stepDurations.mean * scale), durationMs: Math.round(stepDurations.mean * scale), holdMs: 170, narrative: round.k === 2 ? "中点就是两张图片前缀的原始均值 ν̄₂(x)" : "重心就是三张图片前缀的原始均值 ν̄₃(x)" });
      push({ id: `r${round.k}-norm-${candidate.id}`, kind: "norm", ...rest, sweepEnd: sweepAt, move: Math.round(stepDurations.norm * scale), durationMs: Math.round(stepDurations.norm * scale), holdMs: 150, narrative: "沿径向把原始前缀均值单位化，得到用于比较的 νk(x)" });
      push({ id: `r${round.k}-score-${candidate.id}`, kind: "score", ...rest, sweepEnd: nextSweep, move: Math.round(stepDurations.score * scale) + travel, durationMs: Math.round(stepDurations.score * scale) + travel, holdMs: 160, narrative: `从 νk(x) 到 μ_full 画出距离线；距离画完的同时，扫描环顺时针走向下一个候选` });
      sweep = nextSweep;
    }

    // Committing the winner: the ring finishes its sweep back to the top of the circle.
    push({
      id: `r${round.k}-commit`,
      kind: "commit",
      round: round.k,
      candidateIndex: round.candidates.findIndex((candidate) => candidate.point.id === round.chosen.id),
      sweepStart: sweep,
      sweepEnd: 1,
      move: stepDurations.commit,
      durationMs: stepDurations.commit,
      holdMs: 700,
      narrative: `全部候选比较完毕：${round.chosen.id} 的前缀均值离 μ_full 最近，成为 p${round.k}`,
    });
  }

  push({ id: "review-prefix", kind: "review", round: 5, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 900, durationMs: 900, holdMs: 2000, narrative: "同一张图上回看不同长度的有序前缀均值" });
  push({ id: "budget-shrink", kind: "budget", round: 6, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 1200, durationMs: 1200, holdMs: 1600, narrative: "总预算不变、类别变多时，只保留有序列表的前缀" });
  return clips;
}

const clips = buildClips();
const clipIndexById = new Map(clips.map((clip, index) => [clip.id, index]));

const phaseTitles: Record<ClipKind, string> = {
  "target-contribute": "先确定要逼近的完整类别目标",
  "target-normalize": "把完整类别原始均值单位化为 μ_full",
  scan: "顺时针逐个检查尚未选择的候选",
  hull: "固定已有前缀并连出参与者",
  hover: "候选与已有前缀一起参与这次平均",
  split: "从每个真实端点复制贡献点",
  gather: "贡献点沿连线聚合成原始前缀均值",
  mean: "原始前缀均值停留在计算位置",
  score: "用单位化前缀均值比较到目标的距离",
  norm: "把原始前缀均值单位化",
  commit: "本轮比较结束，胜出项进入记忆槽",
  review: "回看同一选择顺序的不同长度",
  budget: "总容量不变时，只保留有序前缀",
};

/* ------------------------------------------------------------------ scene --- */

type Scene = {
  clip: DemoClip;
  progress: number;
  targetContribute: number;
  targetNormalize: number;
  scanSweep: number | null;
  scannedIds: Set<string>;
  barProgress: (candidateId: string) => number;
  hullReveal: number;
  contributions: { at: Point; opacity: number }[];
  rawMeanPoint: Point | null;
  normalizedPoint: Point | null;
  scoreReveal: number;
  decisionReveal: number;
  reviewIndex: number | null;
  slotCount: number;
  tailRemoved: boolean;
};

function roundOf(k: number) {
  return ROUNDS[k - 1];
}

function candidateOf(clip: DemoClip) {
  const round = clip.round >= 1 && clip.round <= 4 ? roundOf(clip.round) : null;
  return round ? round.candidates[clip.candidateIndex] ?? null : null;
}

function sceneAt(clip: DemoClip, progress: number, reviewIndex: number): Scene {
  const p = clamp(progress);
  const candidate = candidateOf(clip);
  const round = clip.round >= 1 && clip.round <= 4 ? roundOf(clip.round) : null;
  const prefixPoints = round ? round.prefix.slice(0, round.k - 1) : [];
  const participantPoints = round && candidate ? [...prefixPoints, candidate.point] : [];

  // One continuous clockwise sweep. A scan clip draws the movement from `sweepStart` to `sweepEnd`;
  // every other clip of a candidate starts where its scan ended and may carry the ring further, which
  // is what keeps the ring advancing onto the next candidate while the distance is being drawn.
  let scanSweep: number | null = null;
  if (clip.kind === "scan") {
    scanSweep = (clip.sweepStart + (clip.sweepEnd - clip.sweepStart) * p) * TOTAL_SWEEP;
  } else if (clip.kind !== "target-contribute" && clip.kind !== "target-normalize" && clip.kind !== "review" && clip.kind !== "budget") {
    scanSweep = (clip.sweepStart + (clip.sweepEnd - clip.sweepStart) * p) * TOTAL_SWEEP;
  }

  const scannedIds = new Set<string>();
  if (scanSweep !== null) {
    for (const item of SCAN_ORDER) if (item.offset < scanSweep - 0.4) scannedIds.add(item.point.id);
  }

  const contributions: { at: Point; opacity: number }[] = [];
  let rawMeanPoint: Point | null = null;
  let normalizedPoint: Point | null = null;
  let hullReveal = 0;
  let scoreReveal = 0;
  let decisionReveal = 0;

  if (candidate && round) {
    const sourcePoints = participantPoints.map((point) => toChartPoint(point.feature));
    // For k = 1 the "prefix mean" of one sample is that sample's own unit feature, measured from
    // the origin: ν₁(x) = normalize(z(x) / 1). Its length is not a distance to the target.
    const rawMean = round.k === 1 ? CENTER : toChartPoint(candidate.rawPrefixMean);
    const normalized = toChartPoint(candidate.normalizedPrefixMean);
    const full = clip.kind === "scan" || clip.kind === "hull";
    const gathered = clamp(progressWithin(p, 0.08, 0.86));

    if (clip.kind === "hull") hullReveal = smoothstep(p);
    if (clip.kind === "split") hullReveal = 1;
    if (clip.kind === "hover") hullReveal = 1;
    if (["split", "hover", "gather", "mean", "norm", "score", "commit"].includes(clip.kind) && round.k > 1) {
      const gather = clip.kind === "split" ? 0 : clip.kind === "hover" ? 0 : clip.kind === "gather" ? gathered : 1;
      sourcePoints.forEach((source, index) => {
        const at = { x: source.x + (rawMean.x - source.x) * gather, y: source.y + (rawMean.y - source.y) * gather };
        const fade = clip.kind === "split" ? 1 : clip.kind === "hover" ? 1 : clip.kind === "gather" ? 1 - clamp(progressWithin(p, 0.78, 0.98)) : 0;
        if (fade > 0.01) contributions.push({ at, opacity: fade });
        void index;
      });
    }
    const meanVisible = round.k === 1
      ? ["norm", "score", "commit"].includes(clip.kind)
      : ["gather", "mean", "norm", "score", "commit"].includes(clip.kind) && (clip.kind !== "gather" || gathered > 0.9);
    const meanOpacity = meanVisible ? (clip.kind === "gather" ? clamp(progressWithin(p, 0.86, 0.98)) : 1) : 0;
    if (meanOpacity > 0.01) rawMeanPoint = rawMean;

    const normalizeProgress = clip.kind === "norm" ? smoothstep(p)
      : ["score", "commit"].includes(clip.kind) ? 1
      : 0;
    if (clip.kind === "score" || clip.kind === "commit") normalizedPoint = normalized;
    else if (clip.kind === "norm") {
      normalizedPoint = { x: rawMean.x + (normalized.x - rawMean.x) * normalizeProgress, y: rawMean.y + (normalized.y - rawMean.y) * normalizeProgress };
    }

    if (clip.kind === "score") {
      // The clip spends its head drawing the distance and its tail carrying the ring onward.
      const travel = clip.durationMs - clip.move;
      const detailShare = clip.move <= 0 ? 1 : (clip.move - travel) / clip.move;
      scoreReveal = clamp(p / Math.max(0.15, detailShare));
    } else if (clip.kind === "commit") scoreReveal = 1;
    if (clip.kind === "commit") decisionReveal = smoothstep(progressWithin(p, 0.35, 0.85));
  }

  if (clip.kind === "target-contribute") {
    // Full-class mean offered by all eight real points.
    rawMeanPoint = TARGET_RAW_POINT;
  }
  if (clip.kind === "target-normalize") {
    rawMeanPoint = TARGET_RAW_POINT;
    const move = smoothstep(p);
    normalizedPoint = { x: TARGET_RAW_POINT.x + (TARGET_POINT.x - TARGET_RAW_POINT.x) * move, y: TARGET_RAW_POINT.y + (TARGET_POINT.y - TARGET_RAW_POINT.y) * move };
  }

  const barProgress = (candidateId: string) => {
    if (!round) return 0;
    const offset = SCAN_OFFSET_BY_ID.get(candidateId) ?? Number.POSITIVE_INFINITY;
    if (scanSweep === null || offset > scanSweep - 0.4) return 0;
    return clamp((scanSweep - offset) / 1.4);
  };

  let slotCount = 0;
  if (clip.kind === "commit") slotCount = clip.round - 1 + clamp(progressWithin(p, 0.25, 0.9));
  else if (clip.round >= 2 && clip.round <= 5) slotCount = clip.round - 1;
  else if (clip.kind === "review" || clip.kind === "budget") slotCount = reviewIndex;
  if (clip.kind === "scan" || clip.kind === "target-contribute" || clip.kind === "target-normalize") slotCount = 0;

  return {
    clip,
    progress: p,
    targetContribute: clip.kind === "target-contribute" ? smoothstep(progressWithin(p, 0.05, 0.82)) : clip.kind === "target-normalize" ? 1 : 0,
    targetNormalize: clip.kind === "target-normalize" ? smoothstep(p) : ["target-contribute"].includes(clip.kind) ? 0 : 1,
    scanSweep,
    scannedIds,
    barProgress,
    hullReveal,
    contributions,
    rawMeanPoint,
    normalizedPoint,
    scoreReveal,
    decisionReveal,
    reviewIndex: clip.kind === "review" || clip.kind === "budget" ? reviewIndex : null,
    slotCount,
    tailRemoved: clip.kind === "budget" && progress > 0.55,
  };
}

/* --------------------------------------------------------------- vectors --- */

function HerdingScene({ scene }: { scene: Scene }) {
  const candidate = candidateOf(scene.clip);
  const round = scene.clip.round >= 1 && scene.clip.round <= 4 ? roundOf(scene.clip.round) : null;
  const prefixPoints = round ? round.prefix.slice(0, round.k - 1) : [];
  const selectedOrdered = scene.clip.kind === "review" || scene.clip.kind === "budget"
    ? HERDING_DEMO_ORDER.slice(0, scene.reviewIndex ?? 0)
    : round ? round.prefix.slice(0, scene.clip.kind === "commit" ? scene.clip.round : scene.clip.round - 1) : [];
  const selectedIds = new Set(selectedOrdered.map((point) => point.id));
  const scanRadians = scene.scanSweep === null ? null : ((SCAN_START_ANGLE - scene.scanSweep) * Math.PI) / 180;
  const scanPoint = scanRadians === null ? null : { x: CENTER.x + Math.cos(scanRadians) * RADIUS, y: CENTER.y + Math.sin(scanRadians) * RADIUS };
  const sweptFrom = scene.scanSweep === null ? null : ((SCAN_START_ANGLE - Math.max(scene.scanSweep, 0.001)) * Math.PI) / 180;

  const labels: ChartLabel[] = [];
  const obstacles: Point[] = [];
  if (scene.targetContribute < 0.02) labels.push({ ...TARGET_RAW_POINT, id: "target-raw", text: "μ̄_full" });
  if (scene.targetNormalize > 0.5) labels.push({ ...TARGET_POINT, id: "target", text: "μ_full" });
  for (const point of HERDING_DEMO_POINTS) {
    const at = toChartPoint(point.feature);
    obstacles.push(at);
    if (selectedIds.has(point.id) || point.id === candidate?.point.id) labels.push({ ...at, id: point.id, text: point.id });
  }
  if (scene.rawMeanPoint) {
    obstacles.push(scene.rawMeanPoint);
    labels.push({ ...scene.rawMeanPoint, id: "raw-mean", text: round && round.k >= 2 ? `ν̄${round.k}(x)` : "μ̄_full" });
  }
  if (scene.normalizedPoint) {
    obstacles.push(scene.normalizedPoint);
    labels.push({ ...scene.normalizedPoint, id: "unit-mean", text: round ? `ν${round.k}(x)` : "μ_full" });
  }

  return (
    <svg
      className="p4-scene"
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`固定的八样本 Herding 特征空间。${phaseTitles[scene.clip.kind]}${candidate ? `；当前候选 ${candidate.point.id}` : ""}`}
    >
      <title>同一特征空间中的 Herding 计算与有序前缀</title>
      <desc>坐标轴、八个单位候选特征与完整类别目标贯穿所有片段；扫描环沿圆周顺时针移动，前缀均值由真实端点的贡献点聚合得到，距离线与右侧距离尺使用同一尺度。</desc>
      {/* Circle first, axes on top: the circle's fill must not hide the parts of the axes inside it. */}
      <circle className="p4-scene__circle" cx={CENTER.x} cy={CENTER.y} r={RADIUS} />
      <line className="p4-scene__axis" x1="16" y1={CENTER.y} x2={VIEW.width - 16} y2={CENTER.y} />
      <line className="p4-scene__axis" x1={CENTER.x} y1="16" x2={CENTER.x} y2={VIEW.height - 16} />

      {/* Complete-class target: contribution copies then the radial normalization. */}
      {scene.clip.kind === "target-contribute"
        ? HERDING_DEMO_POINTS.map((point) => {
            const source = toChartPoint(point.feature);
            const at = { x: source.x + (TARGET_RAW_POINT.x - source.x) * scene.targetContribute, y: source.y + (TARGET_RAW_POINT.y - source.y) * scene.targetContribute };
            return <circle key={`tc-${point.id}`} className="p4-scene__contribution" cx={at.x} cy={at.y} r="6" />;
          })
        : null}
      {scene.clip.kind === "target-contribute"
        ? HERDING_DEMO_POINTS.map((point) => {
            const at = toChartPoint(point.feature);
            return <line key={`tcl-${point.id}`} className="p4-scene__gather-line" x1={at.x} y1={at.y} x2={TARGET_RAW_POINT.x} y2={TARGET_RAW_POINT.y} opacity={clamp(scene.targetContribute * 1.4)} />;
          })
        : null}
      {scene.clip.kind === "target-normalize" && scene.rawMeanPoint && scene.normalizedPoint ? (
        <path className="p4-scene__normalize-path" d={`M ${scene.rawMeanPoint.x} ${scene.rawMeanPoint.y} L ${scene.normalizedPoint.x} ${scene.normalizedPoint.y}`} />
      ) : null}

      {/* Scan ring: a continuous clockwise indicator that never teleports between candidates. */}
      {scene.scanSweep !== null && sweptFrom !== null ? (
        <path className="p4-scene__scan-track" d={arcSegmentPath(CENTER, RADIUS, SCAN_START_ANGLE, -scene.scanSweep)} />
      ) : null}
      {scanPoint ? (
        <g className="p4-scene__scan-mark">
          <circle cx={scanPoint.x} cy={scanPoint.y} r="11" />
        </g>
      ) : null}

      {/* Prefix hull: connects exactly the points that take part in this comparison. */}
      {scene.hullReveal > 0.01 && candidate && round
        ? (() => {
            const vertices = [...round.prefix.slice(0, round.k - 1), candidate.point].map((point) => toChartPoint(point.feature));
            const edges: { from: Point; to: Point; key: string }[] = [];
            for (let index = 1; index < vertices.length; index += 1) {
              edges.push({ from: vertices[index - 1], to: vertices[index], key: `${candidate.point.id}-${index}` });
            }
            // Close the triangle/quadrilateral so the shape is readable as one group of points.
            if (vertices.length > 2) edges.push({ from: vertices[vertices.length - 1], to: vertices[0], key: `${candidate.point.id}-close` });
            const edgeCount = Math.max(edges.length, 1);
            return edges.map((edge, index) => {
              const local = clamp(scene.hullReveal * edgeCount - index);
              const grown = { x: edge.from.x + (edge.to.x - edge.from.x) * local, y: edge.from.y + (edge.to.y - edge.from.y) * local };
              if (local <= 0.01) return null;
              return <line key={`hull-${edge.key}`} className="p4-scene__hull-line" x1={edge.from.x} y1={edge.from.y} x2={grown.x} y2={grown.y} />;
            });
          })()
        : null}

      {/* Candidate and prefix rays to the current raw mean. */}
      {candidate && scene.rawMeanPoint && scene.clip.kind !== "scan"
        ? [...prefixPoints, candidate.point].map((point) => {
            const from = toChartPoint(point.feature);
            return <line key={`ray-${candidate.point.id}-${point.id}`} className="p4-scene__prefix-ray" x1={from.x} y1={from.y} x2={scene.rawMeanPoint!.x} y2={scene.rawMeanPoint!.y} opacity={0.55} />;
          })
        : null}

      {/* Distance from the normalized prefix mean to the target, same scale as the ruler. */}
      {scene.normalizedPoint && scene.scoreReveal > 0.01 ? (
        <path
          className="p4-scene__score-line"
          d={`M ${scene.normalizedPoint.x} ${scene.normalizedPoint.y} L ${scene.normalizedPoint.x + (TARGET_POINT.x - scene.normalizedPoint.x) * scene.scoreReveal} ${scene.normalizedPoint.y + (TARGET_POINT.y - scene.normalizedPoint.y) * scene.scoreReveal}`}
        />
      ) : null}

      {/* Eight stable candidate features. */}
      {HERDING_DEMO_POINTS.map((point) => {
        const at = toChartPoint(point.feature);
        const isSelected = selectedIds.has(point.id);
        const isCandidate = point.id === candidate?.point.id;
        const isScanned = scene.scannedIds.has(point.id);
        const classes = ["p4-scene__point", isSelected ? "is-selected" : "", isCandidate ? "is-candidate" : "", isScanned ? "is-scanned" : ""].filter(Boolean).join(" ");
        return (
          <g key={point.id} className={classes}>
            <title>{`${point.id}${isSelected ? ` · 有序样本 p${selectedOrdered.findIndex((item) => item.id === point.id) + 1}` : " · 未选候选"}`}</title>
            {isSelected ? <circle className="p4-scene__selected-ring" cx={at.x} cy={at.y} r="12" /> : null}
            {isCandidate ? <circle className="p4-scene__candidate-ring" cx={at.x} cy={at.y} r="16" /> : null}
            <circle className="p4-scene__dot" cx={at.x} cy={at.y} r={isCandidate ? 7 : isSelected ? 6.4 : 5.2} />
          </g>
        );
      })}

      {/* Contribution copies travel from the real endpoints; the endpoints themselves stay put. */}
      {scene.contributions.map((item, index) => (
        <circle key={`contribution-${index}`} className="p4-scene__contribution" cx={item.at.x} cy={item.at.y} r="6" opacity={item.opacity} />
      ))}

      {/* Means: raw diamond inside the circle, normalized marker on it. */}
      {scene.rawMeanPoint ? <polygon className="p4-scene__raw-mean" points={diamond(scene.rawMeanPoint)} /> : null}
      {scene.normalizedPoint ? <circle className="p4-scene__unit-mean" cx={scene.normalizedPoint.x} cy={scene.normalizedPoint.y} r="8.5" /> : null}

      {/* Ordered prefix nodes while reviewing. */}
      {scene.reviewIndex !== null
        ? ROUNDS.slice(0, 4).map((item) => {
            const offset = SCAN_OFFSET_BY_ID.get(roundOf(item.k).chosen.id) ?? 0;
            const angle = SCAN_START_ANGLE - offset;
            const point = pointAtAngle(CENTER, RADIUS, angle);
            const active = item.k === scene.reviewIndex;
            return (
              <g key={`prefix-${item.k}`} className={`p4-scene__prefix-node${active ? " is-active" : ""}`}>
                <circle cx={point.x} cy={point.y} r={active ? 9 : 5} />
                <title>{`ν${item.k} 位于 ${roundOf(item.k).chosen.id} 的方向上`}</title>
                <line x1={CENTER.x} y1={CENTER.y} x2={point.x} y2={point.y} opacity={active ? 0.6 : 0.2} />
                <text
                  className="p4-scene__prefix-label"
                  x={CENTER.x + Math.cos((angle * Math.PI) / 180) * (RADIUS + 21)}
                  y={CENTER.y + Math.sin((angle * Math.PI) / 180) * (RADIUS + 21) + 5}
                  textAnchor={Math.abs(Math.cos((angle * Math.PI) / 180)) < 0.3 ? "middle" : Math.cos((angle * Math.PI) / 180) > 0 ? "start" : "end"}
                >
                  ν{item.k}
                </text>
              </g>
            );
          })
        : null}

      {/* Fixed display target. */}
      <polygon className="p4-scene__raw-target" points={diamond(TARGET_RAW_POINT)} opacity={scene.clip.kind === "target-contribute" ? clamp(scene.targetContribute * 1.5) : scene.clip.kind === "target-normalize" ? 1 - scene.targetNormalize * 0.7 : 0.9} />
      <path className="p4-scene__target" d={featureStar(TARGET_POINT.x, TARGET_POINT.y)} opacity={scene.targetNormalize} />
      <circle className="p4-scene__origin" cx={CENTER.x} cy={CENTER.y} r="3.4" />
      <ChartLabels labels={labels} obstacles={obstacles} width={VIEW.width} height={VIEW.height} fontSize={18} />
      <text className="p4-scene__note" x="14" y="20">
        固定合成示例 · 八个单位特征 ‖z‖₂ = 1 · 距离尺与图中线段同尺度
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------- right rail --- */

function DistanceRuler({ scene }: { scene: Scene }) {
  const round = scene.clip.round >= 1 && scene.clip.round <= 4 ? roundOf(scene.clip.round) : null;
  if (!round) return null;
  const maximum = Math.max(...round.candidates.map((item) => item.score), 0.0001);
  return (
    <div className="p4-ruler" aria-label="本轮候选到完整类别目标的同尺度距离比较">
      <div className="p4-ruler__head"><b>同尺度距离尺</b><span>最大值 {maximum.toFixed(3)}</span></div>
      <div className="p4-ruler__rows">
        {round.candidates.map((item) => {
          const revealed = scene.barProgress(item.point.id);
          const chosen = item.point.id === round.chosen.id && scene.clip.kind === "commit";
          return (
            <span key={item.point.id} className={chosen ? "is-chosen" : ""}>
              <code>{item.point.id}</code>
              <i style={{ width: `${(item.score / maximum) * revealed * 100}%` }} />
              <small>{revealed > 0.98 ? item.score.toFixed(3) : "…"}</small>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Slots({ count, tailRemoved }: { count: number; tailRemoved: boolean }) {
  return (
    <div className="p4-slots" aria-label={`当前保留 ${Math.round(count)} 个有序 exemplar`}>
      {Array.from({ length: HERDING_DEMO_QUOTA }, (_, index) => {
        const filled = index < count;
        const arriving = filled && index >= Math.floor(count);
        return (
          <span key={index} className={[filled ? "is-filled" : "", arriving ? "is-arriving" : "", index === 3 && tailRemoved ? "is-removed" : ""].filter(Boolean).join(" ")}>
            <b>p<sub>{index + 1}</sub></b>
            <small>{filled ? HERDING_DEMO_ORDER[index].id : "待选择"}</small>
          </span>
        );
      })}
    </div>
  );
}

function CurrentFormula({ scene }: { scene: Scene }) {
  const round = scene.clip.round >= 1 && scene.clip.round <= 4 ? roundOf(scene.clip.round) : null;
  const candidate = candidateOf(scene.clip);
  if (scene.clip.kind === "target-contribute") {
    return <span>μ̄<sub>full</sub> = (1/|X<sub>y</sub>|) Σ<sub>x∈X<sub>y</sub></sub> z(x)</span>;
  }
  if (scene.clip.kind === "target-normalize") {
    return <span>μ<sub>full</sub> = normalize(μ̄<sub>full</sub>)</span>;
  }
  if (!round) {
    return <span>ν<sub>k</sub> = normalize((1/k) Σ<sub>i=1…k</sub> z(p<sub>i</sub>))</span>;
  }
  const k = round.k;
  if (!candidate) {
    return <span>p<sub>{k}</sub> = arg min<sub>x∉P</sub> ‖μ<sub>full</sub> − ν<sub>{k}</sub>(x)‖₂</span>;
  }
  const x = candidate.point.id;
  if (scene.clip.kind === "commit") {
    return (
      <div className="p4-formula-stack">
        <span>p<sub>{k}</sub> = {round.chosen.id}</span>
        <span>arg min<sub>x∉P</sub> d<sub>{k}</sub>(x) = {round.chosen.id}</span>
      </div>
    );
  }
  return (
    <div className="p4-formula-stack">
      <span>ν̄<sub>{k}</sub>({x}) = (1/{k}) [ {round.prefix.slice(0, k - 1).map((point) => `z(${point.id})`).join(" + ")} + z({x}) ]</span>
      <span>ν<sub>{k}</sub>({x}) = normalize(ν̄<sub>{k}</sub>({x}))</span>
      <span>d<sub>{k}</sub>({x}) = ‖μ<sub>full</sub> − ν<sub>{k}</sub>({x})‖₂ = {candidate.score.toFixed(3)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------- page --- */

export function PageFour({ onContinue }: { onContinue?: () => void } = {}) {
  const reducedMotion = useReducedMotion();
  const { state, controls } = useAnimationTimeline({ clips, reducedMotion, autoPlay: false });
  const [reviewIndex, setReviewIndex] = useState(4);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const clip = clips[state.clipIndex];
  const scene = useMemo(() => sceneAt(clip, state.progress, reviewIndex), [clip, state.progress, reviewIndex]);
  const round = clip.round >= 1 && clip.round <= 4 ? roundOf(clip.round) : null;
  const candidate = candidateOf(clip);
  const narration = useMemo(() => [clip.narrative], [clip.narrative]);
  void activeNarrationIndex(narration, state.progress);

  // Entering the review phase defaults to the full ordered list.
  useEffect(() => {
    if (clip.kind === "review") setReviewIndex((current) => (current < 1 ? 4 : current));
  }, [clip.kind]);

  const slotCount = Math.round(scene.slotCount);

  function focusWorkbench() {
    workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <article className="tutorial-page icarl-page icarl-page--p4">
      <header className="page-heading icarl-page__heading p4-intro">
        <div className="icarl-page__eyebrow"><span>PAGE 04</span><i /> EXEMPLAR SELECTION &amp; MANAGEMENT</div>
        <h1>怎样找到少量代表，<br className="p4-title-break" />并让它们共同代表整个类别？</h1>
        <p>已选 Exemplars 可以支持预测；现在回到一个新类别的完整训练数据仍可用的时候，看看怎样用少量样本逼近这个类别的整体特征，并在以后预算收紧时保留有用的顺序。</p>
        <button type="button" className="icarl-button icarl-button--primary p4-start-button" onClick={focusWorkbench}>开始演示 <b aria-hidden="true">↓</b></button>
      </header>

      <section
        className="p4-workbench"
        aria-label="Herding 同屏教学工作台"
        data-phase={clip.id}
        data-clip={clip.id}
        data-kind={clip.kind}
        data-round={clip.round}
        data-progress={state.progress.toFixed(3)}
        data-status={state.status}
        data-clip-ids={clips.map((item) => item.id).join(",")}
        ref={workbenchRef}
      >
        <header className="p4-workbench__heading">
          <div>
            <span className="eyebrow">
              {clip.kind === "target-contribute" || clip.kind === "target-normalize"
                ? "BUILD THE CLASS TARGET"
                : clip.round <= 4
                  ? `HERDING · ROUND ${clip.round}`
                  : "REVIEW THE ORDERED MEMORY"}
              {" · 片段 "}{state.clipIndex + 1} / {clips.length}
            </span>
            <h2>{phaseTitles[clip.kind]}</h2>
            <p aria-live="polite">{clip.narrative}</p>
          </div>
          <span className="p4-workbench__phase">
            {state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}
          </span>
        </header>

        <div className="p4-workbench__layout">
          <section className="panel p4-visual-panel">
            <div className="p4-panel-title">
              <div><span className="eyebrow">ONE FIXED FEATURE SPACE</span><h3>目标、候选与当前前缀</h3></div>
              <span>扫描顺序：从顶部顺时针</span>
            </div>
            <div className="p4-canvas">
              <HerdingScene scene={scene} />
            </div>
            <div className="p4-legend" aria-label="图形标记说明">
              <span><i className="p4-legend-point" />单位特征</span>
              <span><i className="p4-legend-target">★</i>完整类别目标 μ<sub>full</sub></span>
              <span><i className="p4-legend-contribution" />贡献副本</span>
              <span><i className="p4-legend-mean" />当前前缀均值</span>
              <span><i className="p4-legend-score" />到目标的比较距离</span>
              <span><i className="p4-legend-scan" />顺时针扫描环</span>
            </div>
          </section>

          <aside className="panel p4-guidance-panel" aria-live="polite">
            <div className="p4-panel-title">
              <div>
                <span className="eyebrow">CURRENT CALCULATION</span>
                <h3>{clip.round <= 4 ? `第 ${clip.round || 0} 轮 · ${clip.kind === "commit" ? "已选结果" : clip.kind === "scan" ? "扫描候选" : "计算前缀均值"}` : clip.kind === "review" ? "有序前缀" : "固定总预算 K"}</h3>
              </div>
              {round ? <span className="p4-k-badge">k = {round.k}</span> : null}
            </div>
            <div className="p4-current-formula" aria-label="当前公式">{CurrentFormula({ scene })}</div>
            <DistanceRuler scene={scene} />
            <div className="p4-memory-heading"><b>有序 Exemplars</b><span>{slotCount} / {HERDING_DEMO_QUOTA}</span></div>
            <Slots count={scene.slotCount} tailRemoved={scene.tailRemoved} />
            {clip.kind === "review" ? (
              <div className="p4-prefix-picker" role="group" aria-label="切换要回看的 Herding 前缀长度">
                {ROUNDS.map((item) => (
                  <button key={item.k} type="button" aria-pressed={reviewIndex === item.k} onClick={() => {
                    setReviewIndex(item.k);
                    controls.goToClip(clipIndexById.get("review-prefix") ?? 0, { autoPlay: false });
                  }}>
                    前 {item.k} 项
                  </button>
                ))}
              </div>
            ) : null}
            {clip.kind === "budget" ? (
              <div className="p4-budget-change">
                <span>总容量 K = 12</span>
                <b>3 类 × 4 项 <i>→</i> 4 类 × 3 项</b>
                <small>{scene.tailRemoved ? "只移除列表尾部的 p₄；p₁、p₂、p₃ 保持不变。" : "类别从三个变成四个，每类名额由四个缩到三个。"}</small>
              </div>
            ) : null}
            {clip.kind === "commit" ? (
              <p className="p4-commit-note">
                胜出项来自全部未选候选的实际分数：{round?.chosen.id} 的 ν<sub>{clip.round}</sub> 离 μ<sub>full</sub> 最近。
                贪心选择不保证逐轮距离变小，也不保证固定长度下的全局最优。
              </p>
            ) : null}
          </aside>
        </div>

        <div className="p4-workbench__controls" aria-label="Page 4 动画控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.stepBack} disabled={!state.hasPrevious}>← 上一步</button>
          <div className="p4-workbench__control-center">
            <button
              type="button"
              className="icarl-button icarl-button--quiet"
              onClick={state.status === "finished" ? (state.hasNext ? controls.stepForward : controls.replayClip) : controls.toggle}
            >
              {state.status === "playing" ? "Ⅱ 暂停" : state.status === "finished" ? (state.hasNext ? "▶ 下一片段" : "↺ 重新播放") : "▶ 继续"}
            </button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.replayClip}>↺ 重播本片段</button>
            <span aria-live="polite">{state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}</span>
          </div>
          <button type="button" className="icarl-button icarl-button--primary" onClick={controls.stepForward} disabled={!state.hasNext}>下一步 →</button>
        </div>

        <div className="p4-phase-rail" role="group" aria-label="片段定位">
          {[
            { id: "target-contribute", label: "建立目标" },
            { id: "r1-scan-a2", label: "第 1 轮" },
            { id: "r2-scan-a2", label: "第 2 轮" },
            { id: "r3-scan-a7", label: "第 3 轮" },
            { id: "r4-scan-a5", label: "第 4 轮" },
            { id: "review-prefix", label: "回看前缀" },
            { id: "budget-shrink", label: "预算截断" },
          ].map((entry) => {
            const target = clipIndexById.get(entry.id) ?? 0;
            const currentGroup = entry.id.startsWith("r") ? Number(entry.id[1]) : entry.id === "target-contribute" ? 0 : entry.id === "review-prefix" ? 5 : 6;
            const activeGroup = clip.round;
            return (
              <button
                key={entry.id}
                type="button"
                className={currentGroup === activeGroup ? "is-current" : currentGroup < activeGroup ? "is-complete" : ""}
                aria-pressed={currentGroup === activeGroup}
                onClick={() => controls.goToClip(target)}
              >
                <b>{String(currentGroup + 1).padStart(2, "0")}</b>{entry.label}
              </button>
            );
          })}
        </div>
      </section>

      <details className="p4-calculation-details">
        <summary>查看精确坐标、距离与候选排序</summary>
        <p>
          完整类别原始均值：({HERDING_DEMO_TARGET_RAW[0].toFixed(3)}, {HERDING_DEMO_TARGET_RAW[1].toFixed(3)})；
          单位目标 μ<sub>full</sub>：({HERDING_DEMO_TARGET[0].toFixed(3)}, {HERDING_DEMO_TARGET[1].toFixed(3)})。
          图中 μ<sub>full</sub> 画在正下方：示例候选集中在左上，按真实角度显示会让弦与标签越出安全边界；圆的构造位置不影响任何距离数值。
        </p>
        {ROUNDS.map((item) => (
          <details key={item.k}>
            <summary>第 {item.k} 轮 · p{item.k} = {item.chosen.id} · {item.candidates.length} 个未选候选</summary>
            <div className="p4-score-table" role="table" aria-label={`第 ${item.k} 轮候选坐标与得分`}>
              <div className="p4-score-table__head" role="row"><span>候选</span><span>原始前缀均值</span><span>单位化前缀均值</span><span>距离</span></div>
              {item.candidates.map((entry) => (
                <div role="row" key={entry.point.id} className={entry.point.id === item.chosen.id ? "is-chosen" : ""}>
                  <span>{entry.point.id}{entry.point.id === item.chosen.id ? " · 选中" : ""}</span>
                  <span>({entry.rawPrefixMean[0].toFixed(3)}, {entry.rawPrefixMean[1].toFixed(3)})</span>
                  <span>({entry.normalizedPrefixMean[0].toFixed(3)}, {entry.normalizedPrefixMean[1].toFixed(3)})</span>
                  <span>{entry.score.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </details>

      <details className="p4-pseudocode">
        <summary>查看简短算法步骤</summary>
        <div>
          <code>目标：μ<sub>full</sub> ← normalize(mean({`{ normalize(φ(x)) | x ∈ X_y }`}))</code>
          <code>对 k = 1…m，固定已有前缀 P<sub>k−1</sub></code>
          <code>对每个未选 x，计算 ν<sub>k</sub>(x) = normalize(mean(z(P<sub>k−1</sub>) ∪ z(x)))</code>
          <code>追加距离 μ<sub>full</sub> 最小的候选；每轮只追加一个样本</code>
        </div>
      </details>

      <footer className="icarl-handoff p4-handoff">
        <div>
          <span className="eyebrow">NEXT · PAGE 05</span>
          <p>现在，我们已经知道怎样从完整类别数据中选出少量代表图片，也知道了如何在预算变紧时保留已有列表的前缀。它们已经承担了一项任务：通过类别原型支持之后的预测。可新的类别还会继续到来，特征提取器也需要不断更新。那么，这些保存下来的 Exemplars，能不能在训练时继续发挥作用？</p>
        </div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>进入第 5 页 · 让 Exemplars 参与更新 <b aria-hidden="true">→</b></button> : null}
      </footer>
    </article>
  );
}
