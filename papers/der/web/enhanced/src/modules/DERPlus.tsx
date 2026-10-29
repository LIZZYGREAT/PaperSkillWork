import { useId, useState } from "react";
import SceneTransport, { useSceneTimeline } from "./review/SceneTransport";
import { curve, windowAt } from "./review/lifecycle-model";
import { MotionTrail } from "./review/MotionTrail";
import { NetworkGlyph, SampleGlyph, fmt } from "./LearningGlyphs";
import { MODEL_CLASSES } from "../data/model-classes";
import { DER_PLUS_MEMORY } from "./der-plus-example";
import type { Mode } from "./training-model";
import "./learning-scenes.css";
import "./flow-refinements.css";

const clips = [
  { id: "旧响应可能错；先看冲突", durationMs: 4500, holdMs: 1800 },
  { id: "Rᴅ 与 Rʏ 分别读取", durationMs: 5000, holdMs: 1800 },
  { id: "三种监督汇合，一次更新", durationMs: 6000, holdMs: 2200 },
];
const rdRecord = DER_PLUS_MEMORY[0];
const alternativeRecord = DER_PLUS_MEMORY[1];
const currentSample = { id: "x₃", model: 2 as const, label: "DeepSeek" };
const oldTop = (values: readonly number[]) => values.indexOf(Math.max(...values));

