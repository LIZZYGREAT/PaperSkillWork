import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { promptPoolConfig } from "./prompt-retrieval-data";
import {
  distanceFromExampleKey,
  P7_BATCH_INDICES,
  P7_BATCH_SAMPLES,
  P7_COMMON_INDICES,
  P7_EXAMPLE_GRADIENT,
  P7_UNTOUCHED_INDICES,
  type BatchSample,
} from "./prompt-learning-data";
import "./prompt-learning.css";

const duration = 16_000;
const boundaries = [0, 1_600, 4_300, 5_900, 8_700, 12_100, duration];
const phases = [
  { short: "读取同一快照", text: "A、B 都从同一份 Θᵦ 出发。各自保留 P5 的 Query 与 Top‑5 配对；两份前向都先完成，再进入 Batch 梯度累积。" },
  { short: "分类梯度回传", text: "每个交叉熵分别回到该样本选中的 Prompt 和共享分类器 φ。梯度经过冻结 ViT 的计算路径，ViT 权重仍保持冻结。" },
  { short: "硬 Top‑5 边界", text: "Top‑5 产生离散索引集合。分类损失不能穿过这个硬索引，形成普通连续的 Key 排序梯度。" },
  { short: "Key 匹配梯度", text: "匹配损失直接对各自 Query 已选中的 Key 求梯度；它改变的是持久 Key，Query 提取过程仍冻结。" },
  { short: "合并同批贡献", text: "A、B 的梯度在 Batch 内先相加。P₂/P₃ 与 k₂/k₃ 收到两份来源不同的贡献，φ 也汇总两份分类梯度。" },
  { short: "一次参数写回", text: "整个 Batch 完成后只执行一次 Optimizer Step，得到 Θᵦ₊₁。这里展示梯度命中与状态边界，不伪造梯度数值。" },
];
const poolIndices = Array.from({ length: promptPoolConfig.poolSize }, (_, offset) => offset + 1);

type Phase = 0 | 1 | 2 | 3 | 4 | 5;
type ParameterKind = "prompt" | "key";

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

