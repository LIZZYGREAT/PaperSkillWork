import { useEffect, useRef, type CSSProperties } from "react";
import { SampleToken } from "../components/SampleToken";
import {
  CLASS_VISUALS,
  INCOMING_CLASS_IDS,
  INCOMING_SAMPLES,
  MEMORY_BUDGET,
  OLD_CLASS_IDS,
  P_BEFORE,
  TRAINING_SET_SIZE,
  samplesForClass,
  type ClassId,
  type Sample,
} from "../data/icarl-runtime";
import { INCREMENTAL_STAGE_DATA, teacherSnapshotFor } from "../data/incremental-training";
import { useAnimationTimeline } from "../shared/animation/useAnimationTimeline";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
import {
  RUNTIME_CHAPTERS,
  RUNTIME_CHAPTER_FIRST_CLIP,
  RUNTIME_CLIPS,
  RUNTIME_CLIP_INDEX,
  runtimeSceneAt,
  type RuntimeChapterId,
  type RuntimeObjectId,
  type RuntimeScene,
} from "./page-nine-scene";

const FIRST_SLICE_CLIPS = RUNTIME_CLIPS.slice(0, RUNTIME_CLIP_INDEX["fill-q-rows"] + 1);
const oldDemoSample = P_BEFORE.A[0];
const newDemoSample = INCOMING_SAMPLES.find((sample) => sample.classId === "D")!;
const demoQSamples = [oldDemoSample, newDemoSample] as const;
const futureChapterIds = new Set<RuntimeChapterId>(RUNTIME_CHAPTERS.slice(3).map((chapter) => chapter.id));

function classAccent(classId: ClassId): CSSProperties {
  return { "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

function PersistentState({ scene }: { scene: RuntimeScene }) {
  return (
    <aside className="p9-persistent" aria-label="固定持久状态">
      <section className="p9-card p9-model-card" id="persistent_model_state" data-canonical-id="persistent_model_state">
        <header className="p9-card-heading">
          <div><span className="p9-eyebrow">持久模型</span><h2>当前学习器</h2></div>
          <b className="p9-theta-badge" data-theta-state={scene.theta}>Θ_{scene.theta}</b>
        </header>
        <div className="p9-model-diagram">
          <div className="p9-extractor" id="feature_extractor" data-canonical-id="feature_extractor">
            <span className="p9-layer-stack" aria-hidden="true"><i /><i /><i /><i /></span>
            <strong>φ<sub>Θ</sub></strong>
            <small>共享特征提取器</small>
          </div>
          <span className="p9-flow-arrow" aria-hidden="true">→</span>
          <div className="p9-head-preview" id="training_head" data-canonical-id="training_head" aria-label="更新前的三个旧类别训练节点">
            {OLD_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph}<small>g{CLASS_VISUALS[classId].index}</small></span>)}
          </div>
        </div>
        <p className="p9-card-note">{scene.theta === "before" ? "更新前的旧模型；Q 由这三个旧节点产生。" : "符号化参数状态；不展示虚构的优化器轨迹。"}</p>
      </section>

      <section className="p9-card p9-memory-card" id="persistent_memory_state" data-canonical-id="persistent_memory_state">
        <header className="p9-card-heading">
          <div><span className="p9-eyebrow">持久图片记忆</span><h2>有序原始 exemplars</h2></div>
          <b className="p9-budget-badge">K={MEMORY_BUDGET}</b>
        </header>
        <p className="p9-memory-caption">P_before · 12/12 张。旧图片一直留在原位；送入 D 的是训练副本。</p>
        <div className="p9-memory-groups">
          {OLD_CLASS_IDS.map((classId) => (
            <section className="p9-memory-group" key={classId} style={classAccent(classId)} aria-label={CLASS_VISUALS[classId].displayLabel + " 的持久记忆"}>
              <header><b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b><small>p₁ → p₄</small></header>
              <div className="p9-memory-tokens">
                {P_BEFORE[classId].map((sample, index) => <SampleToken key={sample.id} sample={sample} role="exemplar" order={index + 1} compact />)}
              </div>
            </section>
          ))}
        </div>
        <div className="p9-memory-integrity" data-memory-source-ids={OLD_CLASS_IDS.flatMap((classId) => P_BEFORE[classId].map((sample) => sample.id)).join(" ")}>
          <span aria-hidden="true">●</span> 持久原件不移动
        </div>
      </section>
    </aside>
  );
}

