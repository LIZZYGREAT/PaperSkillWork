import {
  INCOMING_SAMPLES,
  NEXT_QUOTA,
  OLD_MEMORY_SIZE,
  P_BEFORE,
  P_AFTER,
  REDUCED_MEMORY_SIZE,
  TRAINING_SET_SIZE,
} from "../data/icarl-runtime";
import { INCREMENTAL_STAGE_DATA } from "../data/incremental-training";
import type { AnimationClip } from "../shared/animation/useAnimationTimeline";

export const RUNTIME_CHAPTERS = [
  { id: "inherited", title: "继承状态", question: "现在已有的是什么？" },
  { id: "prepare-d", title: "准备 D", question: "为什么旧图也要参加训练？" },
  { id: "snapshot-q", title: "冻结 Q", question: "参数改变前要保存什么？" },
  { id: "train-update", title: "更新模型", question: "软目标和硬标签如何共同更新共享表示？" },
  { id: "manage-memory", title: "管理记忆", question: "固定 K 时如何接纳新类别？" },
  { id: "rebuild-prototypes", title: "重建原型", question: "为什么用当前表示重算类别均值？" },
  { id: "predict", title: "最近原型", question: "哪个规则真正决定类别？" },
  { id: "handoff", title: "交接下一轮", question: "本轮结束后留下什么？" },
] as const;

export type RuntimeChapterId = (typeof RUNTIME_CHAPTERS)[number]["id"];
export type RuntimeFocus = "model" | "data" | "snapshot" | "memory" | "feature" | "prediction" | "state";
export type RuntimeClipId =
  | "inherit-state"
  | "receive-new-batch"
  | "merge-training-set"
  | "snapshot-old-row"
  | "snapshot-new-row"
  | "fill-q-rows"
  | "build-targets-and-loss"
  | "update-theta"
  | "truncate-old-prefix"
  | "herd-class-d"
  | "herd-classes-e-f"
  | "commit-p-after"
  | "reencode-p-after"
  | "form-prototypes"
  | "query-arrives"
  | "compare-six-distances"
  | "handoff-next";

export type RuntimeObjectId = "X_new" | "D" | "Q" | "targets" | "loss" | "prototypes" | "query" | "prediction";
export type RuntimeObjectStatus = "pending" | "active" | "released";

export type RuntimeClip = AnimationClip & {
  id: RuntimeClipId;
  chapterId: RuntimeChapterId;
  focus: RuntimeFocus;
  operation: string;
};