function easeInOut(value: number) {
  const t = clamp(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function phaseAt(position: number): Phase {
  if (position >= duration) return 5;
  const index = boundaries.findIndex((start, offset) => offset < boundaries.length - 1 && position >= start && position < boundaries[offset + 1]);
  return Math.max(0, index) as Phase;
}

function phaseProgress(position: number, phase: Phase) {
  return clamp((position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase]));
}

function flightProgress(activePhase: Phase, progress: number, flightPhase: Phase) {
  if (activePhase < flightPhase) return 0;
  if (activePhase > flightPhase) return 1;
  return easeInOut(progress);
}

function MathKey({ prefix, index }: { prefix: string; index: number }) {
  return <math aria-label={prefix + " " + index}><msub><mi>{prefix}</mi><mn>{index}</mn></msub></math>;
}

function MathSub({ base, index }: { base: string; index: string }) {
  return <math><msub><mi>{base}</mi><mi>{index}</mi></msub></math>;
}

function MathVersion({ version }: { version: "b" | "b+1" }) {
  return <math aria-label={"Theta " + version}><msub><mi>Θ</mi><mrow>{version === "b" ? <mi>b</mi> : <mrow><mi>b</mi><mo>+</mo><mn>1</mn></mrow>}</mrow></msub></math>;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function FlightRail({
  kind,
  source,
  target,
  progress,
  active,
}: {
  kind: "classification" | "matching" | "batch" | "update";
  source: ReactNode;
  target: ReactNode;
  progress: number;
  active: boolean;
}) {
  const [trackRef, trackWidth] = useElementWidth<HTMLDivElement>();
  const travel = Math.max(0, trackWidth - 22) * progress;
  return <div className={"p7-flight-rail p7-flight-rail--" + kind + (active ? " is-active" : "")}>
    <div className="p7-flight-source">{source}</div>
    <div className="p7-flight-track" ref={trackRef} aria-hidden="true">
      <span className="p7-flight-line" />
      <span className="p7-flight-packet" style={{ transform: `translate3d(${travel}px,0,0)` }}>{kind === "update" ? "1×" : "∇"}</span>
    </div>
    <div className="p7-flight-target">{target}</div>
  </div>;
}

function LossEquation({ sample, kind }: { sample: BatchSample; kind: "classification" | "matching" }) {
  if (kind === "classification") return <math aria-label={`L classification ${sample.id} equals cross entropy of z ${sample.id} and y ${sample.id}`}>
    <mrow><msub><mi>L</mi><mrow><mi>cls</mi><mo>,</mo><mi>{sample.id}</mi></mrow></msub><mo>=</mo>
      <mi mathvariant="normal">CE</mi><mrow><mo>(</mo><msub><mi>z</mi><mi>{sample.id}</mi></msub><mo>,</mo><msub><mi>y</mi><mi>{sample.id}</mi></msub><mo>)</mo></mrow>
    </mrow>
  </math>;
  return <math aria-label={`L match ${sample.id} is the sum of cosine distances from q ${sample.id} to selected keys`}>
    <mrow><msub><mi>L</mi><mrow><mi>match</mi><mo>,</mo><mi>{sample.id}</mi></mrow></msub><mrow><mo>(</mo><msub><mi>x</mi><mi>{sample.id}</mi></msub><mo>)</mo></mrow><mo>=</mo>
      <munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi><mrow><mo>(</mo><msub><mi>x</mi><mi>{sample.id}</mi></msub><mo>)</mo></mrow></mrow></munder>
      <mi>γ</mi><mrow><mo>(</mo><msub><mi>q</mi><mi>{sample.id}</mi></msub><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo></mrow>
    </mrow>
  </math>;
}

function SelectionChips({
  sample,
  kind,
  selectedSlot,
  onSelect,
}: {
  sample: BatchSample;
  kind: ParameterKind;
  selectedSlot: number | null;
  onSelect: (index: number) => void;
}) {
  const prefix = kind === "prompt" ? "P" : "k";
  return <div className={"p7-selection-list p7-selection-list--" + kind}>
    <span className="p7-selection-label">{kind === "prompt" ? "Prompt" : "Key"}</span>
    <div className="p7-selection-chips">
      {sample.selected.map(index => <button type="button" key={index}
        className={"p7-selection-chip " + (selectedSlot === index ? "is-inspected" : "")}
        aria-label={`样本 ${sample.id} 选择 ${prefix} ${index}`} aria-pressed={selectedSlot === index}
        onClick={() => onSelect(index)}>
        <MathKey prefix={prefix} index={index} />
      </button>)}
    </div>
  </div>;
}

function SampleCard({
  sample,
  activePhase,
  clsProgress,
  matchProgress,
  selectedSlot,
  onSelectSlot,
}: {
  sample: BatchSample;
  activePhase: Phase;
  clsProgress: number;
  matchProgress: number;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
}) {
  const id = sample.id;
  return <article className={"p7-sample-card p7-sample-card--" + id.toLowerCase()} aria-label={`Batch 样本 ${id}`}>
    <header className="p7-sample-card__header">
      <span className="p7-sample-stamp">样本 {id}</span>
      <div className="p7-sample-identity"><MathSub base="x" index={id} /><span>标签 <MathSub base="y" index={id} /></span></div>
      <span className="p7-snapshot-label">读取 <MathVersion version="b" /></span>
    </header>

    <div className="p7-sample-query"><span className="p7-query-mark" aria-hidden="true" /><strong><MathSub base="q" index={id} /></strong><span>冻结 ViT [CLS]</span><i aria-hidden="true">→</i><b>Top‑5</b></div>
    <div className="p7-sample-selections">
      <SelectionChips sample={sample} kind="prompt" selectedSlot={selectedSlot} onSelect={onSelectSlot} />
      <SelectionChips sample={sample} kind="key" selectedSlot={selectedSlot} onSelect={onSelectSlot} />
    </div>

    <div className="p7-sample-losses" aria-label={`样本 ${id} 的两个损失与参数梯度路径`}>
      <FlightRail kind="classification" active={activePhase === 1 || activePhase > 1}
        progress={clsProgress}
        source={<><strong>分类损失</strong><LossEquation sample={sample} kind="classification" /></>}
        target={<><span>→ 已选 Prompt</span><span>+ 共享 φ</span></>} />
      <FlightRail kind="matching" active={activePhase === 3 || activePhase > 3}
        progress={matchProgress}
        source={<><strong>匹配损失</strong><LossEquation sample={sample} kind="matching" /></>}
        target={<><span>→ 已选 Key</span><span>kⱼ, j∈S(x<sub>{id}</sub>)</span></>} />
    </div>
    <p className="p7-sample-footnote">P 与 K 按同一槽位编号配对；本样本的两条损失仍分别计算。</p>
  </article>;
}

function SlotRibbon({
  kind,
  selectedSlot,
  onSelectSlot,
}: {
  kind: ParameterKind;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
}) {
  const prefix = kind === "prompt" ? "P" : "k";
  const setA = new Set(P7_BATCH_SAMPLES[0].selected);
  const setB = new Set(P7_BATCH_SAMPLES[1].selected);
  return <div className={"p7-slot-ribbon p7-slot-ribbon--" + kind}>
    {poolIndices.map(index => {
      const hitA = setA.has(index);
      const hitB = setB.has(index);
      const source = hitA && hitB ? "A+B" : hitA ? "A" : hitB ? "B" : "—";
      const common = hitA && hitB;
      return <button type="button" key={index} data-slot-index={index} data-parameter-kind={kind}
        className={"p7-slot-chip " + (hitA || hitB ? "is-hit " : "is-empty ") + (common ? "is-common " : "") + (selectedSlot === index ? "is-inspected" : "")}
        aria-label={`${prefix} ${index}: ${source === "—" ? "本批无直接损失梯度" : "来自样本 " + source}`}
        aria-pressed={selectedSlot === index} onClick={() => onSelectSlot(index)}>
        <MathKey prefix={prefix} index={index} /><small>{source}</small>
      </button>;
    })}
  </div>;
}

function SourceList({ sample, kind, selectedSlot, onSelectSlot }: {
  sample: BatchSample;
  kind: ParameterKind;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
}) {
  return <div className="p7-source-list">
    {sample.selected.map(index => <button type="button" key={index}
      className={"p7-source-chip " + (selectedSlot === index ? "is-inspected" : "")}
      aria-label={`样本 ${sample.id} 对 ${kind === "prompt" ? "Prompt" : "Key"} ${index} 提供直接梯度`}
      aria-pressed={selectedSlot === index} onClick={() => onSelectSlot(index)}>
      <MathKey prefix={kind === "prompt" ? "P" : "k"} index={index} />
    </button>)}
  </div>;
}

function GradientLedger({ activePhase, selectedSlot, onSelectSlot }: {
  activePhase: Phase;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
}) {
  const live = activePhase >= 4;
  return <section className={"p7-ledger " + (live ? "is-live" : "is-pending")} aria-label="按参数类型汇总本批梯度">
    <div className="p7-ledger__heading">
      <div><span className="p7-section-kicker">Batch 梯度账本</span><h3>同一槽位先合并来源，再统一交给优化器</h3></div>
      <span className="p7-ledger-status">{live ? "A + B 已汇总" : "等待两个样本完成损失计算"}</span>
    </div>
    <div className="p7-ledger-scroll">
      <table className="p7-ledger-table">
        <colgroup><col /><col /><col /><col /></colgroup>
        <thead><tr><th scope="col">参数组</th><th scope="col">样本 A</th><th scope="col">样本 B</th><th scope="col">固定槽位的本批来源</th></tr></thead>
        <tbody>
          {(["prompt", "key"] as const).map(kind => <tr className={`p7-ledger-row p7-ledger-row--${kind}`} key={kind}>
            <th scope="row"><strong>{kind === "prompt" ? "Prompt Pool" : "Key Pool"}</strong><span>{kind === "prompt" ? "分类损失 → P" : "匹配损失 → K"}</span></th>
            <td><SourceList sample={P7_BATCH_SAMPLES[0]} kind={kind} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} /></td>
            <td><SourceList sample={P7_BATCH_SAMPLES[1]} kind={kind} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} /></td>
            <td><SlotRibbon kind={kind} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} /></td>
          </tr>)}
          <tr className="p7-ledger-row p7-ledger-row--classifier">
            <th scope="row"><strong>共享分类器 φ</strong><span>只接收分类梯度</span></th>
            <td><span className="p7-contribution-pill">∇L<sub>cls,A</sub></span></td>
            <td><span className="p7-contribution-pill">∇L<sub>cls,B</sub></span></td>
            <td><span className="p7-sum-pill">∇φ<sub>A</sub> + ∇φ<sub>B</sub></span></td>
          </tr>
          <tr className="p7-ledger-row p7-ledger-row--frozen">
            <th scope="row"><strong>冻结 ViT 主干</strong><span>参与计算，不写回</span></th>
            <td colSpan={2}><span className="p7-frozen-value"><MathSub base="f" index="e" /><MathSub base="f" index="r" /></span></td>
            <td><span className="p7-frozen-label">梯度可以经过，参数始终锁定</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p className="p7-ledger-note">共用索引 {P7_COMMON_INDICES.map(index => `P${index}`).join("、")} / {P7_COMMON_INDICES.map(index => `k${index}`).join("、")} 分别汇总 A、B 两份贡献；{P7_UNTOUCHED_INDICES.map(index => `${index}`).join("、")} 本批没有直接损失梯度。</p>
  </section>;
}