function IncomingBatch() {
  return (
    <div className="p9-incoming-batch" data-canonical-id="incoming_class_batch">
      <div className="p9-incoming-total"><strong>X_new</strong><span>3 类 × 6 张 = 18 张完整新图</span></div>
      <div className="p9-incoming-classes">
        {INCOMING_CLASS_IDS.map((classId) => {
          const representatives = samplesForClass(classId).slice(0, 2);
          return (
            <section className="p9-incoming-class" key={classId} style={classAccent(classId)}>
              <header><b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b><span>6 张</span></header>
              <div>{representatives.map((sample) => <SampleToken key={sample.id} sample={sample} role="incoming" compact />)}<small>另 4 张</small></div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MergeScene({ scene }: { scene: RuntimeScene }) {
  const oldFlightStyle = {
    left: (12 + scene.progress * 57) + "%",
    top: (29 + scene.progress * 14) + "%",
  } as CSSProperties;
  const newFlightStyle = {
    left: (12 + scene.progress * 57) + "%",
    top: (69 - scene.progress * 18) + "%",
  } as CSSProperties;
  const targetSamples = [P_BEFORE.A[0], P_BEFORE.B[0], P_BEFORE.C[0], ...INCOMING_CLASS_IDS.map((classId) => samplesForClass(classId)[0])];
  return (
    <div className="p9-merge-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-d-count={scene.dSampleCount ?? 0}>
      <div className="p9-merge-equation">
        <span><b>{scene.oldCopiesInD}</b> / 12 旧图副本</span><i>+</i>
        <span><b>{scene.incomingSamplesInD}</b> / 18 新图</span><i>=</i>
        <strong>D <b>{scene.dSampleCount ?? 0}</b> / {TRAINING_SET_SIZE}</strong>
      </div>
      <div className="p9-merge-canvas">
        <div className="p9-merge-sources">
          <div className="p9-source-card">
            <span className="p9-eyebrow">来源 1 · P_before 副本</span>
            <strong>12 张已存旧图</strong>
            <div className="p9-source-tokens">
              {OLD_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph} {P_BEFORE[classId][0].id}</span>)}
            </div>
            <small>左侧原件仍留在 P</small>
          </div>
          <div className="p9-source-card p9-source-card--incoming">
            <span className="p9-eyebrow">来源 2 · X_new</span>
            <strong>D / E / F · 18 张完整图片</strong>
            <div className="p9-source-tokens">
              {INCOMING_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph} {samplesForClass(classId)[0].id}</span>)}
            </div>
            <small>每类六张，本轮均可用</small>
          </div>
        </div>
        <div className="p9-merge-routes" aria-hidden="true"><i /><i /></div>
        <span className="p9-flight-token p9-flight-token--old" style={oldFlightStyle} data-sample-id={oldDemoSample.id} data-token-copy="true">
          <SampleToken sample={oldDemoSample} role="exemplar" compact /><small>副本</small>
        </span>
        <span className="p9-flight-token p9-flight-token--new" style={newFlightStyle} data-sample-id={newDemoSample.id} data-token-copy="true">
          <SampleToken sample={newDemoSample} role="incoming" compact />
        </span>
        <div className="p9-d-target" id="training_set_D" data-canonical-id="training_set_D">
          <span className="p9-eyebrow">本轮训练集</span>
          <strong>D</strong>
          <b>{scene.dSampleCount ?? 0} / 30</b>
          <div className="p9-d-examples">{targetSamples.map((sample, index) => <span key={sample.id} className={index < 3 ? "is-copy" : "is-new"} data-sample-id={sample.id}>{sample.id}</span>)}</div>
          <small>显示代表 ID · 总数按真实 D 样本同步</small>
        </div>
      </div>
      <footer className="p9-scene-proof">
        <b>副本关系</b><span data-original-sample-id={oldDemoSample.id}>P 原件 {oldDemoSample.id} 仍在左侧</span><i aria-hidden="true">→</i><span data-copy-sample-id={oldDemoSample.id}>D 中为同 ID 训练副本</span>
      </footer>
    </div>
  );
}

function QValue({ value, progress, column }: { value: number; progress: number; column: number }) {
  const cellStyle = { "--q-fill": (progress * 100) + "%" } as CSSProperties;
  return (
    <span className={"p9-q-cell" + (progress > 0 ? " is-writing" : "")} data-q-column={column + 1} data-progress={progress.toFixed(3)} data-q-value={value.toFixed(6)} style={cellStyle}>
      <i aria-hidden="true" /><b>{progress >= 1 ? value.toFixed(3) : progress > 0 ? value.toFixed(3) : "—"}</b>
    </span>
  );
}

function QTableRow({ sample, active = false, cellProgress = [] }: { sample: Sample; active?: boolean; cellProgress?: readonly number[] }) {
  const values = teacherSnapshotFor(sample);
  return (
    <div className={"p9-q-row" + (active ? " is-active" : "")} role="row" data-q-row={sample.id} data-sample-id={sample.id} style={classAccent(sample.classId)}>
      <b role="rowheader"><span>{CLASS_VISUALS[sample.classId].glyph}</span>{sample.id}</b>
      {values.map((value, column) => <QValue key={column} value={value} progress={active ? cellProgress[column] ?? 0 : 1} column={column} />)}
    </div>
  );
}

function SnapshotScene({ scene }: { scene: RuntimeScene }) {
  const sample = scene.activeQSampleId
    ? INCREMENTAL_STAGE_DATA.trainingSamples.find((entry) => entry.id === scene.activeQSampleId) ?? null
    : null;
  const qRows = demoQSamples.filter((entry, index) => scene.qRowsWritten >= index + 1);
  const visibleRows = [...qRows];
  if (sample && !visibleRows.some((entry) => entry.id === sample.id)) visibleRows.push(sample);
  const routeProgress = scene.progress <= 0.43
    ? scene.progress / 0.43
    : 1 + (scene.progress - 0.43) / 0.57;
  const flightStyle = { left: (6 + Math.min(1, routeProgress) * 84) + "%", top: "78%" } as CSSProperties;
  const cells = sample ? scene.activeQCellProgress : [];
  const notShownCount = Math.max(0, scene.qRowsWritten - qRows.length - (sample ? 1 : 0));
  return (
    <div className="p9-snapshot-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-q-rows={scene.qRowsWritten} data-active-sample-id={sample?.id ?? ""}>
      <div className="p9-snapshot-heading">
        <span><b>Q</b> · 旧节点响应快照</span><strong>{scene.qRowsWritten} / 30 行 · 3 列</strong>
      </div>
      <div className="p9-q-route">
        <section className="p9-route-node p9-route-node--data" id="training_set_D" data-canonical-id="training_set_D">
          <span className="p9-eyebrow">D · 当前样本</span>
          <strong>30 个训练 ID</strong>
          {sample ? <SampleToken sample={sample} role={sample.classId === "A" || sample.classId === "B" || sample.classId === "C" ? "exemplar" : "incoming"} compact /> : <small>同一张图依序传入教师网络</small>}
        </section>
        <section className="p9-route-node p9-route-node--teacher" id="old_teacher" data-canonical-id="old_teacher">
          <span className="p9-eyebrow">Θ_before · 旧教师</span>
          <strong>旧类别节点</strong>
          <div className="p9-teacher-nodes">
            {OLD_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph}<small>g{CLASS_VISUALS[classId].index}</small></span>)}
          </div>
          <small>冻结快照来源 · 参数尚未更新</small>
        </section>
        <section className="p9-route-node p9-route-node--q" id="response_snapshot_Q" data-canonical-id="response_snapshot_Q">
          <span className="p9-eyebrow">目标矩阵</span>
          <strong>Q · 30 × 3</strong>
          <div className="p9-q-table" role="table" aria-label="Q 响应快照示例行">
            <div className="p9-q-header" role="row"><b role="columnheader">sample ID</b><span role="columnheader">g₁</span><span role="columnheader">g₂</span><span role="columnheader">g₃</span></div>
            {visibleRows.map((entry) => <QTableRow key={entry.id} sample={entry} active={entry.id === sample?.id} cellProgress={entry.id === sample?.id ? cells : []} />)}
            {notShownCount > 0 ? <div className="p9-q-more" role="row">+ {notShownCount} 行已写入各自的 ID</div> : null}
          </div>
          <small className="p9-q-freeze">{scene.qRowsWritten === 30 ? "30 行完成 · Q 保持冻结" : "每个 sample ID 对应一行"}</small>
        </section>
        <div className="p9-q-route-line" aria-hidden="true"><i /></div>
        {sample ? <span className="p9-q-flight" style={flightStyle} data-sample-id={sample.id} aria-hidden="true"><b style={classAccent(sample.classId)}>{CLASS_VISUALS[sample.classId].glyph}</b><small>{sample.id}</small></span> : null}
      </div>
      <div className="p9-q-identity">
        <span>当前流动 ID</span><strong>{sample?.id ?? (scene.qRowsWritten === 30 ? "30 个 ID 已完成" : "等待下一张样本")}</strong>
        <i aria-hidden="true">=</i><span>当前 Q 行</span><strong data-q-current-id={sample?.id ?? ""}>{sample?.id ?? "Q: 30 × 3"}</strong>
      </div>
      <p className="p9-q-explanation">旧样本和新样本都读取 Θ_before 的三个旧输出；Q 的行身份与 D 中的 sample ID 一一对应。</p>
    </div>
  );
}

