import { useState } from "react";
import { SampleToken } from "../../shared/foundation/visual-parts/SampleToken";
import { RepresentationVector } from "../../shared/foundation/visual-parts/RepresentationVector";
import { HISTORY_Z } from "../math-model";
import { CatMark } from "../ReplayEntry";
import { ReferenceButton } from "../Reference";

const stages = ["输出", "复制数值", "参数更新", "候选等待入池"];
const descriptions = ["同一训练视图进入当前网络 θₜ，产生更新前输出。此时还没有独立的历史 z。", "复制输出数值为 z，给这份候选标记样本 x₂ 和生成时刻 t；不复制旧网络。", "联合损失更新唯一当前网络为 θₜ₊₁。复制出的 z 不再依赖当前参数，不重新前向计算。", "参数更新后，将原图 x₂ 与更新前复制的 z 作为候选等待 reservoir 决定去留；这里尚未入池。"];
export default function FreezePrototype() {
  const [stage, setStage] = useState(0);
  return <section id="review-freeze" className="review-scene" data-core-items="I05" data-freeze-stage={stage}>
    <header><p className="eyebrow">提案 02B · 同一个值，跨过参数更新</p><h2>当前 θ 已变，历史 z 没变。</h2><p>沿着 x₂ 的一次输出观察身份变化。这里是概念性时序示意，不执行网络训练，也不编造更新后的输出值。</p></header>
    <div className="review-stage-controls" role="group" aria-label="历史冻结阶段">{stages.map((label, index) => <button key={label} data-freeze-step={index} aria-pressed={stage === index} onClick={() => setStage(index)}><small>0{index + 1}</small>{label}</button>)}</div>
    <div className="freeze-workspace"><div className="freeze-model-track"><SampleToken sampleId="x2" label="x₂ · 同一训练视图"><CatMark /></SampleToken><span aria-hidden="true">→</span><div className="freeze-network"><small>唯一当前网络</small><strong data-current-parameter>{stage >= 2 ? "θₜ₊₁" : "θₜ"}</strong><span>{stage >= 2 ? "参数已更新" : "参数更新前"}</span></div><span aria-hidden="true">→</span><div className="live-output" data-output-time={stage >= 2 ? "after" : "before"}>{stage < 2 ? <><small>本步更新前输出</small><RepresentationVector label="(2, 1, 0)" values={[...HISTORY_Z]} extent={3} /></> : <><small>更新后的输出</small><strong>hθₜ₊₁(x₂)</strong><p>本示意未计算<br />不据此刷新历史值</p></>}</div></div>
      <div className="freeze-record-track"><div className="copy-connection">{stage === 0 ? "等待复制 ↓" : "更新前复制的数值 ↓"}</div><div className="freeze-record-lane"><span>输出时刻 t</span><span>独立保存数值</span><span>等待去留决定</span></div>
        {stage === 0 ? <div className="not-copied" data-not-copied>尚无 z · 尚无入池记录</div> : <div className="snapshot-record" data-record-id="x2@t" data-history-z={HISTORY_Z.join(",")} data-record-position={stage === 3 ? "candidate" : "copied"}><div><strong>x₂@t · 历史 z</strong><span>生成时刻 t · 数值冻结</span></div><RepresentationVector label="z = (2, 1, 0)" values={[...HISTORY_Z]} extent={3} /><small>{stage === 3 ? "候选 (原图 x₂, z) · 尚未入池" : "复制自更新前输出 · 不随 θ 更新"}</small></div>}
      </div>
    </div>
    <div className="freeze-explanation" aria-live="polite"><strong>{stages[stage]}</strong><p>{descriptions[stage]}</p></div>
    <div className="review-transport"><button onClick={() => setStage(0)}>从输出重新开始</button><button disabled={stage === 0} onClick={() => setStage(stage - 1)}>上一步</button><button disabled={stage === 3} onClick={() => setStage(stage + 1)}>下一步</button><span>同一记录 ID：x₂@t</span></div>
    <p>保存的是过去的输出数值，后面由当前网络向它靠近；不需要第二台常驻教师。不同记录可以来自不同训练时刻。</p><ReferenceButton term="z">历史 z 的来源与原文时序</ReferenceButton>
  </section>;
}
