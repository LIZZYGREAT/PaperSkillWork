import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
import {
  ALL_CLASS_IDS,
  CLASS_VISUALS,
  INCOMING_CLASS_IDS,
  NEXT_CLASS_COUNT,
  OLD_CLASS_IDS,
  TRAINING_SET_SIZE,
  samplesForClass,
  type ClassId,
  type Sample,
} from "../data/icarl-runtime";
import {
  INCREMENTAL_DATA_VALIDATION,
  INCREMENTAL_STAGE_DATA,
  teacherSnapshotFor,
} from "../data/incremental-training";

const steps: readonly GuidedStep[] = [
  { title: "Exemplars 怎样从预测走进下一轮训练？", short: "预测 → Replay" },
  { title: "旧记忆和新类数据怎样合成 D？", short: "构造 D" },
  { title: "为什么在改参数前生成 Q？", short: "记录 Q" },
  { title: "Q 为 D 中哪些样本保存响应？", short: "检查快照" },
  { title: "D、Q 与六节点 Student 怎样就绪？", short: "准备训练" },
];

const guidance = [
  "Exemplars 已经帮助我们构造类别 Prototype、支持未来预测。但新类别到来后，我们还要继续更新特征提取器。既然保存了旧类真实图片，能不能让它们参与这一轮训练，帮助模型保留旧类知识？这就是 Replay。",
  "本轮一次到来三个新类。把旧记忆中的 12 张图与新类的 18 张完整数据合入 D；读取旧图不会消耗持久记忆 P。",
  "参数更新会改变网络响应。先让更新前的三节点旧模型读取 D，并把每张图在 g₁–g₃ 上的输出记入同一行 Q。这个 Q 行以后保持固定。",
  "Q 有 30 行，每行对应 D 中一个真实样本；三列对应三个旧节点。表格默认收起，只在需要核验时展开具体响应值。",
  "训练图片 D 和旧节点响应 Q 都准备好了。下一页，我们会把每张图自己的 Q 行与真实类别标签合成六维 Target，再看这些目标如何推动参数更新。",
] as const;

const oldExemplars = INCREMENTAL_STAGE_DATA.oldExemplars;
const incomingSamples = INCREMENTAL_STAGE_DATA.incomingSamples;
const trainingSamples = INCREMENTAL_STAGE_DATA.trainingSamples;
const initialOldSample = oldExemplars.find((sample) => sample.classId === "B") ?? oldExemplars[0];
const initialNewSample = incomingSamples.find((sample) => sample.classId === "E") ?? incomingSamples[0];