function InheritedScene() {
  return (
    <div className="p9-inherited-scene" data-clip="inherit-state">
      <span className="p9-state-equation">Sᵣ = Θ_before + P_before</span>
      <h3>这一轮开始前，系统只保留两类持久对象</h3>
      <div className="p9-inherited-objects"><span>Θ_before<small>共享模型参数</small></span><i aria-hidden="true">+</i><span>P_before<small>12 张有序原始图片</small></span></div>
      <p>还没有新批次、D 或 Q。接下来让新类别到达，并保留旧图片的原始身份。</p>
    </div>
  );
}

function ArrivalScene() {
  return (
    <div className="p9-arrival-scene" data-clip="receive-new-batch">
      <span className="p9-state-equation">X_new · 18 张完整新图</span>
      <h3>三类完整图像进入本轮</h3>
      <IncomingBatch />
      <p>每类六张。后续将它们与旧记忆的训练副本放进同一个 D。</p>
    </div>
  );
}

function Guidance({ scene }: { scene: RuntimeScene }) {
  const chapter = RUNTIME_CHAPTERS[scene.chapterIndex];
  const result = scene.clip.id === "merge-training-set"
    ? (scene.dSampleCount ?? 0) + " / 30 个样本已汇入 D"
    : scene.chapterId === "snapshot-q"
      ? scene.qRowsWritten + " / 30 行 Q 已写入"
      : scene.chapterId === "inherited"
        ? "Θ_before 与 P_before 保持固定"
        : "X_new = 18 张图像已到达";
  return (
    <aside className="p9-guidance" aria-labelledby="p9-guidance-title">
      <span className="p9-eyebrow">当前步骤 · 第 {scene.chapterIndex + 1} 章 / 8</span>
      <h2 id="p9-guidance-title">{chapter.question}</h2>
      <div className="p9-guide-block"><small>已知</small><p>{scene.chapterId === "inherited" ? "上一轮留下 Θ_before 和 P_before。" : "旧记忆原件仍在固定位置，D/Q 都是本轮临时对象。"}</p></div>
      <div className="p9-guide-block p9-guide-block--current"><small>正在发生</small><p>{scene.clip.narrative}</p></div>
      <div className="p9-result-card"><small>当前结果</small><strong>{result}</strong></div>
      <p className="p9-guide-next">{scene.chapterId === "snapshot-q" ? "Q 写完后会冻结，训练阶段再读取它。" : "继续播放或逐片段前进，可以暂停查看中间态。"}</p>
    </aside>
  );
}