export const RUNTIME_CLIPS: readonly RuntimeClip[] = [
  { id: "inherit-state", chapterId: "inherited", focus: "state", operation: "hold", durationMs: 700, holdMs: 900, narrative: "上一轮只留下模型 Θ_before 与 12 张有序原始图片。" },
  { id: "receive-new-batch", chapterId: "prepare-d", focus: "data", operation: "arrive", durationMs: 1400, holdMs: 300, narrative: "新类别 D、E、F 的 18 张完整图片作为 X_new 到达。" },
  { id: "merge-training-set", chapterId: "prepare-d", focus: "data", operation: "merge", durationMs: 2400, holdMs: 700, narrative: "从 P_before 复制 12 张旧 exemplar，与 18 张新图合成 D。" },
  { id: "snapshot-old-row", chapterId: "snapshot-q", focus: "snapshot", operation: "teacher-row", durationMs: 1700, holdMs: 350, narrative: "同一张旧类训练图经过未更新的三个旧节点，写入它自己的 Q 行。" },
  { id: "snapshot-new-row", chapterId: "snapshot-q", focus: "snapshot", operation: "teacher-row", durationMs: 1700, holdMs: 350, narrative: "新类图像也经过相同的旧教师网络，并写入匹配 ID 的 Q 行。" },
  { id: "fill-q-rows", chapterId: "snapshot-q", focus: "snapshot", operation: "batch-rows", durationMs: 1900, holdMs: 650, narrative: "其余样本沿 D 的次序批量补入；每一行仍与 sample ID 对齐。" },
  { id: "build-targets-and-loss", chapterId: "train-update", focus: "model", operation: "targets", durationMs: 1500, holdMs: 350, narrative: "同一图像接收三个 Q 软目标与三个真实新类硬标签，再汇成六节点 BCE。" },
  { id: "update-theta", chapterId: "train-update", focus: "model", operation: "update", durationMs: 1800, holdMs: 700, narrative: "符号化展示共享表示与训练 head 更新；结束时才提交 Θ_after。" },
  { id: "truncate-old-prefix", chapterId: "manage-memory", focus: "memory", operation: "truncate", durationMs: 1700, holdMs: 350, narrative: "旧类各保留有序列表前两项，尾部两项逐步释放。" },
  { id: "herd-class-d", chapterId: "manage-memory", focus: "memory", operation: "herd-d", durationMs: 2300, holdMs: 300, narrative: "用 Class 4 的真实运行时 Herding 顺序演示 p₁、p₂ 如何入选。" },
  { id: "herd-classes-e-f", chapterId: "manage-memory", focus: "memory", operation: "herd-e-f", durationMs: 1700, holdMs: 500, narrative: "Class 5、6 各自沿用同一选择机制，并只从本类六张图中补入两项。" },
  { id: "commit-p-after", chapterId: "manage-memory", focus: "memory", operation: "commit", durationMs: 1200, holdMs: 650, narrative: "旧类六项与新类六项合并，一次提交为 P_after=12。" },
  { id: "reencode-p-after", chapterId: "rebuild-prototypes", focus: "feature", operation: "reencode", durationMs: 1600, holdMs: 350, narrative: "同一 exemplar ID 由当前 φ_after 重新编码；固定端点只是表示状态对照。" },
  { id: "form-prototypes", chapterId: "rebuild-prototypes", focus: "feature", operation: "prototypes", durationMs: 1500, holdMs: 550, narrative: "六类各从自己的 P_after 图像计算归一化均值。" },
  { id: "query-arrives", chapterId: "predict", focus: "prediction", operation: "query", durationMs: 1200, holdMs: 300, narrative: "Query 保持同一身份进入当前特征空间。" },
  { id: "compare-six-distances", chapterId: "predict", focus: "prediction", operation: "compare", durationMs: 1900, holdMs: 500, narrative: "六条真实 Query–Prototype 距离逐条绘出并保留。" },
  { id: "handoff-next", chapterId: "handoff", focus: "state", operation: "handoff", durationMs: 1300, holdMs: 1400, narrative: "Θ_after + P_after 留作下一轮状态；临时对象退出，X_next 只作为入口提示。" },
];

export const RUNTIME_CLIP_INDEX = Object.fromEntries(RUNTIME_CLIPS.map((clip, index) => [clip.id, index])) as Record<RuntimeClipId, number>;
export const RUNTIME_CHAPTER_FIRST_CLIP: Readonly<Record<RuntimeChapterId, number>> = Object.fromEntries(
  RUNTIME_CHAPTERS.map((chapter) => [chapter.id, RUNTIME_CLIPS.findIndex((clip) => clip.chapterId === chapter.id)]),
) as Record<RuntimeChapterId, number>;

const firstOldExemplar = INCREMENTAL_STAGE_DATA.oldExemplars.find((sample) => sample.classId === "A")!;
const firstIncomingSample = INCOMING_SAMPLES.find((sample) => sample.classId === "D")!;
const demoIds = new Set([firstOldExemplar.id, firstIncomingSample.id]);
const remainingQSamples = INCREMENTAL_STAGE_DATA.trainingSamples.filter((sample) => !demoIds.has(sample.id));