function accent(classId: ClassId) {
  return { "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

function ClassBucket({ classId, samples, origin }: { classId: ClassId; samples: readonly Sample[]; origin: "old" | "new" }) {
  const visual = CLASS_VISUALS[classId];
  return <section className={`p5-class-bucket p5-class-bucket--${origin}`} style={accent(classId)}>
    <header><span className="p5-class-glyph">{visual.glyph}</span><b>{visual.displayLabel}</b><small>{samples.length} 张</small></header>
    <div className="p5-class-samples" aria-label={`${visual.displayLabel} ${samples.length} 张图片`}>
      {samples.map((sample) => <i className="p5-image-token" key={sample.id} aria-hidden="true" />)}
    </div>
  </section>;
}

function Nodes({ classIds, kind }: { classIds: readonly ClassId[]; kind: "old" | "student" }) {
  return <div className={`p5-nodes p5-nodes--${kind}`} aria-label={kind === "old" ? "生成 Q 的旧模型三个输出节点" : "扩展后的六节点 Student 输出层"}>
    {classIds.map((classId) => <span key={classId} style={accent(classId)} data-node-id={`g${CLASS_VISUALS[classId].index}`}>
      <i aria-hidden="true">{CLASS_VISUALS[classId].glyph}</i><b>{CLASS_VISUALS[classId].outputNodeLabel}</b>
    </span>)}
  </div>;
}

function SnapshotDetails({ selectedSample }: { selectedSample: Sample }) {
  return <details className="p5-q-details">
    <summary>查看快照明细 · 30 行 × 3 列</summary>
    <div className="p5-q-table-scroll" role="region" aria-label="D 中每张图片对应的旧节点快照 Q" tabIndex={0}>
      <table className="p5-q-table">
        <thead><tr><th>样本 xᵢ</th><th>真实类别 yᵢ</th>{OLD_CLASS_IDS.map((classId) => <th key={classId}>{CLASS_VISUALS[classId].outputNodeLabel}</th>)}</tr></thead>
        <tbody>{trainingSamples.map((sample) => {
          const row = teacherSnapshotFor(sample);
          return <tr key={sample.id} className={sample.id === selectedSample.id ? "is-selected" : ""}>
            <th>{sample.id}</th><td>{CLASS_VISUALS[sample.classId].displayLabel}</td>{row.map((value, index) => <td key={`${sample.id}-${index}`}>{value.toFixed(3)}</td>)}
          </tr>;
        })}</tbody>
      </table>
    </div>
    <p>固定的演示用旧节点权重对这 30 张样本确定性地产生 Q；它不是论文 checkpoint 或实验观测值。</p>
  </details>;
}

export function PageFive({ onContinue }: { onContinue?: () => void }) {
  const [stage, setStage] = useState(0);
  const [sampleId, setSampleId] = useState(initialNewSample.id);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "complete">("idle");
  const [stageRailOpen, setStageRailOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const selectedSample = trainingSamples.find((sample) => sample.id === sampleId) ?? initialNewSample;
  const selectedIsOld = OLD_CLASS_IDS.includes(selectedSample.classId as (typeof OLD_CLASS_IDS)[number]);
  const selectedSnapshot = teacherSnapshotFor(selectedSample);
  const selectedRowIndex = trainingSamples.findIndex((sample) => sample.id === selectedSample.id);
  const filledRows = stage > 2 ? TRAINING_SET_SIZE : stage === 2 ? Math.round(progress * TRAINING_SET_SIZE) : 0;
  const selectedRowFilled = stage > 2 || (stage === 2 && filledRows > selectedRowIndex);
  const flowStyle = { "--p5-travel": `${progress * 88}px`, "--p5-fill": `${stage > 1 ? 100 : progress * 100}%` } as CSSProperties;

  useEffect(() => {
    if (status !== "playing") return;
    if (reducedMotion) {
      progressRef.current = 1;
      setProgress(1);
      setStatus("complete");
      return;
    }
    const duration = stage === 2 ? 2100 : 1450;
    const start = performance.now() - progressRef.current * duration;
    let frame = 0;
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - start) / duration);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setStatus("complete");
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion, stage, status]);

  function setStageAndPlay(nextStage: number) {
    const next = Math.max(0, Math.min(steps.length - 1, nextStage));
    setStageRailOpen(false);
    setStage(next);
    progressRef.current = 0;
    setProgress(0);
    setStatus("playing");
  }

  function togglePlayback() {
    if (status === "playing") setStatus("paused");
    else {
      if (status === "complete") {
        progressRef.current = 0;
        setProgress(0);
      }
      setStatus("playing");
    }
  }

  function replayStage() {
    progressRef.current = 0;
    setProgress(0);
    setStatus("playing");
  }

  function selectSample(sample: Sample) {
    setStatus("paused");
    progressRef.current = 1;
    setProgress(1);
    setSampleId(sample.id);
  }

  return <article className="tutorial-page icarl-page icarl-page--p5" data-data-check={INCREMENTAL_DATA_VALIDATION ? "pass" : "fail"}>
    <header className="page-heading icarl-page__heading p5-heading">
      <div className="icarl-page__eyebrow"><span>PAGE 05</span><i /> REPLAY · OLD RESPONSES Q</div>
      <h1>保存的 Exemplars 怎样继续参与学习？</h1>
      <p>新类别还会到来。让旧记忆和新类图片共同形成训练集，并在参数改变前保存旧节点响应。</p>
    </header>

    <section className="p5-workbench" data-stage={stage} data-playing={status === "playing"} style={flowStyle} aria-label="Replay、训练集 D 与旧响应快照 Q 连续工作台">
      <header className="p5-workbench__guide">
        <div><span className="eyebrow">STAGE {stage + 1} / {steps.length}</span><h2>{steps[stage].title}</h2><p aria-live="polite">{guidance[stage]}</p></div>
        <span className={`p5-guide-status ${stage >= 3 ? "is-locked" : ""}`}>{stage >= 3 ? "Q 已固定" : stage === 2 ? status === "complete" ? "Q 已记录" : "正在记录 Q" : "Replay → D"}</span>
      </header>

      <details className="p5-stage-rail" open={stageRailOpen} onToggle={(event) => setStageRailOpen(event.currentTarget.open)}>
        <summary>本页步骤 · {stage + 1}/{steps.length}</summary>
        <GuidedStepControls steps={steps} current={stage} onChange={setStageAndPlay} label="Page 5 Replay、D 与 Q 教学步骤" />
      </details>

      <div className="p5-flow-board">
        <section className={`p5-source-bank ${stage >= 2 ? "is-summary" : ""}`} aria-label="持久旧记忆与新类完整批次">
          <div className="p5-bank-heading"><span className="eyebrow">输入来源</span><b>P + X<sub>new</sub></b></div>
          <div className="p5-source-section p5-source-section--old"><header><b>旧类 Exemplars P</b><strong>{oldExemplars.length} 张</strong></header>
            <div className="p5-class-list">{OLD_CLASS_IDS.map((classId) => <ClassBucket key={classId} classId={classId} samples={oldExemplars.filter((sample) => sample.classId === classId)} origin="old" />)}</div>
            <small className="p5-source-retained">P 保持原样 · Replay 读取副本</small>
          </div>
          <div className="p5-source-section p5-source-section--new"><header><b>新类完整数据 X<sub>new</sub></b><strong>{incomingSamples.length} 张</strong></header>
            <div className="p5-class-list">{INCOMING_CLASS_IDS.map((classId) => <ClassBucket key={classId} classId={classId} samples={samplesForClass(classId)} origin="new" />)}</div>
          </div>
          <span className="p5-flight-token p5-flight-token--old" aria-hidden="true">12 张副本</span>
          <span className="p5-flight-token p5-flight-token--new" aria-hidden="true">18 张图片</span>
        </section>

        <section className={`p5-object p5-object--dataset ${stage >= 1 ? "is-ready" : ""} ${stage >= 2 ? "is-compact" : ""}`} aria-label="训练集 D">
          <span className="eyebrow">本轮训练集</span><b className="p5-object-symbol">D</b>
          <div className="p5-d-equation"><span>12 张旧记忆</span><i>+</i><span>18 张新图</span></div>
          <strong>{stage >= 2 || (stage === 1 && progress >= 1) ? `${TRAINING_SET_SIZE} 张已合入` : stage === 1 ? `${Math.round(progress * TRAINING_SET_SIZE)} / ${TRAINING_SET_SIZE} 张` : "等待合入"}</strong>
          <div className="p5-d-bar" aria-label={`${stage >= 1 ? TRAINING_SET_SIZE : 0} 个训练样本已就绪`}><i style={{ width: stage >= 2 ? "100%" : stage === 1 ? `${progress * 100}%` : "0%" }} /></div>
          <small>所有样本逐一读取；训练后 D 释放</small>
        </section>

        <section className="p5-model-stack" aria-label="生成 Q 的旧模型和待更新 Student">
          <div className="p5-model-card p5-model-card--teacher">
            <span className="eyebrow">更新前的旧模型 · Q 来源</span><b>共享特征 + 三个旧节点</b>
            <div className="p5-model-input"><span className="p5-selected-glyph" style={accent(selectedSample.classId)}>{CLASS_VISUALS[selectedSample.classId].glyph}</span><span><small>{selectedIsOld ? "P 中旧 exemplar" : "X_new 中新类图片"}</small><strong>{selectedSample.id} · {CLASS_VISUALS[selectedSample.classId].displayLabel}</strong></span></div>
            <div className="p5-sample-picker" role="group" aria-label="选择示范快照样本">
              <button type="button" className={selectedIsOld ? "is-selected" : ""} aria-pressed={selectedIsOld} onClick={() => selectSample(initialOldSample)}>旧图 · {initialOldSample.id}</button>
              <button type="button" className={!selectedIsOld ? "is-selected" : ""} aria-pressed={!selectedIsOld} onClick={() => selectSample(initialNewSample)}>新图 · {initialNewSample.id}</button>
            </div>
            <Nodes classIds={OLD_CLASS_IDS} kind="old" />
            <small className="p5-model-caption">更新前旧模型的三个响应会写入右侧 Q 的对应行。</small>
          </div>
          <div className={`p5-model-card p5-model-card--student ${stage >= 4 ? "is-expanded" : ""}`} aria-label="本轮待训练六节点 Student">
            <span className="eyebrow">Q 记录后 · 本轮训练模型</span><b>同一共享网络 · 六节点输出头</b>
            <Nodes classIds={ALL_CLASS_IDS} kind="student" />
            <small>g₄–g₆ 在快照 Q 后加入；它们不生成 Q。</small>
          </div>
        </section>

        <section className={`p5-object p5-object--snapshot ${stage >= 2 ? "is-filling" : ""}`} aria-label="更新前响应快照 Q">
          <header><div><span className="eyebrow">更新前旧节点响应</span><b className="p5-object-symbol">Q</b></div><span className={`p5-lock ${stage >= 3 ? "is-locked" : ""}`}>{stage >= 3 ? "已固定" : stage === 2 ? "记录中" : "等待记录"}</span></header>
          <strong>{stage >= 3 ? "30 × 3" : stage === 2 ? `${filledRows} / 30 行` : "—"}</strong>
          <small>每行一张 D 样本 · 三列旧节点</small>
          <div className="p5-q-preview" aria-label={`${filledRows} 行已记录，共 ${TRAINING_SET_SIZE} 行；每行三列旧节点响应`}>
            {trainingSamples.map((sample, index) => <span key={sample.id} title={`${sample.id} · Q 第 ${index + 1} 行`} className={`${index < filledRows ? "is-filled" : ""} ${sample.id === selectedSample.id ? "is-selected" : ""}`} style={{ "--row-delay": `${index * 16}ms` } as CSSProperties}>
              <i /><i /><i />
            </span>)}
          </div>
          <div className="p5-q-column-labels"><span>样本行</span><b>q₁</b><b>q₂</b><b>q₃</b></div>
          <div className={`p5-q-sample-row ${selectedRowFilled ? "is-filled" : ""}`} aria-label={`${selectedSample.id} 的 Q 行${selectedRowFilled ? "已记录" : "尚未写入"}`}><span>{selectedSample.id}</span>{selectedSnapshot.map((value, index) => <b key={`${selectedSample.id}-${index}`}>{selectedRowFilled ? value.toFixed(2) : "·"}</b>)}</div>
          <SnapshotDetails selectedSample={selectedSample} />
        </section>
      </div>

      <div className="p5-order-strip" aria-label="增量更新对象顺序">
        <span className={stage === 0 ? "is-current" : stage > 0 ? "is-complete" : ""}>P + X<sub>new</sub></span><i>→</i><span className={stage === 1 ? "is-current" : stage > 1 ? "is-complete" : ""}>D · 30</span><i>→</i><span className={stage === 2 ? "is-current" : stage > 2 ? "is-complete" : ""}>Q · 30×3</span><i>→</i><span className={stage === 4 ? "is-current" : stage > 4 ? "is-complete" : ""}>Student · 6</span>
        <small>旧类每个 qᵢ 与图片身份一一对应；Q 不随 Student 改变。</small>
      </div>

      <footer className="p5-controls" aria-label="P5 动画控制">
        <button type="button" className="icarl-button icarl-button--quiet" onClick={() => setStageAndPlay(stage - 1)} disabled={stage === 0}>上一步</button>
        <div className="p5-control-main">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={togglePlayback} aria-label={status === "playing" ? "暂停当前动画" : "继续当前动画"}>{status === "playing" ? "Ⅱ 暂停" : "▶ 继续"}</button>
          <button type="button" className="icarl-button icarl-button--quiet" onClick={replayStage}>↺ 重播本幕</button>
          <span>{status === "complete" ? "本幕完成" : status === "paused" ? "已暂停" : `${Math.round(progress * 100)}%`}</span>
        </div>
        {stage < steps.length - 1
          ? <button type="button" className="icarl-button icarl-button--primary" onClick={() => setStageAndPlay(stage + 1)}>下一幕 <b aria-hidden="true">→</b></button>
          : <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue} disabled={!onContinue}>进入第 6 页 · 构造 Target <b aria-hidden="true">→</b></button>}
      </footer>
    </section>
  </article>;
}