function ObjectStatusBand({ scene }: { scene: RuntimeScene }) {
  const objectIds: readonly RuntimeObjectId[] = ["X_new", "D", "Q", "targets", "loss", "prototypes", "query", "prediction"];
  const visible = objectIds.filter((id) => scene.objectStatus[id] !== "pending");
  return (
    <section className="p9-object-band" aria-label="持久与临时对象状态">
      <div className="p9-object-band__persistent"><span className="p9-eyebrow">持久</span><b>Θ_{scene.theta}</b><i aria-hidden="true">+</i><b>P_before · 12 / 12</b></div>
      <div className="p9-object-band__temporary">
        <span className="p9-eyebrow">本轮暂存与释放</span>
        {visible.length === 0 ? <span className="p9-empty-state">尚未创建临时对象</span> : visible.map((id) => {
          const label = id === "X_new" ? "X_new · 18 张" : id === "D" ? "D · " + (scene.dSampleCount ?? 0) + " / 30" : id === "Q" ? "Q · " + scene.qRowsWritten + " / 30 行" : id;
          const status = scene.objectStatus[id];
          return <span key={id} className={"p9-object-pill p9-object-pill--" + status} data-object-id={id} data-status={status}>{label}{status === "released" ? " · 已释放" : ""}</span>;
        })}
      </div>
    </section>
  );
}