const lifetimes: Readonly<Record<RuntimeObjectId, { createdAt: number; releasedAt: number }>> = {
  X_new: { createdAt: RUNTIME_CLIP_INDEX["receive-new-batch"], releasedAt: RUNTIME_CLIP_INDEX["commit-p-after"] + 1 },
  D: { createdAt: RUNTIME_CLIP_INDEX["merge-training-set"], releasedAt: RUNTIME_CLIP_INDEX["update-theta"] + 1 },
  Q: { createdAt: RUNTIME_CLIP_INDEX["snapshot-old-row"], releasedAt: RUNTIME_CLIP_INDEX["update-theta"] + 1 },
  targets: { createdAt: RUNTIME_CLIP_INDEX["build-targets-and-loss"], releasedAt: RUNTIME_CLIP_INDEX["update-theta"] + 1 },
  loss: { createdAt: RUNTIME_CLIP_INDEX["build-targets-and-loss"], releasedAt: RUNTIME_CLIP_INDEX["update-theta"] + 1 },
  prototypes: { createdAt: RUNTIME_CLIP_INDEX["form-prototypes"], releasedAt: RUNTIME_CLIP_INDEX["handoff-next"] },
  query: { createdAt: RUNTIME_CLIP_INDEX["query-arrives"], releasedAt: RUNTIME_CLIP_INDEX["handoff-next"] },
  prediction: { createdAt: RUNTIME_CLIP_INDEX["compare-six-distances"] + 1, releasedAt: RUNTIME_CLIP_INDEX["handoff-next"] },
};