function BatchAccumulation({ activePhase, progress }: { activePhase: Phase; progress: number }) {
  const flight = flightProgress(activePhase, progress, 4);
  const active = activePhase >= 4;
  return <section className={"p7-accumulation " + (active ? "is-active" : "")} aria-label="先累积 A、B 的损失，再形成 Batch 梯度">
    <div className="p7-accumulation__heading"><strong>Mini-batch 损失</strong><math display="inline"><msub><mi>L</mi><mi>batch</mi></msub><mo>=</mo><msub><mi>L</mi><mi>A</mi></msub><mo>+</mo><msub><mi>L</mi><mi>B</mi></msub></math><span>一个 Batch · 两个样本都使用 Θᵦ</span></div>
    <FlightRail kind="batch" active={active} progress={flight}
      source={<><span className="p7-batch-source p7-batch-source--a">A · L<sub>A</sub></span><span className="p7-batch-source p7-batch-source--b">B · L<sub>B</sub></span></>}
      target={<><strong>∑ Batch 梯度</strong><small>同索引先相加</small></>} />
    <p className="p7-accumulation__note">样本 A 和 B 不会先后改写参数；两份损失完成后，才调用一次优化器。</p>
  </section>;
}

function UpdateBoundary({ activePhase, progress }: { activePhase: Phase; progress: number }) {
  const flight = flightProgress(activePhase, progress, 5);
  const active = activePhase >= 5;
  return <section className={"p7-update-boundary " + (active ? "is-active" : "")} aria-label="参数状态从本批更新前到更新后">
    <div className="p7-state-node"><small>本批共同读取</small><strong><MathVersion version="b" /></strong><span>Pᵦ · Kᵦ · φᵦ</span></div>
    <FlightRail kind="update" active={active} progress={flight}
      source={<><strong>整批梯度</strong><small>一次 Optimizer Step</small></>}
      target={<><strong><MathVersion version="b+1" /></strong><small>下一 Batch 从新状态检索</small></>} />
    <div className="p7-update-types"><span className="p7-update-type p7-update-type--prompt">更新：命中的 Prompt</span><span className="p7-update-type p7-update-type--key">更新：命中的 Key</span><span className="p7-update-type p7-update-type--classifier">更新：共享 φ</span><span className="p7-update-type p7-update-type--frozen">冻结：f<sub>e</sub>、f<sub>r</sub></span></div>
  </section>;
}