export function PageNine({ onExit }: { onExit: () => void }) {
  const reducedMotion = useReducedMotion();
  const timeline = useAnimationTimeline({ clips: FIRST_SLICE_CLIPS, reducedMotion, autoPlay: false });
  const pause = timeline.controls.pause;
  const scene = runtimeSceneAt(timeline.state.clipIndex, timeline.state.progress);
  const replayBoundary = useRef<RuntimeChapterId | null>(null);
  const progressPercent = ((timeline.state.clipIndex + timeline.state.progress) / FIRST_SLICE_CLIPS.length) * 100;
  useEffect(() => {
    if (replayBoundary.current && replayBoundary.current !== scene.chapterId) {
      replayBoundary.current = null;
      pause();
    }
  }, [scene.chapterId, pause]);

  const currentChapter = RUNTIME_CHAPTERS[scene.chapterIndex];
  const isMerge = scene.clip.id === "merge-training-set";
  const isSnapshot = scene.chapterId === "snapshot-q";
  const handleChapterSelect = (chapterId: RuntimeChapterId) => {
    replayBoundary.current = null;
    timeline.controls.goToClip(RUNTIME_CHAPTER_FIRST_CLIP[chapterId], { autoPlay: false });
  };
  const replayChapter = () => {
    replayBoundary.current = currentChapter.id;
    timeline.controls.goToClip(RUNTIME_CHAPTER_FIRST_CLIP[currentChapter.id]);
  };

  return (
    <article className="p9-page" id="runtime_workbench" data-canonical-id="runtime_workbench" data-clip={scene.clip.id} data-chapter={scene.chapterId} data-progress={scene.progress.toFixed(2)} aria-labelledby="page-nine-title">
      <header className="p9-header">
        <div className="p9-title-block">
          <div className="p9-kicker"><span>第 9 页</span><i /> iCaRL · 一次增量更新</div>
          <h1 id="page-nine-title">从当前状态到下一轮就绪</h1>
          <p>前面各页已解释选样、Replay、Q、BCE 和 Prototype。现在只追踪新类别怎样把 Θ_before + P_before 变成下一轮可用状态。</p>
        </div>
        <div className="p9-controls" aria-label="全流程播放控制">
          <button type="button" className="p9-return" onClick={onExit}>← 第 8 页 · 实验与边界</button>
          <div className="p9-transport">
            <button type="button" onClick={timeline.controls.stepBack} disabled={!timeline.state.hasPrevious} aria-label="上一个片段">‹</button>
            <button type="button" className="p9-play" onClick={timeline.controls.toggle} aria-label={reducedMotion ? "前进一步" : timeline.state.status === "playing" ? "暂停动画" : "播放完整过程"}>{reducedMotion ? "→" : timeline.state.status === "playing" ? "Ⅱ" : "▶"}</button>
            {!reducedMotion ? <button type="button" onClick={replayChapter} aria-label="重播当前章节" title="重播当前章节">↺</button> : null}
            <button type="button" onClick={timeline.controls.stepForward} disabled={!timeline.state.hasNext} aria-label="下一个片段">›</button>
          </div>
          <div className="p9-playback-meter" role="progressbar" aria-label="全流程进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
            <i style={{ width: progressPercent + "%" }} />
          </div>
          <b className="p9-playback-count">片段 {String(timeline.state.clipIndex + 1).padStart(2, "0")} / {FIRST_SLICE_CLIPS.length}</b>
        </div>
      </header>

      <nav className="p9-chapters" aria-label="P9 八个章节">
        {RUNTIME_CHAPTERS.map((chapter, index) => {
          const disabled = futureChapterIds.has(chapter.id);
          const current = chapter.id === scene.chapterId;
          return (
            <button key={chapter.id} type="button" className={"p9-chapter" + (current ? " is-current" : "") + (index < scene.chapterIndex ? " is-complete" : "")} aria-current={current ? "step" : undefined} disabled={disabled} title={disabled ? "后续章节将在本轮余下切片中接入" : chapter.question} onClick={() => handleChapterSelect(chapter.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{chapter.title}</b>
            </button>
          );
        })}
      </nav>

      <div className="p9-main-grid">
        <PersistentState scene={scene} />

        <section className="p9-workbench" aria-label="P9 连续状态工作台">
          <header className="p9-workbench-heading">
            <div><span className="p9-eyebrow">中央工作台 · 当前焦点</span><h2>{scene.clip.narrative}</h2></div>
            <span className="p9-clip-progress">{Math.round(scene.progress * 100)}%</span>
          </header>
          <div className="p9-workbench-canvas" data-focus={scene.focus}>
            {scene.chapterId === "inherited" ? <InheritedScene /> : null}
            {scene.clip.id === "receive-new-batch" ? <ArrivalScene /> : null}
            {isMerge ? <MergeScene scene={scene} /> : null}
            {isSnapshot ? <SnapshotScene scene={scene} /> : null}
          </div>
          <footer className="p9-workbench-controls">
            <button type="button" onClick={timeline.controls.stepBack} disabled={!timeline.state.hasPrevious}>上一个片段</button>
            <span>{scene.clip.narrative}</span>
            <button type="button" onClick={timeline.controls.stepForward} disabled={!timeline.state.hasNext}>下一个片段</button>
          </footer>
        </section>

        <Guidance scene={scene} />
      </div>

      <ObjectStatusBand scene={scene} />
    </article>
  );
}
