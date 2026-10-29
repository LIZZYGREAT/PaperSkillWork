import { useMemo, useState } from "react";
import SceneTransport, { useSceneTimeline } from "./review/SceneTransport";
import {
  runTraining,
  trainingSceneAt,
  WORKBENCH_CLIPS,
  TRAIN_PHASES,
  predict,
  CONFIG,
  type Mode,
  type TrainingRecord,
} from "./training-model";
import { curve, mix, windowAt } from "./review/lifecycle-model";
import { MotionPath, NetworkGlyph, SampleGlyph, ScoreGlyph, fmt, vectorText } from "./LearningGlyphs";
import { MODEL_CLASSES } from "../data/model-classes";
import "./learning-scenes.css";
import "./workbench.css";

const SLOT_X = 66;
const slotY = (slot: number) => 420 + slot * 86;
const CANDIDATE_HOME = { x: 414, y: 416 };
const SELECTOR = { x: 736, y: 412 };
const EXIT = { x: 1000, y: 470 };

function StoredRecord({
  record,
  x,
  y,
  opacity = 1,
  mode,
  readD = false,
  readY = false,
}: {
  record: TrainingRecord;
  x: number;
  y: number;
  opacity?: number;
  mode: Mode;
  readD?: boolean;
  readY?: boolean;
}) {
  return (
    <g
      transform={"translate(" + x + " " + y + ")"}
      opacity={opacity}
      data-training-record={record.id}
      data-target={record.z.join(",")}
      data-generated-by={record.origin}
      data-read-d={readD}
      data-read-y={readY}
    >
      <rect width="270" height="80" rx="12" className="wb-record-card" />
      <SampleGlyph x={10} y={17} size={44} model={record.model} id={record.id} />
      <text x="64" y="22" className="wb-record-title">
        {record.id} · 冻结 z
      </text>
      <text x="64" y="45" className="wb-record-vector">
        {vectorText(record.z, 2)}
      </text>
      <text x="64" y="67" className="wb-record-note">
        {"z @" + record.origin + (mode === "DER++" ? " · y=" + MODEL_CLASSES[record.y!] : " · 无 y")}
      </text>
      {readD && (
        <g className="wb-read-badge wb-read-dark">
          <rect x="198" y="8" width="32" height="20" rx="6" />
          <text x="214" y="23" textAnchor="middle">Rd</text>
        </g>
      )}
      {readY && (
        <g className="wb-read-badge wb-read-label">
          <rect x={readD ? 232 : 198} y="8" width="32" height="20" rx="6" />
          <text x={readD ? 248 : 214} y="23" textAnchor="middle">Ry</text>
        </g>
      )}
    </g>
  );
}