function LossContract() {
  return <section className="p7-loss-contract-section" aria-labelledby="p7-loss-heading">
    <div className="p7-section-intro"><span className="p7-section-kicker">P7 · 一次 Mini-batch</span><h3 id="p7-loss-heading">两个损失，各自更新不同参数</h3>
      <p>分类误差让被选中的 Prompt 支持正确预测；匹配误差直接训练被选中的 Key，让下一次检索使用更新后的寻址依据。</p></div>
    <div className="p7-loss-contract">
      <article className="p7-loss-contract-card p7-loss-contract-card--classification">
        <span className="p7-loss-tag">分类目标</span>
        <div className="p7-equation-wrap"><math display="block"><mrow><msub><mi>L</mi><mi>cls</mi></msub><mrow><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>)</mo></mrow><mo>=</mo><mi mathvariant="normal">CE</mi><mrow><mo>(</mo><msub><mi>g</mi><mi>φ</mi></msub><mrow><mo>(</mo><mi>h</mi><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow><mo>)</mo></mrow><mo>,</mo><mi>y</mi><mo>)</mo></mrow></mrow></math></div>
        <p>梯度到达当前样本选中的 Prompt 与共享分类器 φ。冻结 ViT 的计算图仍可传递梯度。</p>
      </article>
      <article className="p7-loss-contract-card p7-loss-contract-card--matching">
        <span className="p7-loss-tag">寻址目标</span>
        <div className="p7-equation-wrap"><math display="block"><mrow><msub><mi>L</mi><mi>match</mi></msub><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow><mo>=</mo><munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow></mrow></munder><mi>γ</mi><mrow><mo>(</mo><mi>q</mi><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo></mrow></mrow></math></div>
        <p>距离函数对 Key 可微，硬 Top‑5 返回离散索引；匹配损失直接训练当前选中的 Key。</p>
      </article>
    </div>
    <p className="p7-joint-objective"><strong>联合目标</strong><math><mi>L</mi><mo>=</mo><msub><mi>L</mi><mi>cls</mi></msub><mo>+</mo><mi>λ</mi><msub><mi>L</mi><mi>match</mi></msub></math><span>Prompt、Key 与共享分类器可训练；ViT 主干冻结。</span></p>
  </section>;
}

