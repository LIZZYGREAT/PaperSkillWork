import { useId, useLayoutEffect, useRef } from "react";
import { promptPoolConfig, type CandidateScore, type SelectionSnapshot } from "./prompt-retrieval-data";

const cx = 244;
const cy = 205;
const vectorRadius = 137;
const arcRadius = 46;

function polarPoint(angleDegrees: number, radius: number) {
  const angle = angleDegrees * Math.PI / 180;
  return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
}

function angleArc(candidate: CandidateScore, queryAngle: number) {
  let delta = ((candidate.key.angleDegrees - queryAngle + 540) % 360) - 180;
  if (delta === -180) delta = 180;
  const start = polarPoint(queryAngle, arcRadius);
  const end = polarPoint(queryAngle + delta, arcRadius);
  const sweep = delta >= 0 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${arcRadius} ${arcRadius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

function subscript(index: number) {
  return String(index).replace(/\d/g, digit => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]);
}

function MathIndex({ base, index }: { base: string; index: number }) {
  return <math><msub><mi>{base}</mi><mn>{index}</mn></msub></math>;
}

function TokenRow({ className = "" }: { className?: string }) {
  return <span className={`p5-token-row ${className}`} aria-label="5 个 Prompt Token">
    {Array.from({ length: promptPoolConfig.promptLength }, (_, offset) => <i key={offset} aria-hidden="true" />)}
  </span>;
}

export function RetrievalVectorSpace({
  snapshot,
  activeCandidateIndex,
  selectedIndices,
  phase,
  onInspectKey,
}: {
  snapshot: SelectionSnapshot;
  activeCandidateIndex: number | null;
  selectedIndices: readonly number[];
  phase: number;
  onInspectKey: (index: number) => void;
}) {
  const markerId = `p5-query-arrow-${useId().replace(/:/g, "")}`;
  const queryAngle = snapshot.query.angleDegrees;
  const queryScreenLabel = snapshot.query.id;
  const current = activeCandidateIndex === null ? undefined : snapshot.candidates.find(candidate => candidate.index === activeCandidateIndex);
  const selected = new Set(phase >= 3 ? selectedIndices : []);

  return <section className="p5-vector-panel" aria-label="Query 与十个 Key 的二维单位向量示例">
    <div className="p5-region-heading">
      <h3>向量空间</h3>
      <span>二维单位向量 · 比较方向夹角</span>
    </div>
    <svg className="p5-vector-space" viewBox="0 0 500 410" role="group" aria-labelledby={`${markerId}-title ${markerId}-desc`}>
      <title id={`${markerId}-title`}>当前 Query 与十个固定 Key 的向量方向</title>
      <desc id={`${markerId}-desc`}>单位圆仅用于解释余弦距离。选择一个 Key 可跳到该候选的比较步骤。</desc>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" />
        </marker>
      </defs>
      <circle className="p5-unit-circle" cx={cx} cy={cy} r={vectorRadius} />
      <line className="p5-axis" x1={cx - vectorRadius - 14} y1={cy} x2={cx + vectorRadius + 14} y2={cy} />
      <line className="p5-axis" x1={cx} y1={cy - vectorRadius - 14} x2={cx} y2={cy + vectorRadius + 14} />
      <text className="p5-axis-label" x={cx + vectorRadius + 19} y={cy + 5}>x₁</text>
      <text className="p5-axis-label" x={cx + 5} y={cy - vectorRadius - 20}>x₂</text>

      {snapshot.candidates.map(candidate => {
        const point = polarPoint(candidate.key.angleDegrees, vectorRadius);
        const label = polarPoint(candidate.key.angleDegrees, vectorRadius + 25);
        const isActive = candidate.index === activeCandidateIndex;
        const isSelected = selected.has(candidate.index);
        const anchor = Math.cos(candidate.key.angleDegrees * Math.PI / 180) >= 0 ? "start" : "end";
        const dy = Math.sin(candidate.key.angleDegrees * Math.PI / 180) > 0.78 ? 5 : -2;
        return <g
          key={candidate.index}
          className={`p5-key-vector ${isActive ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={`查看 Key k${candidate.index}：夹角 ${candidate.thetaDegrees.toFixed(0)} 度，余弦距离 ${candidate.distance.toFixed(3)}`}
          aria-pressed={isActive}
          onClick={() => onInspectKey(candidate.index)}
          onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onInspectKey(candidate.index);
            }
          }}
        >
          <line className="p5-key-ray" x1={cx} y1={cy} x2={point.x} y2={point.y} />
          <circle className="p5-key-point" cx={point.x} cy={point.y} r={isActive ? 7 : 5.5} />
          <text className="p5-key-label" x={label.x} y={label.y + dy} textAnchor={anchor}>k{subscript(candidate.index)}</text>
        </g>;
      })}

      {current && <g className="p5-active-angle" aria-hidden="true">
        <path d={angleArc(current, queryAngle)} />
        <text x={polarPoint(queryAngle + ((((current.key.angleDegrees - queryAngle + 540) % 360) - 180) / 2), arcRadius + 19).x}
          y={polarPoint(queryAngle + ((((current.key.angleDegrees - queryAngle + 540) % 360) - 180) / 2), arcRadius + 19).y}>θ</text>
      </g>}

      <g
        className="p5-query-direction"
        style={{ transform: `rotate(${-queryAngle}deg)`, transformOrigin: `${cx}px ${cy}px` }}
      >
        <line x1={cx} y1={cy} x2={cx + vectorRadius} y2={cy} markerEnd={`url(#${markerId})`} />
        <circle cx={cx + vectorRadius} cy={cy} r="7" />
        <g className="p5-query-label" style={{ transform: `rotate(${queryAngle}deg)` }}>
          <rect x={cx + vectorRadius + 9} y={cy - 15} width="48" height="27" rx="7" />
          <text x={cx + vectorRadius + 33} y={cy + 4} textAnchor="middle">q<tspan baselineShift="sub" fontSize="10">{queryScreenLabel}</tspan></text>
        </g>
      </g>
      <circle className="p5-vector-origin" cx={cx} cy={cy} r="4" />
    </svg>

    {current && phase > 0 ? <div className="p5-distance-readout" aria-live="polite">
      <div><strong>当前比较</strong><span>q<sub>{snapshot.query.id}</sub> ↔ k{subscript(current.index)}</span></div>
      <div className="p5-distance-steps">
        <math><mi>θ</mi><mo>=</mo><mn>{current.thetaDegrees.toFixed(0)}</mn><mo>°</mo></math>
        <math><mi>cos</mi><mi>θ</mi><mo>=</mo><mn>{current.cosineSimilarity.toFixed(6)}</mn></math>
        <math><mi>γ</mi><mo>=</mo><mn>1</mn><mo>−</mo><mi>cos</mi><mi>θ</mi><mo>=</mo><mn>{current.distance.toFixed(6)}</mn><mo>≈</mo><mn>{current.distance.toFixed(3)}</mn></math>
      </div>
    </div> : <div className="p5-distance-readout is-pending">
      <div><strong>距离从夹角得到</strong><span>播放或选择一个 Key，查看单项计算</span></div>
      <math><mi>γ</mi><mo>(</mo><mi>q</mi><mo>,</mo><mi>k</mi><mo>)</mo><mo>=</mo><mn>1</mn><mo>−</mo><mi>cos</mi><mi>θ</mi></math>
    </div>}

    <div className="p5-geometry-legend" aria-label="向量图例">
      <span><i className="p5-legend-query" />Query q(x)</span>
      <span><i className="p5-legend-key" />Key kⱼ</span>
      <span><i className="p5-legend-selected" />Top‑5 Key</span>
    </div>
    <p className="p5-vector-note">所有向量长度归一为 1；弧线标的是最小夹角 θ。余弦距离取自 1−cosθ，不是两端点之间的弦长。</p>
  </section>;
}

export function CandidateLedger({
  snapshot,
  activeCandidateIndex,
  completedIndices,
  phase,
  onInspectKey,
}: {
  snapshot: SelectionSnapshot;
  activeCandidateIndex: number | null;
  completedIndices: ReadonlySet<number>;
  phase: number;
  onInspectKey: (index: number) => void;
}) {
  const refs = useRef(new Map<number, HTMLLIElement>());
  const previousTops = useRef(new Map<number, number>());
  const hasMeasured = useRef(false);
  const frame = useRef<number | null>(null);
  const sorted = phase >= 3;
  const records = sorted ? snapshot.ranking : snapshot.candidates;
  const orderKey = `${snapshot.query.id}:${sorted ? "ranked" : "pool"}`;

  useLayoutEffect(() => {
    const elements = records.flatMap(record => {
      const element = refs.current.get(record.index);
      return element ? [{ index: record.index, element }] : [];
    });
    const nextTops = new Map(elements.map(({ index, element }) => [index, element.getBoundingClientRect().top]));
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (hasMeasured.current && sorted && !reducedMotion) {
      for (const { index, element } of elements) {
        const previousTop = previousTops.current.get(index);
        const nextTop = nextTops.get(index);
        if (previousTop === undefined || nextTop === undefined) continue;
        const delta = previousTop - nextTop;
        if (Math.abs(delta) < 1) continue;
        element.style.transition = "none";
        element.style.transform = `translateY(${delta}px)`;
      }
      void elements[0]?.element.offsetHeight;
      frame.current = requestAnimationFrame(() => {
        for (const { element } of elements) {
          element.style.transition = "";
          element.style.transform = "";
        }
      });
    }

    previousTops.current = nextTops;
    hasMeasured.current = true;
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [orderKey]);

  return <section className="p5-ledger-panel" aria-label="十个 Key 候选的角度与余弦距离计算记录">
    <div className="p5-region-heading">
      <h3>{sorted ? "距离排序 · Top‑5" : "候选计算记录"}</h3>
      <span>{sorted ? "γ 从小到大 · 最小的 5 项进入选集" : "每条记录都能回到对应 Key"}</span>
    </div>
    <div className="p5-ledger-table" role="table" aria-label={sorted ? "按距离升序排列的 Key" : "按原 Key 槽位排列的候选记录"}>
      <div className="p5-ledger-head" aria-hidden="true">
        <span>{sorted ? "排名" : "槽位"}</span>
        <span>Key → Prompt</span>
        <span>θ</span>
        <span>cos θ</span>
        <span>γ(q,k)</span>
      </div>
      <ol className={`p5-ledger-list ${sorted ? "is-ranked" : ""}`} aria-label={sorted ? "距离升序候选记录" : "按 Key 编号排列的候选记录"}>
        {records.map((candidate, rowIndex) => {
          const isComplete = sorted || completedIndices.has(candidate.index);
          const isActive = candidate.index === activeCandidateIndex && phase > 0 && phase < 3;
          const isSelected = sorted && rowIndex < promptPoolConfig.topN;
          return <li
            key={candidate.index}
            ref={element => {
              if (element) refs.current.set(candidate.index, element);
              else refs.current.delete(candidate.index);
            }}
            className={`p5-ledger-row ${isComplete ? "is-complete" : "is-pending"} ${isActive ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
            data-key-index={candidate.index}
            data-record-complete={isComplete}
          >
            <button type="button" className="p5-ledger-entry" onClick={() => onInspectKey(candidate.index)} aria-label={`跳到 Key ${candidate.index} 的余弦距离计算`}>
              <span className="p5-ledger-rank">{sorted ? `${rowIndex + 1}` : `${candidate.index}`}{isSelected && <small>Top‑5</small>}</span>
              <span className="p5-ledger-source"><b>k{subscript(candidate.index)}</b><span>↔</span><b>P{subscript(candidate.index)}</b></span>
              <span className="p5-ledger-number">{isComplete || isActive ? `${candidate.thetaDegrees.toFixed(0)}°` : "—"}</span>
              <span className="p5-ledger-number">{isComplete || isActive ? candidate.cosineSimilarity.toFixed(3) : "—"}</span>
              <span className="p5-ledger-score">{isComplete ? candidate.distance.toFixed(3) : isActive ? "计算中" : "—"}</span>
            </button>
          </li>;
        })}
      </ol>
    </div>
    <p className="p5-ledger-note">排序时移动的是这十条评分记录；Key–Prompt 源槽始终按编号留在原位。</p>
  </section>;
}

export function PromptPairPool({
  snapshot,
  activeCandidateIndex,
  phase,
  onInspectKey,
}: {
  snapshot: SelectionSnapshot;
  activeCandidateIndex: number | null;
  phase: number;
  onInspectKey: (index: number) => void;
}) {
  const selectedRanks = new Map(snapshot.selectedKeyIndices.map((index, offset) => [index, offset + 1]));
  const showSelection = phase >= 3;
  return <section className="p5-pool-panel" aria-label="固定保留的十组 Key–Prompt 配对参数">
    <div className="p5-region-heading">
      <h3>Key–Prompt Pool</h3>
      <span>M = {promptPoolConfig.poolSize} · 每组 P 有 L<sub>p</sub> = {promptPoolConfig.promptLength} 个 Token</span>
    </div>
    <div className="p5-pool-grid">
      {snapshot.candidates.map(candidate => {
        const rank = selectedRanks.get(candidate.index);
        const isSelected = showSelection && rank !== undefined;
        const isActive = candidate.index === activeCandidateIndex && phase > 0 && phase < 3;
        const slotState = isSelected ? `Top-5 排名 ${rank}` : "源参数持续保留";
        return <button
          className={`p5-pair-slot ${isActive ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
          type="button"
          key={candidate.index}
          data-key-index={candidate.index}
          aria-pressed={isActive}
          aria-label={`检查源槽 ${candidate.index}：Key k${candidate.index} 与 Prompt P${candidate.index} 配对，${slotState}`}
          onClick={() => onInspectKey(candidate.index)}
        >
          <span className="p5-pair-top"><strong><MathIndex base="k" index={candidate.index} /><span className="p5-pair-link-mark" aria-hidden="true">↔</span><MathIndex base="P" index={candidate.index} /></strong>
            <span>{isSelected ? `Top‑5 · #${rank}` : `槽位 ${candidate.index}`}</span></span>
          <span className="p5-pair-body"><span className="p5-key-shape" aria-hidden="true" /><span className="p5-prompt-word">Prompt</span><TokenRow /></span>
        </button>;
      })}
    </div>
    <div className="p5-pool-legend"><span><i className="p5-legend-key" />Key：距离检索</span><span><i className="p5-legend-prompt" />Prompt：五个可学习 Token</span><span>共同下标保持配对，检索不移动也不消耗槽位</span></div>
  </section>;
}

export function PromptReadout({
  snapshot,
  visible,
  progress,
}: {
  snapshot: SelectionSnapshot;
  visible: boolean;
  progress: number;
}) {
  return <section className={`p5-readout-panel ${visible ? "is-open" : ""}`} aria-label="本次前向所用的 Prompt 视图">
    <div className="p5-region-heading">
      <h3>本次使用视图</h3>
      <span>按 Top‑5 顺序读取</span>
    </div>
    {visible ? <>
      <div className="p5-readout-list">
        {snapshot.selected.map((candidate, order) => {
          const itemProgress = Math.max(0, Math.min(1, progress * 1.32 - order * 0.16));
          return <div className="p5-readout-entry" key={candidate.index} data-source-index={candidate.index}
            style={{ opacity: itemProgress, transform: `translateY(${(1 - itemProgress) * 9}px)` }}>
            <span className="p5-readout-origin">来自槽位 {candidate.index}</span>
            <MathIndex base="P" index={candidate.index} />
            <TokenRow className="p5-readout-tokens" />
          </div>;
        })}
      </div>
      <p className="p5-readout-note">这只是本次前向的使用视图；每组仍指向源池中的同一个 P<sub>j</sub> 参数。</p>
    </> : <div className="p5-readout-pending"><strong>等待 Top‑5 选集</strong><span>选中后，从相同编号的源槽读取 Prompt</span></div>}
  </section>;
}

export function formatSubscript(index: number) {
  return subscript(index);
}
