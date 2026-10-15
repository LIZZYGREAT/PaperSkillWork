import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  ALL_CLASS_IDS,
  CLASS_VISUALS,
  INCOMING_CLASS_IDS,
  OLD_CLASS_IDS,
  TRAINING_SET_SIZE,
  type ClassId,
  type Sample,
} from "../data/icarl-runtime";
import { INCREMENTAL_DATA_VALIDATION, INCREMENTAL_STAGE_DATA, teacherSnapshotFor } from "../data/incremental-training";
import { snapshotWriteProgress } from "../data/incremental-snapshot-progress";
import {
  activeNarrationIndex,
  useAnimationTimeline,
  type AnimationClip,
} from "../shared/animation/useAnimationTimeline";
import { clamp, lerp, progressWithin, smoothstep } from "../shared/animation/easing";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

/* ------------------------------------------------------------------ data --- */

const oldExemplars = INCREMENTAL_STAGE_DATA.oldExemplars;
const incomingSamples = INCREMENTAL_STAGE_DATA.incomingSamples;
const trainingSamples = INCREMENTAL_STAGE_DATA.trainingSamples;
const OLD_COUNT = oldExemplars.length;
const NEW_COUNT = incomingSamples.length;
const demoOld = oldExemplars.find((sample) => sample.classId === "B") ?? oldExemplars[0];
const demoNew = incomingSamples.find((sample) => sample.classId === "E") ?? incomingSamples[0];
const demoSampleIds = new Set([demoOld.id, demoNew.id]);
const remainingSamples = trainingSamples.filter((sample) => !demoSampleIds.has(sample.id));