function KeyGradientStudy() {
  const playback = useLessonPlayback(2_200);
  const progress = easeInOut(playback.position / playback.duration);
  const key = {
    x: P7_EXAMPLE_GRADIENT.initialKey.x + (P7_EXAMPLE_GRADIENT.updatedKey.x - P7_EXAMPLE_GRADIENT.initialKey.x) * progress,
    y: P7_EXAMPLE_GRADIENT.initialKey.y + (P7_EXAMPLE_GRADIENT.updatedKey.y - P7_EXAMPLE_GRADIENT.initialKey.y) * progress,
  };
  const distance = distanceFromExampleKey(key);
  const origin = { x: 70, y: 130 };
  const scale = 92;
  return <section className="p7-key-study" aria-labelledby="p7-key-study-heading">
    <div className="p7-key-study__copy">
      <span className="p7-section-kicker">单 Key · 可复算 SGD 教学例子</span>
      <h3 id="p7-key-study-heading">距离连续下降，索引仍然离散</h3>
      <p>单独看一个已选 Key 的局部梯度，避免把它误读成整个 Mini-batch 的参数轨迹。</p>
      <div className="p7-key-equations">
        <div className="p7-equation-wrap"><math display="block"><mi>γ</mi><mo>(</mo><mi>q</mi><mo>,</mo><mi>k</mi><mo>)</mo><mo>=</mo><mn>1</mn><mo>−</mo><mfrac><mrow><mi>q</mi><mo>·</mo><mi>k</mi></mrow><mrow><mo>∥</mo><mi>q</mi><mo>∥</mo><mo>∥</mo><mi>k</mi><mo>∥</mo></mrow></mfrac></math></div>
        <div className="p7-equation-wrap"><math display="block"><mi>q</mi><mo>=</mo><mo>(</mo><mn>1</mn><mo>,</mo><mn>0</mn><mo>)</mo><mo>,</mo><mi>k</mi><mo>=</mo><mo>(</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>)</mo><mo>,</mo><mi>η</mi><mo>=</mo><mn>0.2</mn></math></div>
        <div className="p7-equation-wrap"><math display="block"><mo>∇</mo><msub><mi>k</mi><mi>0</mi></msub><mi>γ</mi><mo>=</mo><mo>(</mo><mo>−</mo><mn>1</mn><mo>,</mo><mn>0</mn><mo>)</mo><mo>;</mo><mi>k</mi><mo>′</mo><mo>=</mo><mi>k</mi><mo>−</mo><mi>η</mi><mo>∇</mo><mi>γ</mi><mo>=</mo><mo>(</mo><mn>0.2</mn><mo>,</mo><mn>1</mn><mo>)</mo></math></div>
      </div>
      <PlaybackControls playback={playback} label="单 Key 向量更新" />
    </div>
    <svg className="p7-key-study__plot" viewBox="0 0 260 170" role="img" aria-label={`Key 从 (0, 1) 连续移动到 (0.2, 1)，当前余弦距离 ${distance.toFixed(6)}`}>
      <line x1="26" y1={origin.y} x2="238" y2={origin.y} className="p7-study-axis" />
      <line x1={origin.x} y1="18" x2={origin.x} y2="148" className="p7-study-axis" />
      <line x1={origin.x} y1={origin.y} x2={origin.x + scale} y2={origin.y} className="p7-study-vector p7-study-vector--query" />
      <line x1={origin.x} y1={origin.y} x2={origin.x} y2={origin.y - scale} className="p7-study-vector p7-study-vector--initial" />
      <line x1={origin.x} y1={origin.y} x2={origin.x + key.x * scale} y2={origin.y - key.y * scale} className="p7-study-vector p7-study-vector--key" />
      <circle cx={origin.x} cy={origin.y - scale} r="4.5" className="p7-study-key-start" />
      <circle cx={origin.x + key.x * scale} cy={origin.y - key.y * scale} r="7" className="p7-study-key-tip" />
      <circle cx={origin.x + scale} cy={origin.y} r="5" className="p7-study-query-tip" />
      <text x="169" y="120">q = (1, 0)</text><text x="78" y="26">k(t)</text>
      <text x="112" y="158">γ = {distance.toFixed(6)}</text>
    </svg>
    <div className="p7-key-study__readout">
      <div><small>初始 γ</small><strong>1.000000</strong></div><span aria-hidden="true">→</span>
      <div><small>当前 γ</small><strong>{distance.toFixed(6)}</strong></div>
      <p>论文实验使用 Adam；这里仅演示一个 Key 的 SGD 方向，不代表完整 Batch 的优化器轨迹。</p>
    </div>
  </section>;
}