export default function DERPlus() {
  const defsId = useId().replace(/:/g, "");
  const [mode, setMode] = useState<Mode>("DER++");
  const [overlap, setOverlap] = useState(true);
  const timeline = useSceneTimeline(clips);
  const { clipIndex: c, progress: p } = timeline.state;
  const reveal = (i: number) => c > i ? 1 : c < i ? 0 : windowAt(p, .08, .86);
  const reading = reveal(1);
  const supervision = reveal(2);
  const conflictFocus = 1 - windowAt(reading, .02, .45);
  const update = windowAt(supervision, .48, .96);
  const plus = mode === "DER++";
  const ryRecord = overlap ? rdRecord : alternativeRecord;
  const rdPoints = [{ x: 383, y: 203 }, { x: 397, y: 203 }, { x: 400, y: 174 }, { x: 422, y: 174 }] as const;
  const rdFlight = curve(reading, ...rdPoints);
  const ryStart = overlap ? { x: 383, y: 203 } : { x: 383, y: 414 };
  const ryPoints = [ryStart, { x: 400, y: ryStart.y }, { x: 398, y: 318 }, { x: 422, y: 318 }] as const;
  const ryFlight = curve(reading, ...ryPoints);
  const notes = [
    "这条记忆的真实标签是 Claude，但冻结 z=(0.5,2,0) 把 GPT 排第一。匹配旧响应会保留过去的判断；它本身无法知道这个判断错了。",
    plus
      ? `Rᴅ 读取 ${rdRecord.id} 的旧 logits；Rʏ 独立读取 ${ryRecord.id} 的真实标签。抽样可重合，也可不同。两次读取发生在 M 更新前。`
      : `DER 只做 Rᴅ 输出匹配；切换为 DER++ 后，才加入独立的 Rʏ 标签读取。两者都从本步开始前的 M 读取。`,
    plus
      ? "当前标签 CE、旧输出匹配和回放标签 CE 都作用于同一个更新前 θ，合成唯一一次更新。监督方向可能竞争，不展示也不保证更新后纠错。"
      : "当前标签 CE 与旧输出匹配合成唯一一次 θ 更新。DER 不增加历史标签分支。",
  ];

  return <section className="teaching-scene" data-scene="der-plus" data-clip={c} data-progress={p} data-status={timeline.state.status} data-mode={mode} data-rd={rdRecord.id} data-ry={plus ? ryRecord.id : "none"} data-updates={c === 2 && p >= .86 ? 1 : 0} data-read-progress={reading} data-supervision-count={plus ? 3 : 2}>
    <header><div>
      <p className="eyebrow">DER++ / 历史标签补上什么</p>
      <h3>旧响应可以保留错误；真实标签提供另一种方向。</h3>
      <p>先看真实类别与冻结 logits 的冲突。DER++ 再从同一份旧记忆独立抽取标签监督；两种历史信号和当前分类共用一次参数更新。</p>
    </div><div className="scene-options dp-mode-switch" role="group" aria-label="选择训练方法">
      {(["DER", "DER++"] as Mode[]).map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => { setMode(item); timeline.reset(); }}>{item}</button>)}
    </div></header>
    {plus && <div className="dp-read-controls scene-options" role="group" aria-label="选择两次回放是否抽到同一条旧记忆">
      <span>两次独立读取</span>
      <button type="button" data-overlap-choice="same" aria-pressed={overlap} onClick={() => { setOverlap(true); timeline.start(1); }}>恰好重合 · x₁ / x₁</button>
      <button type="button" data-overlap-choice="different" aria-pressed={!overlap} onClick={() => { setOverlap(false); timeline.start(1); }}>抽到不同项 · x₁ / x₂</button>
      <small>M 在两次读取期间不变</small>
    </div>}
    <SceneTransport timeline={timeline} clips={clips} label="DER++ 两次读取与一次联合更新" showTiming={false} caption="Rᴅ 与 Rʏ 是两次独立抽样；两者可能读到同一条，也可能不同。" />
    <div className="teaching-stage dp-stage"><svg viewBox="0 0 1440 620" className="teaching-canvas dp-canvas" role="img" aria-label="真实标签与旧 logits 冲突，两次独立回放与当前分类汇入一次参数更新">
      <defs>
        <marker id={`${defsId}-memory`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="dp-arrow-memory" /></marker>
        <marker id={`${defsId}-dark`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="dp-arrow-dark" /></marker>
        <marker id={`${defsId}-label`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="dp-arrow-label" /></marker>
        <marker id={`${defsId}-update`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="dp-arrow-update" /></marker>
      </defs>

      <g className="dp-memory" data-memory-record={rdRecord.id}>
        <rect x="30" y="66" width="354" height="283" rx="17" className="dp-memory-panel" />
        <text x="52" y="97" className="tg-title">E04 · 本步开始前的旧记忆 M</text>
        <SampleGlyph x={52} y={112} size={54} id="DER++ x1 old memory" model={rdRecord.model} />
        <text x="120" y="133" className="dp-record-title">x₁ · 真实 y = Claude</text>
        <rect x="120" y="146" width="105" height="29" rx="14" className="dp-truth-pill" />
        <text x="172" y="166" textAnchor="middle" className="dp-pill-text">真实标签 Claude</text>
        <text x="239" y="166" className="dp-not-equal">≠</text>
        <rect x="260" y="146" width="102" height="29" rx="14" className="dp-wrong-pill" />
        <text x="311" y="166" textAnchor="middle" className="dp-pill-text">旧 z 最高：GPT</text>
        <text x="54" y="202" className="tg-small">冻结的历史 logits z</text>
        {rdRecord.z.map((value, index) => <g key={MODEL_CLASSES[index]}>
          <rect x={53 + index * 100} y="213" width="91" height="71" rx="9" className={`tg-score tg-tone-${index}${index === oldTop(rdRecord.z) ? " dp-z-wrong" : ""}`} />
          <text x={98 + index * 100} y="235" textAnchor="middle" className="dp-class-label">{MODEL_CLASSES[index]}</text>
          <text x={98 + index * 100} y="269" textAnchor="middle" className="tg-number">{fmt(value, 1)}</text>
        </g>)}
        <text x="54" y="322" className="tg-small">旧目标把 GPT 排第一；并不知道真实 y。</text>
      </g>

      <g className={`dp-memory-secondary${plus && !overlap ? " is-selected" : ""}`} data-memory-record={alternativeRecord.id}>
        <rect x="30" y="365" width="354" height="100" rx="15" className="dp-memory-secondary-panel" />
        <SampleGlyph x={51} y={386} size={56} id="DER++ x2 alternate memory" model={alternativeRecord.model} />
        <text x="120" y="399" className="dp-record-title">x₂ · 真实 y = GPT</text>
        <text x="120" y="425" className="tg-small">z₂ = (1.0, 0.8, 0.2) · 另一条合成记忆</text>
        {plus && !overlap && <rect x="300" y="378" width="66" height="25" rx="12" className="dp-ry-tag" />}
        {plus && !overlap && <text x="333" y="396" textAnchor="middle" className="dp-ry-tag-text">Rʏ</text>}
      </g>

      <g opacity={conflictFocus} className="dp-conflict-focus">
        <path d="M384 204C425 204 443 259 482 259" className="dp-conflict-route" markerEnd={`url(#${defsId}-dark)`} />
        <text x="500" y="150" className="dp-conflict-eyebrow is-dark">匹配历史响应 · x₁</text>
        <rect x="482" y="170" width="340" height="180" rx="17" className="dp-conflict-old" />
        <text x="514" y="229" className="dp-conflict-class is-dark">GPT</text>
        <text x="514" y="276" className="dp-conflict-note">z_GPT = 2.0 · 冻结向量最高项</text>
        <path d="M514 300H788" className="dp-conflict-rule is-dark" />
        <text x="514" y="326" className="dp-conflict-note">保持旧输出时，GPT 仍排在第一</text>
        <path d="M830 259H902" className="dp-conflict-bridge" />
        <text x="866" y="273" textAnchor="middle" className="dp-conflict-neq">≠</text>
        <text x="925" y="150" className="dp-conflict-eyebrow is-label">真实标签监督 · x₁</text>
        <rect x="920" y="170" width="340" height="180" rx="72" className="dp-conflict-truth" />
        <circle cx="970" cy="258" r="32" className="dp-conflict-target-ring" />
        <circle cx="970" cy="258" r="10" className="dp-conflict-target-core" />
        <path d="M970 215V228M970 288V301M927 258H940M1000 258H1013" className="dp-conflict-target-rays" />
        <text x="1020" y="247" className="dp-conflict-class is-label">Claude</text>
        <text x="1020" y="285" className="dp-conflict-note">真实 y 指向 Claude</text>
        <text x="482" y="382" className="dp-conflict-summary">同一条 x₁：保持旧响应与符合真实标签，提出不同要求</text>
      </g>
      <g opacity={reading}>
        <MotionTrail points={rdPoints} progress={reading} className="dp-motion-trail is-dark" />
        <MotionTrail points={ryPoints} progress={reading} className="dp-motion-trail is-label" />
        <g className="dp-read-card is-dark"><path d="M426 128H608Q620 128 620 140V206Q620 218 608 218H426Z"/><text x="445" y="159" className="dp-lane-title">Rᴅ · {rdRecord.id}</text><text x="445" y="187" className="tg-small">复制冻结 logits z</text></g>
        <g className="dp-read-card is-label"><path d="M426 272H608Q620 272 620 284V350Q620 362 608 362H426Z"/><text x="445" y="303" className="dp-lane-title">Rʏ · {ryRecord.id}</text><text x="445" y="331" className="tg-small">读取真实 y = {ryRecord.label}</text></g>
        <g transform={`translate(${rdFlight.x - 11} ${rdFlight.y - 11})`} className="dp-flight-token is-dark"><SampleGlyph x={0} y={0} size={22} id="R-d read copy" model={rdRecord.model} /></g>
        <g transform={`translate(${ryFlight.x - 11} ${ryFlight.y - 11})`} className="dp-flight-token is-label"><SampleGlyph x={0} y={0} size={22} id="R-y read copy" model={ryRecord.model} /></g>
        <path d="M620 173H648V228H666" className="dp-into-network is-dark" markerEnd={`url(#${defsId}-dark)`} />
        {plus && <path d="M620 317H648V330H666" className="dp-into-network is-label" markerEnd={`url(#${defsId}-label)`} />}
        <g className="dp-current-sample"><SampleGlyph x={708} y={55} size={42} id="DER++ current x3" model={currentSample.model} /><text x="762" y="73" className="dp-record-title">x₃ · y = DeepSeek</text><text x="762" y="96" className="tg-small">当前数据</text></g>
        <path d="M760 112V155" className="dp-current-input" markerEnd={`url(#${defsId}-memory)`} />
        <NetworkGlyph x={666} y={160} version="θ" forward={reading} />
        <text x="779" y="426" textAnchor="middle" className="tg-small">三路前向都用更新前同一 θ</text>
      </g>

      <g opacity={supervision}>
        <path d="M892 206C918 180 907 120 930 120" className="dp-loss-flow is-current" markerEnd={`url(#${defsId}-memory)`} />
        <path d="M892 260H910" className="dp-loss-flow is-dark" markerEnd={`url(#${defsId}-dark)`} />
        {plus && <path d="M892 321C918 350 907 412 930 412" className="dp-loss-flow is-label" markerEnd={`url(#${defsId}-label)`} />}
        <g className="dp-loss-card is-current"><rect x="930" y="74" width="252" height="92" rx="16"/><circle cx="963" cy="120" r="17"/><text x="963" y="125" textAnchor="middle" className="dp-ce-mark">CE</text><text x="992" y="112" className="dp-loss-title">当前分类 · L_current</text><text x="992" y="137" className="tg-small">CE(y₃, 当前输出)</text></g>
        <g className="dp-loss-card is-dark"><path d="M912 194H1165Q1182 194 1182 211V316Q1182 333 1165 333H912Z"/><text x="934" y="225" className="dp-loss-title">α · L_dark</text><text x="1160" y="225" textAnchor="end" className="dp-loss-equation">‖a − z‖²</text><path d="M934 239H1160" className="dp-card-rule"/><text x="934" y="267" className="tg-small">Rᴅ · 三个类别逐项匹配</text>{["a₁ ↔ z₁","a₂ ↔ z₂","a₃ ↔ z₃"].map((pair, index) => <g key={pair}><rect x={934 + index * 73} y="280" width="66" height="30" rx="7" className={`dp-mini-class tg-tone-${index}`}/><text x={967 + index * 73} y="300" textAnchor="middle" className="dp-mini-label">{pair}</text></g>)}</g>
        {plus && <g className="dp-loss-card is-label"><rect x="930" y="367" width="252" height="92" rx="28"/><path d="M961 391V434M940 412H982" className="dp-label-target"/><circle cx="961" cy="412" r="8" className="dp-label-core"/><text x="994" y="405" className="dp-loss-title">β · L_replay-CE</text><text x="994" y="431" className="tg-small">Rʏ · 真实类别 CE</text></g>}

        <path d="M1183 120C1224 120 1220 184 1254 217" className="dp-merge-flow is-current" markerEnd={`url(#${defsId}-memory)`} />
        <path d="M1183 263H1241" className="dp-merge-flow is-dark" markerEnd={`url(#${defsId}-dark)`} />
        {plus && <path d="M1183 412C1224 412 1221 347 1254 316" className="dp-merge-flow is-label" markerEnd={`url(#${defsId}-label)`} />}
        <g className={`dp-update-hub${update > .18 && update < .98 ? " is-updating" : ""}`} transform="translate(1286 264)">
          <circle r="53" className="dp-hub-halo"/><circle r="37" className="dp-hub-core"/><path d="M-18 -9L0 -20L18 -9M-18 -9L0 11L18 -9M0 -20V11" className="dp-hub-edges"/><circle cx="-18" cy="-9" r="4.5" className="dp-hub-node"/><circle cy="-20" r="4.5" className="dp-hub-node"/><circle cy="11" r="4.5" className="dp-hub-node"/><circle cx="18" cy="-9" r="4.5" className="dp-hub-node"/><text y="72" textAnchor="middle" className="dp-hub-caption">同一个 θ</text>
        </g>
        <path d="M1339 264H1360" className="dp-update-arrow" markerEnd={`url(#${defsId}-update)`} />
        <g className="dp-updated-parameter"><circle cx="1382" cy="264" r="22"/><text x="1382" y="270" textAnchor="middle">θ⁺</text><text x="1382" y="309" textAnchor="middle" className="tg-small">一次更新</text></g>
      </g>

      <g opacity={supervision}>
        <rect x="414" y="483" width="986" height="65" rx="14" className="dp-total-panel" />
        <text x="438" y="523" className="dp-total-formula" data-total-formula>{plus ? "L = L_current + α L_dark + β L_replay-CE" : "L = L_current + α L_dark"}</text>
        <text x="1358" y="522" textAnchor="end" className="tg-small">一次更新</text>
      </g>
      <text x="34" y="590" className="tg-small dp-boundary">E04 / x₂ 是解释监督职责的合成记忆，不是论文实验数据。方向会竞争；图中不模拟或承诺更新后必定纠错。</text>
    </svg></div>
    <div className="scene-explanation" aria-live="polite"><strong>{clips[c].id}</strong><p>{notes[c]}</p></div>
    <p className="quiet-note">DER 记录 (x,z)；DER++ 记录 (x,z,y)。Rᴅ / Rʏ 都从写入前的 M 读取；当前 CE、历史 logits 匹配与可选历史标签 CE 使用同一个更新前参数 θ，共同形成一次更新。E04 为解释性错例，更新方向不表示必然纠错。</p>
  </section>;
}
