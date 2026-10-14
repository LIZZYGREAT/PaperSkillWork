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
    "更新前的旧模型逐张读取 D，只记录三个旧节点 g₁、g₂、g₃ 的响应。",
    "一张旧类图片和一张新类图片都要走同一过程：新图片同样有三个旧节点响应。",
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
  { id: "p5-batch-1", kind: "batch", batchStart: 2, batchCount: 7, durationMs: 3000, holdMs: 400, narrative: "批量生成 Q：先到旧模型，再出响应，再写入 Q 行" },
  { id: "p5-batch-2", kind: "batch", batchStart: 9, batchCount: 7, durationMs: 3000, holdMs: 400, narrative: "Q 逐行累积，当前写入行与三个旧节点同步可见" },
  { id: "p5-batch-3", kind: "batch", batchStart: 16, batchCount: 7, durationMs: 3000, holdMs: 400, narrative: "Q 继续按 D 的稳定顺序累积" },
  { id: "p5-batch-4", kind: "batch", batchStart: 23, batchCount: 7, durationMs: 3000, holdMs: 900, narrative: "写满 30 行" },
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

function writtenRowsAt(clip: FlowClip, elapsedMs: number): number {
  if (clip.kind === "recall" || clip.kind === "merge") return 0;
  if (clip.kind === "sample-to-teacher") return clip.id === "p5-old-sample" ? 0 : 1;
  if (clip.kind === "batch") {
    const start = clip.batchStart ?? 0;
    const count = clip.batchCount ?? 0;
    const done = Math.floor(progressWithin(elapsedMs, 0, Math.max(1, count * (BATCH_TRAVEL + BATCH_HOLD))) * count);
    return Math.min(TRAINING_SET_SIZE, start + done);
  }
  return TRAINING_SET_SIZE;
}

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
  const workbenchRef = useRef<HTMLElement | null>(null);
  const flowBoardRef = useRef<HTMLDivElement | null>(null);

  const guidanceIndex = clip.kind === "recall" ? activeNarrationIndex(guidance[0], state.progress)
    : clip.kind === "merge" ? activeNarrationIndex(guidance[1], state.progress)
    : clip.kind === "sample-to-teacher" || clip.kind === "batch" ? activeNarrationIndex(guidance[2], state.progress)
    : activeNarrationIndex(guidance[3], state.progress);

  const demoOld = oldExemplars.find((sample) => sample.classId === "B") ?? oldExemplars[0];
  const demoNew = incomingSamples.find((sample) => sample.classId === "E") ?? incomingSamples[0];

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

    // Outside the merge phase the Q writer drives the count; during the merge the arrivals do,
    // so the number on the D card and the number of tokens that reached it always agree.
    const writtenRows = clip.kind === "merge" ? arrived : writtenRowsAt(clip, elapsed);
    const progressByToken = new Map(tokens.map((token) => [token.id, token.progress]));

    // The demonstrated sample travels from D to the teacher, then its responses fill one Q row.
    const demoSample = clip.id === "p5-old-sample" ? demoOld : clip.id === "p5-new-sample" ? demoNew : null;
    const demoTravelled = demoSample ? smoothstep(progressWithin(elapsed, 200, 1100)) : 0;
    const demoResponseCount = demoSample ? Math.min(3, Math.floor(progressWithin(elapsed, 1200, 2500) * 4)) : 0;
    const demoActiveNode = demoSample ? Math.min(2, demoResponseCount - 1) : -1;
    const demoRowProgress = demoSample ? smoothstep(progressWithin(elapsed, 2500, 3400)) : 0;

    const batchCursor = clip.kind === "batch"
      ? Math.max(0, Math.min(TRAINING_SET_SIZE - 1, writtenRows - 1))
      : clip.kind === "lock" || clip.kind === "handoff"
        ? TRAINING_SET_SIZE - 1
        : demoSample
          ? Math.max(0, trainingSamples.findIndex((sample) => sample.id === demoSample.id))
          : Math.max(0, writtenRows - 1);
    const cursorSample = trainingSamples[batchCursor];
    const cursorSnapshot = teacherSnapshotFor(cursorSample);

    /** How far the cell currently being written has filled. */
    const cursorCellProgress = (index: number) => {
      if (clip.kind === "batch") {
        const rowIndex = writtenRows - 1;
        const rowElapsed = elapsed - rowIndex * (BATCH_TRAVEL + BATCH_HOLD);
        const rowProgress = clamp(rowElapsed / BATCH_TRAVEL);
        return clamp((rowProgress - index * 0.26) / 0.74);
      }
      if (demoSample) return demoRowProgress;
      return 1;
    };

    const focused = selectedId
      ? trainingSamples.find((sample) => sample.id === selectedId) ?? cursorSample
      : cursorSample;
    const shown = demoSample ?? focused;
    const focusedSnapshot = teacherSnapshotFor(shown);
    const focusedIndex = trainingSamples.findIndex((sample) => sample.id === shown.id);
    const focusedFilled = focusedIndex < writtenRows || (Boolean(demoSample) && demoRowProgress > 0.4);
    const focusedWriting = !demoSample && clip.kind === "batch" && focusedIndex === writtenRows - 1;

    const teacherActive = clip.kind === "sample-to-teacher"
      ? demoActiveNode
      : clip.kind === "batch" || clip.kind === "lock"
        ? 2
        : -1;
    const teacherResponses = clip.kind === "sample-to-teacher" && demoResponseCount >= 3 && demoSample
      ? teacherSnapshotFor(demoSample)
      : clip.kind === "batch" || clip.kind === "lock"
        ? cursorSnapshot
        : undefined;

    return {
      writtenRows,
      tokens,
      arrived,
      progressByToken,
      demoSample,
      demoTravelled,
      demoRowProgress,
      cursorSample,
      cursorSnapshot,
      cursorCellProgress,
      shown,
      focusedSnapshot,
      focusedFilled,
      focusedWriting,
      teacherActive,
      teacherResponses,
      mergeComplete: clip.kind === "merge" ? progressWithin(elapsed, 5400, 7000) : clip.kind === "recall" ? 0 : 1,
    };
  }, [clip, state.elapsedMs, selectedId, demoOld, demoNew]);

  const showReadout = clip.kind === "merge";
  const resolvedReadout = scene.mergeComplete >= 1;
  const phaseLabel = clip.kind === "lock" || clip.kind === "handoff" ? "Q 已固定"
    : clip.kind === "batch" ? `正在写入 Q · ${scene.writtenRows} / ${TRAINING_SET_SIZE}`
    : clip.kind === "sample-to-teacher" ? "演示单张样本"
    : clip.kind === "merge" ? "读取副本 → D"
    : "Replay → D";

  function focusWorkbench() {
    workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
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
        data-clip-ids={clips.map((item) => item.id).join(",")}
        ref={workbenchRef}
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
          <section className="p5-source-bank" aria-label="持久旧记忆与新类完整批次">
            <div className="p5-bank-heading"><span className="eyebrow">输入来源</span><b>P + X<sub>new</sub></b></div>
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
            {showReadout ? (
              <div className={`p5-merge-readout${resolvedReadout ? " is-resolved" : ""}`} aria-live="polite">
                <span><b>{OLD_COUNT}</b> 张旧副本</span>
                <i>+</i>
                <span><b>{NEW_COUNT}</b> 张新图片</span>
                <i>=</i>
                <span><b>{scene.arrived}</b> / {TRAINING_SET_SIZE} 已到达 D</span>
              </div>
            ) : null}
          </section>

          <section className="p5-object p5-object--dataset" aria-label="训练集 D">
            <span className="eyebrow">本轮训练集</span>
            <b className="p5-object-symbol">D</b>
            <div className="p5-d-bar" aria-label={`${scene.writtenRows} 个训练样本已合入 D`}><i style={{ width: `${(scene.writtenRows / TRAINING_SET_SIZE) * 100}%` }} /></div>
            <strong>{scene.writtenRows} / {TRAINING_SET_SIZE} 张已合入</strong>
            <small>{clip.kind === "merge" && scene.writtenRows < TRAINING_SET_SIZE ? "旧记忆只送出读取副本；原槽位保持不动" : "所有样本逐一读取；训练结束后 D 释放，持久记忆不受影响"}</small>
          </section>

          <section className="p5-model-stack" aria-label="生成 Q 的更新前旧模型与待更新 Student">
            <div className={`p5-model-card p5-model-card--teacher${clip.kind === "lock" || clip.kind === "handoff" ? " is-frozen" : ""}`}>
              <span className="eyebrow">{clip.kind === "lock" || clip.kind === "handoff" ? "更新前 Teacher · 已固定参考" : "更新前的旧模型 · Q 的来源"}</span>
              <b>共享特征 + 三个旧节点</b>
              <div className="p5-model-input">
                <span className="p5-selected-glyph" style={accent(scene.shown.classId)}>{CLASS_VISUALS[scene.shown.classId].glyph}</span>
                <span>
                  <small>{isOldClass(scene.shown.classId) ? "P 中旧 exemplar 的读取副本" : "X_new 中的新类图片"}</small>
                  <strong>{scene.shown.id} · {CLASS_VISUALS[scene.shown.classId].displayLabel}</strong>
                </span>
              </div>
              <Nodes classIds={OLD_CLASS_IDS} kind="old" responses={scene.teacherResponses} activeIndex={scene.teacherActive} />
              <small className="p5-model-caption">三个响应会写入右侧 Q 中同一行；Teacher 的参数在这之后不再变化。</small>
            </div>
            <div className="p5-model-card p5-model-card--student" aria-label="本轮待训练六节点 Student">
              <span className="eyebrow">Q 固定后 · 等待更新的 Student</span>
              <b>同一共享网络 · 六节点输出头</b>
              <Nodes classIds={ALL_CLASS_IDS} kind="student" />
              <small>g₄–g₆ 在 Q 记录之后加入；它们不参与 Q。此时还没有执行任何梯度更新。</small>
            </div>
          </section>

          <section className="p5-object p5-object--snapshot" aria-label="更新前旧节点响应快照 Q">
            <header>
              <div><span className="eyebrow">更新前旧节点响应</span><b className="p5-object-symbol">Q</b></div>
              <span className={`p5-lock${clip.kind === "lock" || clip.kind === "handoff" ? " is-locked" : ""}`}>
                {clip.kind === "lock" || clip.kind === "handoff" ? "已固定" : clip.kind === "batch" ? "记录中" : "等待记录"}
              </span>
            </header>
            <strong>{scene.writtenRows} × 3</strong>
            <small>一行一张 D 样本 · 三列旧节点 g₁ g₂ g₃ · 共 {TRAINING_SET_SIZE} 行</small>
            <div className="p5-q-preview" aria-label={`${scene.writtenRows} 行已记录，共 ${TRAINING_SET_SIZE} 行`}>
              {trainingSamples.map((sample, index) => (
                <span
                  key={sample.id}
                  title={`${sample.id} · Q 第 ${index + 1} 行`}
                  className={[
                    index < scene.writtenRows ? "is-filled" : "",
                    sample.id === scene.shown.id ? "is-selected" : "",
                    index === scene.writtenRows - 1 && clip.kind === "batch" ? "is-writing" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <i /><i /><i />
                </span>
              ))}
            </div>
            <div className="p5-q-column-labels"><span>图片 / Q 行</span>{OLD_CLASS_IDS.map((classId) => <b key={classId}>{CLASS_VISUALS[classId].outputNodeLabel}</b>)}</div>
            <div className={`p5-q-sample-row${scene.focusedFilled ? " is-filled" : ""}${scene.focusedWriting ? " is-writing" : ""}`} aria-label={`${scene.shown.id} 的 Q 行${scene.focusedFilled ? "已记录" : scene.focusedWriting ? "正在写入" : "尚未写入"}`}>
              <span>{scene.shown.id}{scene.focusedWriting ? " · 写入中" : clip.kind === "sample-to-teacher" ? " · 演示读取" : ""}</span>
              {scene.focusedSnapshot.map((value, index) => (
                <b key={`${scene.shown.id}-${index}`} style={{ "--cell-progress": `${(scene.focusedFilled ? 1 : scene.cursorCellProgress(index)) * 100}%` } as CSSProperties}>
                  {scene.focusedFilled || scene.cursorCellProgress(index) >= 0.65 ? value.toFixed(2) : "·"}
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
                      const rowIndex = trainingSamples.findIndex((item) => item.id === sample.id);
                      return (
                        <tr key={sample.id} className={[sample.id === scene.shown.id ? "is-selected" : "", rowIndex >= scene.writtenRows ? "is-pending" : ""].filter(Boolean).join(" ")}>
                          <th><button type="button" onClick={() => setSelectedId(sample.id)} aria-label={`在 Q 中定位 ${sample.id} 的对应行`}>{sample.id}</button></th>
                          <td>{CLASS_VISUALS[sample.classId].displayLabel}</td>
                          <td>{isOldClass(sample.classId) ? "P_old" : "X_new"}</td>
                          {row.map((value, index) => <td key={`${sample.id}-${index}`}>{rowIndex < scene.writtenRows ? value.toFixed(3) : "—"}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>记录 q<sub>i</sub><sup>y</sup> = g<sub>y</sub>(x<sub>i</sub>) 用的是固定教学用旧节点权重，不是论文 checkpoint 或实验观测值；每一行的三个数值都由同一张图片确定性产生。</p>
            </details>
          </section>
        </div>

        <div className="p5-order-strip" aria-label="增量更新对象顺序">
          <span className={clip.kind === "recall" ? "is-current" : "is-complete"}>P + X<sub>new</sub></span><i>→</i>
          <span className={clip.kind === "merge" ? "is-current" : clip.kind === "recall" ? "" : "is-complete"}>D · {TRAINING_SET_SIZE}</span><i>→</i>
          <span className={clip.kind === "sample-to-teacher" || clip.kind === "batch" ? "is-current" : clip.kind === "lock" || clip.kind === "handoff" ? "is-complete" : ""}>Q · {TRAINING_SET_SIZE}×3</span><i>→</i>
          <span className={clip.kind === "handoff" ? "is-current" : ""}>Student · 6</span>
          <small>每一行 q<sub>i</sub> 与图片身份一一对应；Q 不随 Student 参数改变。</small>
        </div>

        <footer className="p5-controls" aria-label="P5 动画控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.stepBack} disabled={!state.hasPrevious}>← 上一步</button>
          <div className="p5-control-main">
            <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.toggle}>{state.status === "playing" ? "Ⅱ 暂停" : "▶ 继续"}</button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.replayClip}>↺ 重播本片段</button>
            <span aria-live="polite">{state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}</span>
          </div>
          <button type="button" className="icarl-button icarl-button--primary" onClick={controls.stepForward} disabled={!state.hasNext}>下一步 →</button>
        </footer>

        <div className="p5-clip-rail" role="group" aria-label="片段定位">
          {clips.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === state.clipIndex ? "is-current" : index < state.clipIndex ? "is-complete" : ""}
              aria-pressed={index === state.clipIndex}
              onClick={() => controls.goToClip(clipIndexById.get(item.id) ?? 0)}
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