export function PromptLearning() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const progress = phaseProgress(playback.position, activePhase);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const clsProgress = flightProgress(activePhase, progress, 1);
  const matchProgress = flightProgress(activePhase, progress, 3);

  return <div className="p7-root">
    <p className="lesson-lead">P6 的分类输出现在接上真实的学习信号。两个样本分别计算分类损失和匹配损失，先汇总同一 Batch 的参数梯度，再统一写回共享的 Key、Prompt 与分类器。</p>
    <LossContract />

    <figure className="lesson-figure p7-batch-figure">
      <div className="figure-top"><strong>Mini-batch 梯度与参数写回</strong><span>两样本教学缩影 · 选集沿用 P5 · 正式 Batch 大小按实验协议</span></div>
      <div className="figure-body">
        <div className="p7-control-dock" aria-label="Batch 更新动画控制">
          <div className="p7-motion-stops" role="group" aria-label="选择 Mini-batch 更新阶段">
            {phases.map((phase, index) => <button type="button" className="lesson-choice" key={phase.short} aria-pressed={activePhase === index}
              onClick={() => playback.seek(boundaries[index] + 24)}>{index + 1}. {phase.short}</button>)}
          </div>
          <PlaybackControls playback={playback} label="从损失计算到一次 Batch 写回" />
          <p className="p7-motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>

        <section className="p7-sample-stage" aria-label="同一批次的两个样本和各自的损失">
          {P7_BATCH_SAMPLES.map(sample => <SampleCard key={sample.id} sample={sample} activePhase={activePhase}
            clsProgress={clsProgress} matchProgress={matchProgress} selectedSlot={selectedSlot}
            onSelectSlot={index => setSelectedSlot(selectedSlot === index ? null : index)} />)}
        </section>

        <div className={"p7-discrete-boundary " + (activePhase === 2 ? "is-active" : "")} aria-label="硬 Top-5 的离散选择边界">
          <span className="p7-boundary-label">硬 Top‑5</span><span className="p7-boundary-rule" aria-hidden="true"><i /></span>
          <strong>离散索引边界</strong><p>分类梯度不能穿过硬索引直接调整 Key 排名</p>
        </div>

        <BatchAccumulation activePhase={activePhase} progress={progress} />
        <GradientLedger activePhase={activePhase} selectedSlot={selectedSlot}
          onSelectSlot={index => setSelectedSlot(selectedSlot === index ? null : index)} />
        <UpdateBoundary activePhase={activePhase} progress={progress} />
        <div className="p7-index-inspector" aria-live="polite">
          {selectedSlot === null ? <><strong>索引保持身份</strong><span>样本选集并集：{P7_BATCH_INDICES.map(index => `P${index}`).join(" · ")}</span><span>共同命中：{P7_COMMON_INDICES.map(index => `P${index}`).join("、")}</span><span>每个 Pⱼ 与 kⱼ 同槽配对</span></> : <>
            <strong>槽位 {selectedSlot} 的梯度来源</strong>
            <span>Prompt P<sub>{selectedSlot}</sub>：{P7_BATCH_SAMPLES.filter(sample => sample.selected.includes(selectedSlot)).map(sample => "样本 " + sample.id).join(" + ") || "本批无直接损失梯度"}</span>
            <span>Key k<sub>{selectedSlot}</sub>：{P7_BATCH_SAMPLES.filter(sample => sample.selected.includes(selectedSlot)).map(sample => "样本 " + sample.id).join(" + ") || "本批无直接损失梯度"}</span>
            {P7_BATCH_SAMPLES.filter(sample => sample.distances[selectedSlot] !== undefined).map(sample => <span key={sample.id}>q<sub>{sample.id}</sub>–k<sub>{selectedSlot}</sub>：γ = {sample.distances[selectedSlot].toFixed(6)}</span>)}
          </>}
        </div>
      </div>
      <figcaption>每条移动标记表示一组按样本归属的梯度贡献，不表示真实高维梯度向量。P5 的 Top‑5、Prompt–Key 配对、共享槽位与未命中槽位均由同一选择快照计算；不编造 Logits、分类损失或参数变化数值。</figcaption>
    </figure>

    <KeyGradientStudy />

    <section className="p7-reading-notes">
      <h3>下一批从更新后的 Pool 重新检索</h3>
      <p>两个样本用同一份参数完成前向，分类和匹配两类损失各自返回目标参数。只有整个 Batch 的梯度累积完成后才进行一次优化器更新；下一批读取新版本的 Prompt、Key 与共享分类器。</p>
      <p className="lesson-takeaway">分类损失训练选中的 Prompt 与 φ；匹配损失训练选中的 Key；冻结 ViT 只参与特征计算，不写回。</p>
      <p className="p7-source-note">来源：原论文 §4.2–4.3、Eq. (5) 与 Appendix D Algorithm 1。二维 Key 图是单 Key 的 SGD 教学演算；论文实验配置使用 Adam。两样本仅用于解释 Batch 内梯度汇总，不代表实验 Batch 大小。</p>
    </section>
  </div>;
}