function StepDetails({ step }: { step: ReturnType<typeof runTraining>[number] }) {
  return (
    <details className="local-detail" data-numeric-details>
      <summary>展开本轮可复算状态、前向视图与联合梯度</summary>
      <p>
        这是 W5 的二维线性合成模型 h<sub>W</sub>(u)=Wu；无 bias/momentum。η={CONFIG.eta}，α={CONFIG.alpha}，β={CONFIG.beta}（仅 DER++）。
        图中类别标识用于稳定身份，u 不是从真实图片计算的特征。
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>来源</th><th>原始 u / 标签</th><th>增强视图</th><th>更新前输出</th><th>目标</th></tr>
          </thead>
          <tbody>
            <tr>
              <th>当前 {step.input.id}</th>
              <td>{vectorText(step.input.u, 1)} / {MODEL_CLASSES[step.input.y]}</td>
              <td>{vectorText(step.currentView, 1)}</td>
              <td>{vectorText(step.currentLogits, 6)}</td>
              <td>真实 y；候选 z 复制此输出</td>
            </tr>
            {step.rd && (
              <tr>
                <th>Rd {step.rd.id}</th>
                <td>{vectorText(step.rd.u, 1)}</td>
                <td>{vectorText(step.replayView!, 1)}</td>
                <td>{vectorText(step.replayLogits!, 6)}</td>
                <td>固定 z={vectorText(step.rd.z, 6)}</td>
              </tr>
            )}
            {step.ry && (
              <tr>
                <th>Ry {step.ry.id}</th>
                <td>{vectorText(step.ry.u, 1)} / {MODEL_CLASSES[step.ry.y!]}</td>
                <td>{vectorText(step.labelView!, 1)}</td>
                <td>{vectorText(step.labelLogits!, 6)}</td>
                <td>真实 {MODEL_CLASSES[step.ry.y!]}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="wb-matrices">
        {[
          ["进入 W", step.before.W],
          ["联合梯度", step.gradients.total],
          ["更新后 W", step.after.W],
        ].map(([title, matrix]) => (
          <div key={String(title)}>
            <strong>{String(title)}</strong>
            <pre>{(matrix as readonly (readonly number[])[]).map(row => row.map(v => fmt(v, 9)).join("   ")).join("\n")}</pre>
          </div>
        ))}
      </div>
      <p>
        总损失 {fmt(step.losses.total, 9)} = 当前 {fmt(step.losses.current, 9)}
        {" + α·"}{fmt(step.losses.dark, 9)}
        {step.mode === "DER++" ? " + β·" + fmt(step.losses.label, 9) : ""}。
        各项都使用同一个更新前 W；梯度求和后只更新一次。
      </p>
    </details>
  );
}

function outcomeLabel(step: ReturnType<typeof runTraining>[number]) {
  if (step.insertion.decision === "append") return "追加 " + step.input.id;
  if (step.insertion.decision === "replace") return "替换 " + step.insertion.evicted?.id + " → " + step.input.id;
  return "拒收 " + step.input.id + "；N 仍递增";
}

function StateHandoff({
  steps,
  round,
  prediction,
  timeline,
}: {
  steps: ReturnType<typeof runTraining>;
  round: number;
  prediction: boolean;
  timeline: ReturnType<typeof useSceneTimeline>;
}) {
  return (
    <div className="wb-handoff" aria-label="同一训练状态在四轮间传递">
      <div className="wb-handoff-intro">
        <span>连续状态</span>
        <p>初态 <b>θ₀</b> · <b>M=∅</b> · <b>N=0</b></p>
      </div>
      <ol className="wb-handoff-rounds">
        {steps.map((step, index) => {
          const next = step.after;
          const active = !prediction && round === index;
          return (
            <li
              key={step.input.id}
              data-handoff-round={index + 1}
              data-active={active}
              data-updates={next.updates}
              data-seen={next.N}
              data-memory={next.M.map(record => record.id).join(",")}
              data-weights={JSON.stringify(next.W)}
            >
              <button
                type="button"
                data-round-select={index}
                aria-pressed={active}
                onClick={() => timeline.start(index * TRAIN_PHASES.length)}
              >
                <span className="wb-handoff-kicker">0{index + 1} · {step.input.id}</span>
                <strong>{outcomeLabel(step)}</strong>
                <span className="wb-handoff-state">θ{next.updates} · N={next.N}</span>
                <span className="wb-handoff-memory">M = {next.M.map(record => record.id).join("，") || "∅"}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className={"wb-query-node" + (prediction ? " is-active" : "")}
        data-predict
        aria-pressed={prediction}
        onClick={() => timeline.start(20)}
      >
        <span>之后 · 只读</span>
        <strong>查询 θ₄</strong>
        <small>M、N 不变</small>
      </button>
    </div>
  );
}

export default function Workbench() {
  const [mode, setMode] = useState<Mode>("DER");
  const steps = useMemo(() => runTraining(mode), [mode]);
  const timeline = useSceneTimeline(WORKBENCH_CLIPS);
  const { clipIndex: c, progress: p } = timeline.state;
  const { step, round, phase, prediction, state } = trainingSceneAt(steps, c, p);
  const result = predict(steps[3].after);
  const selectedSlot = step.insertion.slot;
  const decision = step.insertion.decision;
  const currentDone = prediction ? windowAt(p, 0.1, 0.8) : phase > 1 ? 1 : phase === 1 ? windowAt(p, 0.08, 0.84) : 0;
  const replayProgress = !prediction && phase === 0 ? windowAt(p, 0.08, 0.82) : 0;
  const lossProgress = prediction ? 0 : phase > 2 ? 1 : phase === 2 ? windowAt(p, 0.08, 0.84) : 0;
  const updateProgress = !prediction && phase === 3 ? windowAt(p, 0.18, 0.8) : 0;
  const freezeProgress = !prediction && phase === 1 ? windowAt(p, 0.5, 0.84) : 0;
  const retireProgress = phase === 4 && decision === "replace" ? windowAt(p, 0.08, 0.36) : 0;
  const candidateVisible = !prediction && (phase > 1 || (phase === 1 && p > 0.48) || phase === 4);
  const candidateStart = decision === "replace" ? 0.39 : 0.1;
  const candidateGateEnd = decision === "replace" ? 0.54 : 0.28;
  const candidateSlotStart = decision === "replace" ? 0.56 : 0.3;
  const candidateGateProgress = phase === 4 ? windowAt(p, candidateStart, candidateGateEnd) : 0;
  const candidatePlaceProgress = phase === 4 ? windowAt(p, candidateSlotStart, 0.88) : 0;
  const candidateExitProgress = phase === 4 && decision === "reject" ? windowAt(p, 0.32, 0.84) : 0;
  const candidateAt = (() => {
    if (!candidateVisible || phase !== 4) return CANDIDATE_HOME;
    if (p >= 0.88 && decision !== "reject" && selectedSlot !== null) return { x: SLOT_X, y: slotY(selectedSlot) };
    if (decision === "reject") {
      if (p < 0.32) return { x: mix(CANDIDATE_HOME.x, SELECTOR.x, candidateGateProgress), y: CANDIDATE_HOME.y };
      return curve(candidateExitProgress, { x: SELECTOR.x, y: CANDIDATE_HOME.y }, { x: 830, y: 350 }, { x: 930, y: 355 }, EXIT);
    }
    if (p < candidateGateEnd) return { x: mix(CANDIDATE_HOME.x, SELECTOR.x, candidateGateProgress), y: CANDIDATE_HOME.y };
    if (candidatePlaceProgress < 0.5) {
      return curve(candidatePlaceProgress * 2, { x: SELECTOR.x, y: CANDIDATE_HOME.y }, { x: 790, y: 344 }, { x: 390, y: 344 }, { x: 390, y: slotY(selectedSlot ?? 0) });
    }
    return { x: mix(390, SLOT_X, (candidatePlaceProgress - 0.5) * 2), y: slotY(selectedSlot ?? 0) };
  })();
  const movingRecordAt = (slot: number) => {
    if (phase === 4 && step.insertion.evicted?.id === step.before.M[slot]?.id) {
      return curve(retireProgress, { x: SLOT_X, y: slotY(slot) }, { x: 230, y: 350 }, { x: 850, y: 350 }, { x: EXIT.x, y: EXIT.y + 42 });
    }
    return { x: SLOT_X, y: slotY(slot) };
  };
  const activePredictionLabel = MODEL_CLASSES[result.label];
  const phaseLabel = prediction ? "只读预测" : TRAIN_PHASES[phase];
  const readNote = prediction
    ? "只读预测 · 本步不读取 M"
    : step.rd
    ? "写入前读取 · Rd " + step.rd.id + (step.ry ? " / Ry " + step.ry.id : "")
    : "空池 · 没有 Rd" + (mode === "DER++" ? " / Ry" : "") + " 回放";
  const narration = prediction
    ? "训练已结束。查询 u=(1,0.5) 只经 θ₄ 产生 logits 和 argmax；不读取 M、不采样回放、不计算训练损失，也不更新 θ 或 N。"
    : phase === 0
      ? readNote
      : phase === 1
        ? step.input.id + " 经当前 θ 前向；更新前 logits 被复制为候选 z，之后不会随 θ 改写。"
        : phase === 2
          ? step.rd
            ? "Rd " + step.rd.id + " 的当前 a 与冻结 z 匹配" + (step.ry ? "；Ry " + step.ry.id + " 另读真实标签。" : "。") + "读取都发生在本轮入池前。"
            : "记忆为空，只有当前标签监督；没有历史匹配项。"
          : phase === 3
            ? "各项在同一个更新前 θ 上形成；合并后只执行一次 θ 更新。候选 z 已冻结，M 与 N 尚未写入。"
            : decision === "append"
              ? "更新后有空槽，" + step.input.id + " 才进入 M；本轮结束的 θ、M、N 成为下一轮初态。"
              : decision === "replace"
                ? "更新后 j=" + step.insertion.j + "，" + step.insertion.evicted?.id + " 离开 slot " + selectedSlot + "，" + step.input.id + " 占据同一槽。"
                : "j=" + step.insertion.j + "≥K，" + step.input.id + " 拒收；它已完成本轮训练，M 不变且 N 递增。";
  const currentIds = state.M.map(record => record.id).join(",");
  const memoryOpacity = 1;
  const destinationText = decision === "append"
    ? "写入 · slot " + selectedSlot
    : decision === "replace"
      ? "替换 · slot " + selectedSlot
      : "拒收 · M 不变";
  const destinationSubtext = decision === "reject"
    ? "j=" + step.insertion.j + " ≥ K · N → " + step.after.N
    : decision === "replace"
      ? "j=" + step.insertion.j + " · N → " + step.after.N
      : "空槽可用 · N → " + step.after.N;

  return (
    <section
      className="teaching-scene workbench"
      data-scene="workbench"
      data-mode={mode}
      data-clip={c}
      data-progress={p}
      data-status={timeline.state.status}
      data-round={round + 1}
      data-phase={phase}
      data-seen={state.N}
      data-updates={state.updates}
      data-memory={currentIds}
      data-weights={JSON.stringify(state.W)}
    >
      <header>
        <div>
          <p className="eyebrow">ALGORITHM / 四轮连续执行</p>
          <h3>同一套状态，连续经过四轮与只读预测。</h3>
          <p>每轮只展示本步发生的操作；上一轮的 θ、记忆槽与计数直接成为下一轮起点。可回退检查，不会重复训练。</p>
        </div>
        <div className="mode-switch" aria-label="算法模式">
          {(["DER", "DER++"] as Mode[]).map(item => (
            <button
              key={item}
              data-mode={item}
              aria-pressed={mode === item}
              onClick={() => { setMode(item); timeline.reset(); }}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <StateHandoff steps={steps} round={round} prediction={prediction} timeline={timeline} />
      <SceneTransport timeline={timeline} clips={WORKBENCH_CLIPS} label="四轮工作台" showTiming={false} />

      <div className="wb-state" aria-label="当前持续状态">
        <span>当前参数 <b>θ{state.updates}</b></span>
        <span>已处理 N <b>{state.N}</b></span>
        <span>固定容量 K <b>{CONFIG.capacity}</b></span>
        <span>记忆 |M| <b>{state.M.length}</b></span>
        <button onClick={() => timeline.start(round * TRAIN_PHASES.length)} data-replay-round>回到本轮起点</button>
      </div>

      <div className="teaching-stage wb-stage">
        <svg viewBox="0 0 1280 640" className="teaching-canvas wb-canvas" role="img" aria-label="同一当前网络、四轮继承的记忆状态、更新后 Reservoir 选留与只读预测">
          <text x="42" y="35" className="wb-canvas-kicker">
            {prediction ? "TRAINING STOPPED / QUERY ONLY" : "PERSISTENT TRAINING STATE / ROUND 0" + (round + 1)}
          </text>
          <text x="1235" y="35" textAnchor="end" className="wb-canvas-mode">{mode} · {phaseLabel}</text>
          <path d="M42 48H1238" className="wb-canvas-rule" />

          <g className="wb-current-input" opacity={prediction ? 1 : 1}>
            <rect x="40" y="90" width="238" height="142" rx="16" className="wb-panel wb-input-panel" />
            <text x="57" y="114" className="wb-panel-kicker">{prediction ? "QUERY · 普通预测" : "CURRENT · 当前样本"}</text>
            <SampleGlyph x={56} y={133} size={58} model={prediction ? 0 : step.input.model} id={prediction ? "workbench query" : step.input.id + " original"} />
            <text x="126" y="156" className="wb-panel-title">{prediction ? "查询 u" : step.input.id + " · y=" + MODEL_CLASSES[step.input.y]}</text>
            <text x="126" y="181" className="wb-panel-value">{vectorText(prediction ? result.u : step.input.u, 1)}</text>
            <text x="126" y="205" className="wb-panel-note">{prediction ? "不需要任务身份" : "进入当前训练批次"}</text>
          </g>

          <MotionPath d="M278 161H350" progress={prediction ? currentDone : phase === 1 ? currentDone : 0} kind="current" />
          <NetworkGlyph
            x={355}
            y={78}
            version={"θ" + state.updates}
            forward={prediction || phase === 1 ? currentDone : 0}
            backward={updateProgress}
          />
          <text x="468" y="351" textAnchor="middle" className="wb-network-caption">
            {prediction ? "训练已停止" : updateProgress > 0.8 ? "单次更新完成" : "更新前使用同一 θ"}
          </text>

          <MotionPath d="M581 185H648" progress={prediction ? currentDone : phase === 1 ? currentDone : 0} kind="current" />
          <g opacity={prediction ? windowAt(p, 0.16, 0.78) : currentDone}>
            <ScoreGlyph
              x={654}
              y={139}
              label={prediction ? "查询 logits · θ₄" : step.input.id + " 前向 · θ" + step.before.updates}
              values={prediction ? result.logits : step.currentLogits}
              reveal={prediction ? windowAt(p, 0.15, 0.78) : currentDone}
              note={prediction ? "只读查询结果 · 不触发训练" : "更新前结果 · 本轮仅在 θ" + step.before.updates + " 上计算"}
            />
          </g>
          <MotionPath d="M925 211H944V141H958" progress={prediction ? 0 : phase === 1 || phase === 2 ? lossProgress : 0} kind="current" />

          {!prediction && step.rd && (
            <g className="wb-replay-match" opacity={phase === 0 ? replayProgress : phase > 0 ? 1 : 0}>
              <rect x="650" y="248" width="292" height="77" rx="12" className="wb-match-panel" />
              <text x="666" y="271" className="wb-match-kicker">Rd {step.rd.id} · 当前输出对冻结目标</text>
              <text x="666" y="296" className="wb-match-value">a = {vectorText(step.replayLogits!, 2)}</text>
              <text x="666" y="316" className="wb-match-target">z = {vectorText(step.rd.z, 2)} · 原样保留</text>
            </g>
          )}

          {!prediction && (
            <g className="wb-objective" opacity={lossProgress}>
              <rect x="960" y="83" width="278" height={mode === "DER++" ? 222 : 192} rx="15" className="wb-objective-panel" />
              <text x="980" y="111" className="wb-panel-kicker">联合目标 · 单次更新</text>
              <text x="980" y="142" className="wb-objective-title">当前标签 · Lcurrent</text>
              <text x="1217" y="142" textAnchor="end" className="wb-objective-value">{fmt(step.losses.current)}</text>
              <path d="M980 154H1218" className="wb-objective-rule" />
              <text x="980" y="181" className="wb-objective-title wb-objective-dark">冻结输出 · α Ldark</text>
              <text x="1217" y="181" textAnchor="end" className="wb-objective-value">{fmt(CONFIG.alpha * step.losses.dark)}</text>
              <text x="980" y="201" className="wb-objective-note">{step.rd ? "Rd " + step.rd.id + " · ‖a−z‖²" : "空池 · 本项为 0"}</text>
              {mode === "DER++" && (
                <>
                  <path d="M980 212H1218" className="wb-objective-rule" />
                  <text x="980" y="239" className="wb-objective-title wb-objective-label">历史真实标签 · β Lreplay-CE</text>
                  <text x="1217" y="239" textAnchor="end" className="wb-objective-value">{fmt(CONFIG.beta * step.losses.label)}</text>
                  <text x="980" y="260" className="wb-objective-note">{step.ry ? "独立读取 Ry " + step.ry.id + " · y=" + MODEL_CLASSES[step.ry.y!] : "空池 · 本项为 0"}</text>
                </>
              )}
              <text x="980" y={mode === "DER++" ? 286 : 261} className="wb-objective-total">总计 {fmt(step.losses.total)} · 所有项共用 θ</text>
            </g>
          )}

          {!prediction && step.rd && (() => {
            const index = step.before.M.findIndex(record => record.id === step.rd!.id);
            const path = "M336 " + (slotY(index) + 39) + " C 365 " + (slotY(index) + 39) + " 355 349 421 349 L 455 322";
            return <MotionPath d={path} progress={replayProgress} kind="replay" />;
          })()}
          {!prediction && mode === "DER++" && step.ry && (() => {
            const index = step.before.M.findIndex(record => record.id === step.ry!.id);
            const path = "M336 " + (slotY(index) + 45) + " C 374 " + (slotY(index) + 45) + " 368 359 429 359 L 466 322";
            return <MotionPath d={path} progress={replayProgress} kind="label" />;
          })()}

          {!prediction && <MotionPath d="M948 234V356H690V405" progress={freezeProgress} kind="freeze" />}
          {!prediction && <MotionPath d="M1070 305V328H590" progress={updateProgress} kind="gradient" />}

          {!prediction && <g className="wb-exit-bay">
            <rect x="985" y="385" width="253" height="205" rx="16" className="wb-exit-panel" />
          </g>}

          <g data-workbench-memory opacity={memoryOpacity}>
            <rect x="39" y="366" width="325" height="238" rx="17" className="wb-memory-panel" />
            <text x="57" y="391" className="wb-memory-title">持久记忆 · M / K={CONFIG.capacity}</text>
            <text x="346" y="391" textAnchor="end" className="wb-memory-count">N={state.N}</text>
            <text x="57" y="410" className="wb-memory-note">{readNote}</text>
            {[0, 1].map(slot => (
              <g key={slot}>
                <rect x="54" y={slotY(slot) - 4} width="295" height="84" rx="13" className="wb-slot-outline" />
                {!state.M[slot] && <text x="206" y={slotY(slot) + 48} textAnchor="middle" className="wb-empty-slot">slot {slot} · 空</text>}
              </g>
            ))}
            {step.before.M.map((record, slot) => {
              const isEvicted = decision === "replace" && step.insertion.evicted?.id === record.id;
              const position = movingRecordAt(slot);
              const opacity = prediction ? 0.74 : isEvicted && phase === 4 ? 1 - retireProgress : 1;
              return (
                <StoredRecord
                  key={record.id}
                  record={record}
                  x={position.x}
                  y={position.y}
                  opacity={opacity}
                  mode={mode}
                  readD={!prediction && step.rd?.id === record.id}
                  readY={!prediction && mode === "DER++" && step.ry?.id === record.id}
                />
              );
            })}
          </g>

          {!prediction && (
            <>
              <text x="418" y="392" className="wb-candidate-heading">写入前候选 · z 固定自更新前输出</text>
              <g opacity={candidateVisible ? (decision === "reject" && phase === 4 ? 1 - candidateExitProgress : 1) : 0}>
                <StoredRecord
                  record={step.candidate}
                  x={candidateAt.x}
                  y={candidateAt.y}
                  mode={mode}
                />
              </g>
              <g className="wb-selector" opacity={phase === 4 ? windowAt(p, 0.05, 0.32) : phase > 4 ? 1 : 0.76}>
                <rect x="736" y="405" width="220" height="105" rx="15" className="wb-selector-panel" />
                <text x="756" y="432" className="wb-panel-kicker">AFTER UPDATE · RESERVOIR</text>
                <text x="756" y="461" className="wb-selector-title">{destinationText}</text>
                <text x="756" y="486" className="wb-selector-note">{destinationSubtext}</text>
              </g>
              <g className="wb-exit-bay">
                <text x="1004" y="412" className="wb-panel-kicker">POOL EXIT · 池外结果</text>
                {decision === "replace" ? (
                  <>
                    <text x="1004" y="445" className="wb-exit-title">离开原槽</text>
                    <g opacity={phase === 4 && p < 0.36 ? 0 : 1}>
                      <rect x="1004" y="463" width="215" height="42" rx="10" className="wb-exit-summary" />
                      <text x="1112" y="490" textAnchor="middle" className="wb-exit-note">{step.insertion.evicted?.id} 离池 → {step.input.id} 同槽写入</text>
                    </g>
                    <text x="1004" y="557" className="wb-exit-note">另一槽不动 · |M| 仍为 {step.after.M.length}</text>
                  </>
                ) : decision === "reject" ? (
                  <>
                    <text x="1004" y="445" className="wb-exit-title">拒收候选</text>
                    <g opacity={phase === 4 && p < 0.84 ? 0 : 1}>
                      <rect x="1004" y="463" width="215" height="42" rx="10" className="wb-exit-summary" />
                      <text x="1112" y="490" textAnchor="middle" className="wb-exit-note">{step.input.id} 离池 · j={step.insertion.j} ≥ K</text>
                    </g>
                    <text x="1004" y="557" className="wb-exit-note">已参与训练 · M 不变，N 递增</text>
                  </>
                ) : (
                  <>
                    <text x="1004" y="445" className="wb-exit-title">本轮没有离池记录</text>
                    <text x="1004" y="469" className="wb-exit-note">空槽接收候选</text>
                    <text x="1004" y="520" className="wb-exit-note">N 按输入数递增</text>
                  </>
                )}
              </g>
              {decision !== "reject" && (
                <MotionPath
                  d={"M" + SELECTOR.x + " 454 C 805 351 245 351 205 " + (slotY(selectedSlot ?? 0) + 1)}
                  progress={phase === 4 && p < 0.88 ? candidatePlaceProgress : 0}
                  kind="write"
                />
              )}
              {decision === "reject" && (
                <MotionPath
                  d={"M" + SELECTOR.x + " 454 C 820 370 922 370 1000 450"}
                  progress={phase === 4 && p < 0.84 ? candidateExitProgress : 0}
                  kind="reject"
                />
              )}
              {decision === "replace" && (
                <MotionPath
                  d={"M" + (SLOT_X + 270) + " " + (slotY(step.before.M.findIndex(record => record.id === step.insertion.evicted?.id)) + 40) + " C 375 349 860 349 1000 458"}
                  progress={phase === 4 && p < 0.36 ? retireProgress : 0}
                  kind="reject"
                />
              )}
            </>
          )}

          {prediction && (
            <g className="wb-query-result" data-query-result opacity={windowAt(p, 0.3, 0.82)}>
              <rect x="961" y="293" width="277" height="105" rx="15" className="wb-query-panel" />
              <text x="982" y="323" className="wb-panel-kicker">OUTPUT · NO TRAINING</text>
              <text x="982" y="355" className="wb-query-label">argmax → {activePredictionLabel}</text>
              <text x="982" y="380" className="wb-query-note">θ、M、N 均保持不变</text>
            </g>
          )}

          <text x="41" y="628" className="wb-boundary" data-transition-note>
            合成教学模型 · 读池 / 单次更新 / 后选留；数值由 trainStep 计算，不是论文实验输出。
          </text>
        </svg>
      </div>

      <div className="scene-explanation" aria-live="polite">
        <strong>{phaseLabel}</strong>
        <p>{narration}</p>
      </div>
      <StepDetails step={step} />
      <p className="quiet-note">
        执行顺序依据 Algorithms 1–3；空池分支、DER 二元记录、容量与计数符号、下降方向按 W2 M01–M06 消歧。
        普通预测独立读取 θ₄，不触发回放或训练；原文未定义额外的任务末尾操作。
      </p>
    </section>
  );
}