export type RuntimeScene = {
  clip: RuntimeClip;
  clipIndex: number;
  chapterIndex: number;
  chapterId: RuntimeChapterId;
  progress: number;
  focus: RuntimeFocus;
  operation: string;
  theta: "before" | "training" | "after";
  memory: "before" | "truncating" | "building" | "after";
  objectStatus: Readonly<Record<RuntimeObjectId, RuntimeObjectStatus>>;
  oldCopiesInD: number;
  incomingSamplesInD: number;
  dSampleCount: number | null;
  qRowsWritten: number;
  activeQSampleId: string | null;
  activeQCellProgress: readonly number[];
  oldMemoryRetained: number;
  newExemplarsSelected: number;
  committedMemoryCount: number;
  queryProgress: number;
  comparisonProgress: number;
  nearestHighlightProgress: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const rounded = (value: number) => Math.round(value);

/** Derives presentation state from one timeline clip and its single 0–1 clock. */
export function runtimeSceneAt(clipIndex: number, progress: number): RuntimeScene {
  const boundedIndex = Math.max(0, Math.min(RUNTIME_CLIPS.length - 1, Math.floor(clipIndex)));
  const clip = RUNTIME_CLIPS[boundedIndex];
  const boundedProgress = clamp01(progress);
  const cursor = boundedIndex + (boundedProgress >= 1 ? 1 : 0);
  const chapterIndex = RUNTIME_CHAPTERS.findIndex((chapter) => chapter.id === clip.chapterId);
  const objectStatus = Object.fromEntries(Object.entries(lifetimes).map(([id, lifetime]) => [
    id,
    cursor < lifetime.createdAt ? "pending" : cursor >= lifetime.releasedAt ? "released" : "active",
  ])) as Record<RuntimeObjectId, RuntimeObjectStatus>;

  let oldCopiesInD = 0;
  let incomingSamplesInD = 0;
  let dSampleCount: number | null = objectStatus.D === "pending" ? null : TRAINING_SET_SIZE;
  if (clip.id === "merge-training-set") {
    oldCopiesInD = rounded(OLD_MEMORY_SIZE * boundedProgress);
    incomingSamplesInD = rounded(INCOMING_SAMPLES.length * boundedProgress);
    dSampleCount = oldCopiesInD + incomingSamplesInD;
  } else if (objectStatus.D !== "pending") {
    oldCopiesInD = OLD_MEMORY_SIZE;
    incomingSamplesInD = INCOMING_SAMPLES.length;
  }

  const oldIndex = RUNTIME_CLIP_INDEX["snapshot-old-row"];
  const newIndex = RUNTIME_CLIP_INDEX["snapshot-new-row"];
  const batchIndex = RUNTIME_CLIP_INDEX["fill-q-rows"];
  let qRowsWritten = cursor <= oldIndex ? 0 : cursor <= newIndex ? 1 : cursor <= batchIndex ? 2 : 30;
  let activeQSampleId: string | null = null;
  let activeQCellProgress: readonly number[] = [];
  if (clip.id === "snapshot-old-row" || clip.id === "snapshot-new-row") {
    const sample = clip.id === "snapshot-old-row" ? firstOldExemplar : firstIncomingSample;
    activeQSampleId = boundedProgress < 1 ? sample.id : null;
    const cellProgress = clamp01((boundedProgress - 0.43) / 0.57);
    activeQCellProgress = Array.from({ length: 3 }, (_, index) => clamp01(cellProgress * 3 - index));
    qRowsWritten = (clip.id === "snapshot-old-row" ? (boundedProgress >= 1 ? 1 : 0) : 1 + (boundedProgress >= 1 ? 1 : 0));
  } else if (clip.id === "fill-q-rows") {
    const rowPosition = boundedProgress * remainingQSamples.length;
    const rowIndex = Math.min(remainingQSamples.length - 1, Math.floor(rowPosition));
    activeQSampleId = boundedProgress < 1 ? remainingQSamples[rowIndex]?.id ?? null : null;
    const rowProgress = rowPosition - rowIndex;
    activeQCellProgress = Array.from({ length: 3 }, (_, index) => clamp01(rowProgress * 3 - index));
    qRowsWritten = 2 + rounded(remainingQSamples.length * boundedProgress);
  }

  const theta = cursor < RUNTIME_CLIP_INDEX["update-theta"] ? "before"
    : cursor === RUNTIME_CLIP_INDEX["update-theta"] ? "training" : "after";
  const memory = cursor < RUNTIME_CLIP_INDEX["truncate-old-prefix"] ? "before"
    : cursor === RUNTIME_CLIP_INDEX["truncate-old-prefix"] ? "truncating"
      : cursor < RUNTIME_CLIP_INDEX["commit-p-after"] + 1 ? "building" : "after";
  const oldMemoryRetained = clip.id === "truncate-old-prefix"
    ? OLD_MEMORY_SIZE - rounded((OLD_MEMORY_SIZE - REDUCED_MEMORY_SIZE) * boundedProgress)
    : cursor < RUNTIME_CLIP_INDEX["truncate-old-prefix"] ? OLD_MEMORY_SIZE : REDUCED_MEMORY_SIZE;
  const newExemplarsSelected = clip.id === "herd-class-d"
    ? rounded(NEXT_QUOTA * boundedProgress)
    : clip.id === "herd-classes-e-f"
      ? NEXT_QUOTA + rounded(NEXT_QUOTA * 2 * boundedProgress)
      : cursor <= RUNTIME_CLIP_INDEX["herd-class-d"] ? 0
        : cursor <= RUNTIME_CLIP_INDEX["herd-classes-e-f"] ? NEXT_QUOTA
          : NEXT_QUOTA * 3;
  const committedMemoryCount = cursor < RUNTIME_CLIP_INDEX["commit-p-after"] + 1
    ? oldMemoryRetained + newExemplarsSelected
    : P_AFTER.A.length + P_AFTER.B.length + P_AFTER.C.length + P_AFTER.D.length + P_AFTER.E.length + P_AFTER.F.length;
  const queryProgress = clip.id === "query-arrives" ? boundedProgress : cursor > RUNTIME_CLIP_INDEX["query-arrives"] ? 1 : 0;
  const comparisonProgress = clip.id === "compare-six-distances" ? boundedProgress : cursor > RUNTIME_CLIP_INDEX["compare-six-distances"] ? 1 : 0;
  const nearestHighlightProgress = clip.id === "compare-six-distances" ? clamp01((boundedProgress - 0.82) / 0.18)
    : cursor > RUNTIME_CLIP_INDEX["compare-six-distances"] ? 1 : 0;

  return {
    clip,
    clipIndex: boundedIndex,
    chapterIndex,
    chapterId: clip.chapterId,
    progress: boundedProgress,
    focus: clip.focus,
    operation: clip.operation,
    theta,
    memory,
    objectStatus,
    oldCopiesInD,
    incomingSamplesInD,
    dSampleCount,
    qRowsWritten: Math.max(0, Math.min(TRAINING_SET_SIZE, qRowsWritten)),
    activeQSampleId,
    activeQCellProgress,
    oldMemoryRetained,
    newExemplarsSelected,
    committedMemoryCount,
    queryProgress,
    comparisonProgress,
    nearestHighlightProgress,
  };
}