function accent(classId: ClassId) {
  return { "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

const isOldClass = (classId: ClassId) => (OLD_CLASS_IDS as readonly string[]).includes(classId);

/* ----------------------------------------------------------------- clips --- */

type ClipKind = "recall" | "merge" | "sample-to-teacher" | "batch" | "lock" | "handoff";

type FlowClip = AnimationClip & { kind: ClipKind; batchStart?: number; batchCount?: number };

const guidance: readonly (readonly string[])[] = [
  [
    "前面用 Exemplars 构造 Prototype，模型已经能预测新图片。",
    "新类别还会继续到来，共享特征提取器也需要继续更新。",
    "如果这一轮只看新图片，旧类别的判别能力很可能一起退化。",
    "既然保存了旧类真实代表图片，就让它们也参加这一轮训练：这就是 Replay。",
  ],
  [
    "从持久记忆 P 读取旧类 Exemplars 的训练副本，原槽位保持不动。",
    "新类图片 X_new 是这一轮的完整数据，和旧副本一起构成 D = P_old ∪ X_new。",
    "12 + 18 = 30：D 是这一轮的训练集，不等于持久记忆本身。",
  ],
  [
    "D 已经准备好了。可是参数一旦更新，网络对旧类别的响应也会跟着改变。",
    "能不能在改动参数之前，先把旧模型原来的判断记下来？",
    "为便于看清对应关系，先演示一张旧类图和一张新类图；每张图都由更新前的旧模型产生三个旧节点响应。",
    "之后按 D 中其余样本的原有顺序补齐；无论展示先后，每张图始终写入自己的 Q 行。",
  ],
  [
    "Q 的一行对应 D 中一张图片，三列对应旧节点 g₁、g₂、g₃，所以 Q 是 30 × 3。",
    "这些响应记录的是更新前模型的行为，不是这张图片的真实类别标签。",
    "一旦记录完成，Q 就在本轮训练中保持固定；下一页会用它作为旧节点的训练目标。",
  ],
];

const clips: readonly FlowClip[] = [
  { id: "p5-recall", kind: "recall", durationMs: 2600, holdMs: 900, narrative: "旧记忆与新数据同时在场" },
  { id: "p5-merge", kind: "merge", durationMs: 7400, holdMs: 1400, narrative: "读取旧副本并与新图片合成 D" },
  { id: "p5-old-sample", kind: "sample-to-teacher", durationMs: 4200, holdMs: 900, narrative: "一张旧类图片：D → 更新前旧模型 → Q 行" },
  { id: "p5-new-sample", kind: "sample-to-teacher", durationMs: 4200, holdMs: 900, narrative: "一张新类图片：同样产生三个旧节点响应" },
  { id: "p5-batch-1", kind: "batch", batchStart: 0, batchCount: 7, durationMs: 3000, holdMs: 400, narrative: "批量生成 Q：先到旧模型，再出响应，再写入 Q 行" },
  { id: "p5-batch-2", kind: "batch", batchStart: 7, batchCount: 7, durationMs: 3000, holdMs: 400, narrative: "Q 逐行累积，当前写入行与三个旧节点同步可见" },
  { id: "p5-batch-3", kind: "batch", batchStart: 14, batchCount: 7, durationMs: 3000, holdMs: 400, narrative: "先演示旧 B 与新 E，再按 D 中其余样本的顺序补齐各自的 Q 行" },
  { id: "p5-batch-4", kind: "batch", batchStart: 21, batchCount: 7, durationMs: 3000, holdMs: 900, narrative: "写满 30 行" },
  { id: "p5-lock", kind: "lock", durationMs: 2600, holdMs: 2000, narrative: "Q 生成完毕并固定，训练中不再改变" },
  { id: "p5-handoff", kind: "handoff", durationMs: 2600, holdMs: 2200, narrative: "D、Q 与六节点 Student 等待下一步" },
];

const clipIndexById = new Map(clips.map((clip, index) => [clip.id, index]));

/* ---------------------------------------------------------------- helpers --- */

type Token = { id: string; classId: ClassId; origin: "old" | "new"; index: number; source: Sample };

const mergeTokens: Token[] = [
  ...oldExemplars.map((sample, index) => ({ id: `${sample.id}-copy`, classId: sample.classId, origin: "old" as const, index, source: sample })),
  ...incomingSamples.map((sample, index) => ({ id: `${sample.id}-new`, classId: sample.classId, origin: "new" as const, index, source: sample })),
];

/** Token release is staggered so the reader sees the two sources feeding D, not thirty flights. */
const MERGE_STAGGER = 150;
const MERGE_TRAVEL = 900;

const BATCH_TRAVEL = 260;
const BATCH_HOLD = 120;

/* ---------------------------------------------------------------- subviews --- */

type FlightToken = { id: string; classId: ClassId; origin: "old" | "new"; index: number; progress: number; order: number };

/**
 * Tokens really travel from the source bucket that owns them to the D card.
 *
 * Both endpoints are measured from the live DOM, so the flight path follows the layout instead of
 * a hardcoded offset, and a token disappears exactly when its D row is counted.
 */
function MergeFlight({ tokens, active, boardRef }: { tokens: readonly FlightToken[]; active: boolean; boardRef: RefObject<HTMLElement | null> }) {
  const [geometry, setGeometry] = useState<{ width: number; height: number; target: { x: number; y: number }; sources: Map<string, { x: number; y: number }> } | null>(null);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      const boardBox = board.getBoundingClientRect();
      const targetElement = board.querySelector(".p5-object--dataset");
      if (!targetElement) return;
      const targetBox = targetElement.getBoundingClientRect();
      const sources = new Map<string, { x: number; y: number }>();
      board.querySelectorAll<HTMLElement>("[data-token-id]").forEach((element) => {
        const box = element.getBoundingClientRect();
        sources.set(element.dataset.tokenId ?? "", {
          x: box.left - boardBox.left + box.width / 2,
          y: box.top - boardBox.top + box.height / 2,
        });
      });
      setGeometry({
        width: boardBox.width,
        height: boardBox.height,
        target: { x: targetBox.left - boardBox.left + targetBox.width / 2, y: targetBox.top - boardBox.top + targetBox.height / 2 },
        sources,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [boardRef]);

  if (!geometry) return null;
  const size = 9;
  return (
    <svg className="p5-flight" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
      {tokens.map((token) => {
        const from = geometry.sources.get(token.id);
        if (!from) return null;
        const travelling = active ? token.progress : token.progress >= 1 ? 1 : 0;
        const tail = clamp((travelling - 0.82) / 0.18);
        if (travelling <= 0.001 || tail >= 1) return null;
        const control = { x: from.x + (token.origin === "old" ? 70 : -70), y: (from.y + geometry.target.y) / 2 - 46 };
        const t = travelling;
        const position = {
          x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * control.x + t * t * geometry.target.x,
          y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * control.y + t * t * geometry.target.y,
        };
        return (
          <g key={token.id} className={`p5-flight__token p5-flight__token--${token.origin}`} opacity={1 - tail}>
            <circle cx={position.x} cy={position.y} r={size / 2} />
          </g>
        );
      })}
    </svg>
  );
}

function ClassBucket({ classId, samples, origin, receiveProgress }: { classId: ClassId; samples: readonly Sample[]; origin: "old" | "new"; receiveProgress: (sampleId: string) => number }) {
  const visual = CLASS_VISUALS[classId];
  return (
    <section className={`p5-bucket p5-bucket--${origin}`} style={accent(classId)}>
      <header>
        <span className="p5-bucket__glyph">{visual.glyph}</span>
        <b>{visual.displayLabel}</b>
        <small>{samples.length} 张</small>
      </header>
      <div className="p5-bucket__tokens" aria-label={`${visual.displayLabel} ${samples.length} 张图片`}>
        {samples.map((sample) => (
          <i
            className="p5-token"
            key={sample.id}
            aria-hidden="true"
            data-token-id={`${sample.id}${origin === "old" ? "-copy" : "-new"}`}
            data-received={(receiveProgress(sample.id) > 0.5).toString()}
          />
        ))}
      </div>
    </section>
  );
}

function Nodes({ classIds, kind, responses, activeIndex }: { classIds: readonly ClassId[]; kind: "old" | "student"; responses?: readonly number[]; activeIndex?: number }) {
  return (
    <div className={`p5-nodes p5-nodes--${kind}`} aria-label={kind === "old" ? "更新前旧模型的三个旧类别输出节点" : "扩展后的六节点 Student 输出层"}>
      {classIds.map((classId, index) => (
        <span
          key={classId}
          className={[
            responses ? "is-reading" : "",
            activeIndex === index ? "is-active" : "",
            responses && activeIndex !== undefined && index < activeIndex ? "is-written" : "",
          ].filter(Boolean).join(" ")}
          style={{ ...accent(classId), "--response-fill": `${(responses?.[index] ?? 0) * 100}%` } as CSSProperties}
          data-node-id={`g${CLASS_VISUALS[classId].index}`}
        >
          <i aria-hidden="true">{CLASS_VISUALS[classId].glyph}</i>
          <b>{CLASS_VISUALS[classId].outputNodeLabel}</b>
          {responses ? <small>{responses[index].toFixed(2)}</small> : null}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- page --- */

export function PageFive({ onContinue }: { onContinue?: () => void } = {}) {
  const reducedMotion = useReducedMotion();
  const { state, controls } = useAnimationTimeline({ clips, reducedMotion, autoPlay: false });
  const clip = clips[state.clipIndex];
  const [selectedId, setSelectedId] = useState<string>(incomingSamples.find((sample) => sample.classId === "E")?.id ?? incomingSamples[0].id);
  const [inspectedSampleId, setInspectedSampleId] = useState<string | null>(null);
  const flowBoardRef = useRef<HTMLDivElement | null>(null);

  const guidanceIndex = clip.kind === "recall" ? activeNarrationIndex(guidance[0], state.progress)
    : clip.kind === "merge" ? activeNarrationIndex(guidance[1], state.progress)
    : clip.kind === "sample-to-teacher" || clip.kind === "batch" ? activeNarrationIndex(guidance[2], state.progress)
    : activeNarrationIndex(guidance[3], state.progress);

  const scene = useMemo(() => {
    const elapsed = state.elapsedMs;

    // Token k is the visual twin of D row k: it arrives exactly when that row is counted.
    const tokens = mergeTokens.map((token, index) => {
      const arrival = clip.kind === "merge"
        ? smoothstep(progressWithin(elapsed, index * MERGE_STAGGER, index * MERGE_STAGGER + MERGE_TRAVEL))
        : clip.kind === "recall" ? 0 : 1;
      return { ...token, progress: arrival, order: index };
    });
    const arrived = clip.kind === "merge"
      ? tokens.filter((token) => token.progress > 0.99).length
      : clip.kind === "recall" ? 0 : TRAINING_SET_SIZE;
    const dArrivedCount = clip.kind === "merge" ? arrived : clip.kind === "recall" ? 0 : TRAINING_SET_SIZE;
    const progressByToken = new Map(tokens.map((token) => [token.id, token.progress]));

    // The demonstrated sample travels from D to the teacher, then its responses fill one Q row.
    const demoSample = clip.id === "p5-old-sample" ? demoOld : clip.id === "p5-new-sample" ? demoNew : null;
    const demoResponseCount = demoSample ? Math.min(3, Math.floor(progressWithin(elapsed, 1200, 2500) * 4)) : 0;
    const demoActiveNode = demoSample ? Math.min(2, demoResponseCount - 1) : -1;
    const scheduledSamples = clip.kind === "sample-to-teacher"
      ? demoSample ? [demoSample] : []
      : clip.kind === "batch"
        ? remainingSamples.slice(clip.batchStart ?? 0, (clip.batchStart ?? 0) + (clip.batchCount ?? 0))
        : [];
    const writeSchedule = clip.kind === "sample-to-teacher"
      ? snapshotWriteProgress(scheduledSamples, elapsed, { startMs: 2500, rowTravelMs: 900 })
      : clip.kind === "batch"
        ? snapshotWriteProgress(scheduledSamples, elapsed, { rowTravelMs: BATCH_TRAVEL, rowHoldMs: BATCH_HOLD })
        : null;

    const writtenIds = new Set<string>();
    if (clip.kind === "sample-to-teacher" && clip.id === "p5-new-sample") writtenIds.add(demoOld.id);
    if (clip.kind === "batch") {
      writtenIds.add(demoOld.id);
      writtenIds.add(demoNew.id);
      remainingSamples.slice(0, clip.batchStart ?? 0).forEach((sample) => writtenIds.add(sample.id));
    }
    if (clip.kind === "lock" || clip.kind === "handoff") trainingSamples.forEach((sample) => writtenIds.add(sample.id));
    writeSchedule?.completedIds.forEach((sampleId) => writtenIds.add(sampleId));

    const completedIds = writeSchedule?.completedIds ?? [];
    const lastCompletedId = completedIds[completedIds.length - 1] ?? null;
    const batchSampleId = writeSchedule?.activeSampleId ?? lastCompletedId;
    const batchSample = batchSampleId ? trainingSamples.find((sample) => sample.id === batchSampleId) ?? null : null;
    const settledSample = clip.kind === "lock" || clip.kind === "handoff" ? trainingSamples[TRAINING_SET_SIZE - 1] : null;
    const defaultSample = trainingSamples.find((sample) => sample.id === selectedId) ?? demoNew;
    const inspectedSample = inspectedSampleId ? trainingSamples.find((sample) => sample.id === inspectedSampleId) ?? null : null;
    const shown = inspectedSample ?? demoSample ?? batchSample ?? settledSample ?? defaultSample;
    const shownWritten = writtenIds.has(shown.id);
    const shownWriting = writeSchedule?.activeSampleId === shown.id && !shownWritten;
    const focusedSnapshot = teacherSnapshotFor(shown);
    const cellProgressForSample = (sampleId: string, index: number) => {
      if (writtenIds.has(sampleId)) return 1;
      if (writeSchedule?.activeSampleId === sampleId) return writeSchedule.activeCellProgress[index] ?? 0;
      return 0;
    };

    const teacherActive = inspectedSample
      ? -1
      : clip.kind === "sample-to-teacher"
        ? demoActiveNode
        : clip.kind === "batch" || clip.kind === "lock" || clip.kind === "handoff"
          ? 2
          : -1;
    const teacherResponsesVisible = Boolean(inspectedSample)
      || clip.kind === "batch" || clip.kind === "lock" || clip.kind === "handoff"
      || Boolean(demoSample && demoResponseCount >= 3);
    const teacherResponses = teacherResponsesVisible ? teacherSnapshotFor(shown) : undefined;

    return {
      writtenIds,
      writtenCount: writtenIds.size,
      activeSampleId: writeSchedule?.activeSampleId ?? null,
      cellProgressForSample,
      dArrivedCount,
      tokens,
      arrived,
      progressByToken,
      demoSample,
      shown,
      focusedSnapshot,
      shownWritten,
      shownWriting,
      inspecting: Boolean(inspectedSample),
      teacherActive,
      teacherResponses,
      mergeComplete: clip.kind === "merge" ? progressWithin(elapsed, 5400, 7000) : clip.kind === "recall" ? 0 : 1,
    };
  }, [clip, state.elapsedMs, selectedId, inspectedSampleId]);

  const resolvedReadout = scene.mergeComplete >= 1;
  const phaseLabel = scene.inspecting ? "查阅样本 · 已暂停"
    : clip.kind === "lock" || clip.kind === "handoff" ? "Q 已固定"
    : clip.kind === "batch" ? `正在写入 Q · ${scene.writtenCount} / ${TRAINING_SET_SIZE}`
    : clip.kind === "sample-to-teacher" ? "演示单张样本"
    : clip.kind === "merge" ? "读取副本 → D"
    : "Replay → D";

  function inspectSample(sampleId: string) {
    if (state.status === "playing") controls.pause();
    setSelectedId(sampleId);
    setInspectedSampleId(sampleId);
  }

  function leaveInspection(action: () => void) {
    setInspectedSampleId(null);
    action();
  }

  return (
    <article className="tutorial-page icarl-page icarl-page--p5" data-data-check={INCREMENTAL_DATA_VALIDATION ? "pass" : "fail"}>
      <header className="page-heading icarl-page__heading p5-heading">
        <div className="icarl-page__eyebrow"><span>PAGE 05</span><i /> REPLAY · OLD RESPONSES Q</div>
        <h1>保存的 Exemplars 怎样继续参与学习？</h1>
        <p>新类别还会到来。让旧记忆和新类图片共同形成训练集，并在参数改变之前保存旧节点的响应。</p>
      </header>

      <section
        className="p5-workbench"
        aria-label="Replay、训练集 D 与旧响应快照 Q 连续工作台"
        data-clip={clip.id}
        data-kind={clip.kind}
        data-progress={state.progress.toFixed(3)}
        data-status={state.status}
        data-current-sample-id={scene.shown.id}
        data-active-sample-id={scene.activeSampleId ?? ""}
        data-q-written-ids={trainingSamples.filter((sample) => scene.writtenIds.has(sample.id)).map((sample) => sample.id).join(",")}
        data-clip-ids={clips.map((item) => item.id).join(",")}
      >
        <header className="p5-workbench__guide">
          <div>
            <span className="eyebrow">片段 {state.clipIndex + 1} / {clips.length} · {clip.narrative}</span>
            <div className="p5-guidance-copy" aria-live="polite">
              {guidance[clip.kind === "recall" ? 0 : clip.kind === "merge" ? 1 : clip.kind === "sample-to-teacher" || clip.kind === "batch" ? 2 : 3].map((line, index) => (
                <p key={line} className={`${index === guidanceIndex ? "is-current" : ""} ${index < guidanceIndex ? "is-read" : ""}`}>{line}</p>
              ))}
            </div>
          </div>
          <span className={`p5-guide-status${clip.kind === "lock" || clip.kind === "handoff" ? " is-locked" : ""}`}>{phaseLabel}</span>
        </header>

        <div className="p5-flow-board" ref={flowBoardRef}>
          <MergeFlight tokens={scene.tokens} active={clip.kind === "merge"} boardRef={flowBoardRef} />
          <section className="p5-source-bank" aria-label="第一步：持久旧记忆与新类完整批次">
            <div className="p5-bank-heading"><span className="eyebrow">① 输入来源</span><b>P + X<sub>new</sub></b></div>
            <div className="p5-source-section p5-source-section--old">
              <header>
                <b>旧类 Exemplars P</b><strong>{OLD_COUNT} 张</strong>
              </header>
              <div className="p5-class-list">
                {OLD_CLASS_IDS.map((classId) => (
                  <ClassBucket key={classId} classId={classId} samples={oldExemplars.filter((sample) => sample.classId === classId)} origin="old" receiveProgress={(sampleId) => scene.progressByToken.get(`${sampleId}-copy`) ?? 0} />
                ))}
              </div>
              <small className="p5-source-retained">P 保持原样 · 只送出训练副本</small>
            </div>
            <div className="p5-source-section p5-source-section--new">
              <header><b>新类完整数据 X<sub>new</sub></b><strong>{NEW_COUNT} 张</strong></header>
              <div className="p5-class-list">
                {INCOMING_CLASS_IDS.map((classId) => (
                  <ClassBucket key={classId} classId={classId} samples={incomingSamples.filter((sample) => sample.classId === classId)} origin="new" receiveProgress={(sampleId) => scene.progressByToken.get(`${sampleId}-new`) ?? 0} />
                ))}
              </div>
            </div>
            <div className={`p5-merge-readout${resolvedReadout ? " is-resolved" : ""}`} aria-live="polite">
              <span><b>{OLD_COUNT}</b> 张旧副本</span>
              <i>+</i>
              <span><b>{NEW_COUNT}</b> 张新图片</span>
              <span className="p5-merge-readout__progress"><b>{scene.dArrivedCount} / {TRAINING_SET_SIZE}</b> 已进入 D</span>
            </div>
          </section>

          <section className="p5-object p5-object--dataset" aria-label="第二步：合并为训练集 D">
            <span className="eyebrow">② 合并训练集</span>
            <b className="p5-object-symbol">D</b>
            <div className="p5-d-bar" aria-label={`${scene.dArrivedCount} 个训练样本已合入 D`}><i style={{ width: `${(scene.dArrivedCount / TRAINING_SET_SIZE) * 100}%` }} /></div>
            <strong>{scene.dArrivedCount} / {TRAINING_SET_SIZE} 张已合入</strong>
            <small>{clip.kind === "recall" ? "下一段将把旧副本与新图片合入 D；P 的原槽位保持不动" : clip.kind === "merge" && scene.dArrivedCount < TRAINING_SET_SIZE ? "旧记忆只送出读取副本；原槽位保持不动" : "D 已准备好；训练结束后释放，持久记忆不受影响"}</small>
          </section>

          <section className={`p5-model-card p5-model-card--teacher${clip.kind === "lock" || clip.kind === "handoff" ? " is-frozen" : ""}`} aria-label="第三步：更新前旧 Teacher 读取 D">
            <span className="eyebrow">③ {clip.kind === "lock" || clip.kind === "handoff" ? "更新前 Teacher · 固定参考" : "更新前旧 Teacher · Q 的来源"}</span>
            <b>共享特征 + 三个旧节点</b>
            <div className="p5-model-input" data-sample-id={scene.shown.id}>
              <span className="p5-selected-glyph" style={accent(scene.shown.classId)}>{CLASS_VISUALS[scene.shown.classId].glyph}</span>
              <span>
                <small>{scene.inspecting ? scene.shownWritten ? "查阅 · Q 行已记录" : "查阅预览 · Q 行尚未写入" : isOldClass(scene.shown.classId) ? "P 中旧 exemplar 的读取副本" : "X_new 中的新类图片"}</small>
                <strong>{scene.shown.id} · {CLASS_VISUALS[scene.shown.classId].displayLabel}</strong>
              </span>
            </div>
            <Nodes classIds={OLD_CLASS_IDS} kind="old" responses={scene.teacherResponses} activeIndex={scene.teacherActive} />
            <small className="p5-model-caption">Teacher 逐张读取 D；三个旧节点响应写入该图片对应的 Q 行。</small>
          </section>
          <section className="p5-object p5-object--snapshot" aria-label="第四步：逐张记录更新前旧节点响应快照 Q">
            <header>
              <div><span className="eyebrow">④ 旧节点响应快照</span><b className="p5-object-symbol">Q</b></div>
              <span className={`p5-lock${clip.kind === "lock" || clip.kind === "handoff" ? " is-locked" : ""}`}>
                {clip.kind === "lock" || clip.kind === "handoff" ? "已固定" : scene.inspecting ? scene.shownWritten ? "已记录 · 查阅中" : "未记录 · 查阅中" : clip.kind === "batch" || clip.kind === "sample-to-teacher" ? "记录中" : "等待记录"}
              </span>
            </header>
            <strong>{scene.writtenCount} × 3</strong>
            <small>一行对应 D 中一张图片；三列依次记录旧节点 g₁、g₂、g₃，共 {TRAINING_SET_SIZE} 行。</small>
            <div className="p5-q-preview" aria-label={`${scene.writtenCount} 行已记录，共 ${TRAINING_SET_SIZE} 行`}>
              {trainingSamples.map((sample) => (
                <span
                  key={sample.id}
                  title={`${sample.id} · Q 行${scene.writtenIds.has(sample.id) ? "已记录" : scene.activeSampleId === sample.id ? "正在写入" : "待写入"}`}
                  className={[
                    scene.writtenIds.has(sample.id) ? "is-filled" : "",
                    sample.id === scene.shown.id ? "is-selected" : "",
                    scene.activeSampleId === sample.id && !scene.writtenIds.has(sample.id) ? "is-writing" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {[0, 1, 2].map((index) => <i key={index} style={{ "--cell-progress": `${scene.cellProgressForSample(sample.id, index) * 100}%` } as CSSProperties} />)}
                </span>
              ))}
            </div>
            <div className="p5-q-column-labels"><span>图片 / Q 行</span>{OLD_CLASS_IDS.map((classId) => <b key={classId}>{CLASS_VISUALS[classId].outputNodeLabel}</b>)}</div>
            <div className={`p5-q-sample-row${scene.shownWritten ? " is-filled" : ""}${scene.shownWriting ? " is-writing" : ""}`} data-sample-id={scene.shown.id} aria-label={`${scene.shown.id} 的 Q 行${scene.shownWritten ? "已记录" : scene.shownWriting ? "正在写入" : "尚未写入"}`}>
              <span>{scene.shown.id}{scene.inspecting ? " · 查阅" : scene.shownWriting ? " · 写入中" : clip.kind === "sample-to-teacher" ? " · 演示读取" : ""}</span>
              {scene.focusedSnapshot.map((value, index) => (
                <b key={`${scene.shown.id}-${index}`} style={{ "--cell-progress": `${scene.cellProgressForSample(scene.shown.id, index) * 100}%` } as CSSProperties}>
                  {scene.shownWritten || scene.cellProgressForSample(scene.shown.id, index) >= 0.65 ? value.toFixed(2) : "·"}
                </b>
              ))}
            </div>
            <details className="p5-q-details">
              <summary>查看快照明细 · 30 行 × 3 列</summary>
              <div className="p5-q-table-scroll" role="region" aria-label="D 中每张图片对应的旧节点快照 Q" tabIndex={0}>
                <table className="p5-q-table">
                  <thead><tr><th>样本 xᵢ</th><th>真实类别 yᵢ</th><th>来自</th>{OLD_CLASS_IDS.map((classId) => <th key={classId}>{CLASS_VISUALS[classId].outputNodeLabel}</th>)}</tr></thead>
                  <tbody>
                    {trainingSamples.map((sample) => {
                      const row = teacherSnapshotFor(sample);
                      return (
                        <tr key={sample.id} data-sample-id={sample.id} data-q-state={scene.writtenIds.has(sample.id) ? "written" : scene.activeSampleId === sample.id ? "writing" : "pending"} className={[sample.id === scene.shown.id ? "is-selected" : "", scene.writtenIds.has(sample.id) ? "" : "is-pending", scene.activeSampleId === sample.id && !scene.writtenIds.has(sample.id) ? "is-writing" : ""].filter(Boolean).join(" ")}>
                          <th><button type="button" onClick={() => inspectSample(sample.id)} aria-label={`暂停并查阅 ${sample.id} 的对应 Q 行`}>{sample.id}</button></th>
                          <td>{CLASS_VISUALS[sample.classId].displayLabel}</td>
                          <td>{isOldClass(sample.classId) ? "P_old" : "X_new"}</td>
                          {row.map((value, index) => <td key={`${sample.id}-${index}`}>{scene.writtenIds.has(sample.id) ? value.toFixed(3) : "—"}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>记录 q<sub>i</sub><sup>y</sup> = g<sub>y</sub>(x<sub>i</sub>) 用的是固定教学用旧节点权重，不是论文 checkpoint 或实验观测值；每一行的三个数值都由同一张图片确定性产生。</p>
            </details>
          </section>

          <section className="p5-model-card p5-model-card--student" aria-label="第五步：使用固定 Q 的六节点 Student">
            <span className="eyebrow">⑤ Q 固定后 · 待训练 Student</span>
            <b>同一共享网络 · 六节点输出头</b>
            <Nodes classIds={ALL_CLASS_IDS} kind="student" />
            <small className="p5-student-bridge">下一页构造六维目标：旧节点读取 Q，新节点读取真实标签；此处尚未更新参数。</small>
          </section>
        </div>

        <div className="p5-order-strip" aria-label="增量更新流程：输入、训练集、旧模型响应、Student">
          <span className={clip.kind === "recall" ? "is-current" : "is-complete"}>① P + X<sub>new</sub></span><i>→</i>
          <span className={clip.kind === "merge" ? "is-current" : clip.kind === "recall" ? "" : "is-complete"}>② D · {TRAINING_SET_SIZE}</span><i>→</i>
          <span className={clip.kind === "sample-to-teacher" || clip.kind === "batch" ? "is-current" : clip.kind === "lock" || clip.kind === "handoff" ? "is-complete" : ""}>③ 旧 Teacher → ④ Q · {TRAINING_SET_SIZE}×3</span><i>→</i>
          <span className={clip.kind === "handoff" ? "is-current" : ""}>⑤ Student · 6</span>
          <small>Q 每行对应一张图片；固定后的 Q 会作为旧节点的训练目标。</small>
        </div>

        <footer className="p5-controls" aria-label="P5 动画控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={() => leaveInspection(controls.stepBack)} disabled={!state.hasPrevious}>← 上一步</button>
          <div className="p5-control-main">
            <button type="button" className="icarl-button icarl-button--quiet" onClick={() => leaveInspection(controls.toggle)}>{state.status === "playing" ? "Ⅱ 暂停" : "▶ 继续"}</button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={() => leaveInspection(controls.replayClip)}>↺ 重播本片段</button>
            <span aria-live="polite">{state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}</span>
          </div>
          <button type="button" className="icarl-button icarl-button--primary" onClick={() => leaveInspection(controls.stepForward)} disabled={!state.hasNext}>下一步 →</button>
        </footer>

        <div className="p5-clip-rail" role="group" aria-label="片段定位">
          {clips.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === state.clipIndex ? "is-current" : index < state.clipIndex ? "is-complete" : ""}
              aria-pressed={index === state.clipIndex}
              onClick={() => leaveInspection(() => controls.goToClip(clipIndexById.get(item.id) ?? 0))}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>{item.narrative}
            </button>
          ))}
        </div>
      </section>

      <footer className="p5-handoff icarl-handoff">
        <div>
          <span className="eyebrow">NEXT · PAGE 06</span>
          <p>
            现在我们已经准备好本轮训练图片 D，也保存了旧模型对这些图片的响应 Q。
            可是真实类别标签和 Q 提供的信息并不一样：下一步，我们怎样把它们组合成六个输出节点的训练目标，
            让新模型既学习新类别、又尽量保留旧知识？
          </p>
        </div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>进入第 6 页 · 构造 Target <b aria-hidden="true">→</b></button> : null}
      </footer>
    </article>
  );
}
