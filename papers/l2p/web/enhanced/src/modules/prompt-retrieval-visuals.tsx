import { useId, useMemo, type CSSProperties } from "react";
import { promptPoolConfig, type CandidateScore, type SelectionSnapshot } from "./prompt-retrieval-data";

const subscripts = "₀₁₂₃₄₅₆₇₈₉";
export const formatSubscript = (index: number) => String(index).replace(/\d/g, digit => subscripts[Number(digit)]);
export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const eased = (value: number) => value * value * (3 - 2 * value);

export function PromptTokens() {
  return <span className="p5-token-strip" role="img" aria-label={promptPoolConfig.promptLength + " 个 Prompt Token"}>
    {Array.from({ length: promptPoolConfig.promptLength }, (_, index) => <i key={index} />)}
  </span>;
}

const center = 166;
const circleRadius = 105;
const point = (degrees: number, radius: number) => {
  const angle = degrees * Math.PI / 180;
  return [center + radius * Math.cos(angle), center - radius * Math.sin(angle)] as const;
};

export function VectorSpace({ snapshot, candidate, progress }: {
  snapshot: SelectionSnapshot; candidate: CandidateScore; progress: number;
}) {
  const marker = useId();
  const queryAngle = snapshot.query.angleDegrees;
  const keyAngle = candidate.key.angleDegrees;
  const sweep = (keyAngle - queryAngle + 540) % 360 - 180;
  const [qx, qy] = point(queryAngle, circleRadius - 2);
  const [kx, ky] = point(keyAngle, circleRadius - 2);
  const arcStart = point(queryAngle, 62);
  const arcEnd = point(queryAngle + sweep * progress, 62);

  return <svg className="p5-vector-space" viewBox="0 0 332 332" role="img"
    aria-label={`Query ${snapshot.query.id} 与 Key ${candidate.index} 的二维向量夹角 ${candidate.thetaDegrees.toFixed(0)} 度`}>
    <defs>
      <marker id={marker + "-query"} viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
        <path className="p5-query-arrow" d="M0 0 L8 4 L0 8 Z" />
      </marker>
      <marker id={marker + "-key"} viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
        <path className="p5-key-arrow" d="M0 0 L8 4 L0 8 Z" />
      </marker>
    </defs>
    <circle className="p5-vector-ring" cx={center} cy={center} r={circleRadius} />
    <line className="p5-vector-axis" x1={center - circleRadius} y1={center} x2={center + circleRadius} y2={center} />
    <line className="p5-vector-axis" x1={center} y1={center - circleRadius} x2={center} y2={center + circleRadius} />
    <path className="p5-angle" d={`M ${arcStart.join(" ")} A 62 62 0 0 ${sweep < 0 ? 1 : 0} ${arcEnd.join(" ")}`} />
    <line className="p5-query-vector" x1={center} y1={center} x2={qx} y2={qy} markerEnd={`url(#${marker}-query)`} />
    <line className="p5-key-vector" x1={center} y1={center} x2={kx} y2={ky} markerEnd={`url(#${marker}-key)`} />
    <circle cx={center} cy={center} r="3" className="p5-query-arrow" />
    {snapshot.candidates.map(item => {
      const [x, y] = point(item.key.angleDegrees, circleRadius);
      const [tx, ty] = point(item.key.angleDegrees, 131);
      return <g key={item.index} className="p5-ring-key" data-active={item.index === candidate.index}>
        <circle cx={x} cy={y} r="4" />
        <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central">k{formatSubscript(item.index)}</text>
      </g>;
    })}
  </svg>;
}

function buildRankMoves(snapshot: SelectionSnapshot) {
  const items = [...snapshot.candidates];
  return snapshot.ranking.flatMap((target, to) => {
    const from = items.indexOf(target);
    if (from === to) return [];
    const before = [...items];
    items.splice(from, 1);
    items.splice(to, 0, target);
    return [{ before, from, to }];
  });
}

export function CandidateBars({ snapshot, progress }: { snapshot: SelectionSnapshot; progress: number }) {
  const moves = useMemo(() => buildRankMoves(snapshot), [snapshot]);
  const ranked = progress >= 1;
  const step = progress * moves.length;
  const move = moves[Math.floor(step)];
  const time = step % 1;
  const slide = eased(clamp01((time - .24) / .52));
  const lift = eased(Math.min(clamp01(time / .24), clamp01((1 - time) / .24)));
  const items = ranked ? snapshot.ranking : move?.before ?? snapshot.candidates;
  return <ol className="p5-rank-bars" aria-label={ranked ? "按余弦距离升序排列" : "余弦距离候选"}
    data-ranked={ranked} data-sorting={progress > 0 && !ranked}>
    {items.map((item, position) => {
      const lifted = move?.from === position;
      const target = lifted ? move.to : move && position >= move.to && position < move.from ? position + 1 : position;
      const style = {
        "--slot": position + 1,
        "--compact-col": position % 5 + 1,
        "--compact-row": Math.floor(position / 5) + 1,
        "--rank-x": (target - position) * slide * 100 + "%",
        "--lift": lifted ? lift : 0,
        "--compact-x": (target % 5 - position % 5) * slide * 100 + "%",
        "--compact-y": (Math.floor(target / 5) - Math.floor(position / 5)) * slide,
        "--distance": item.distance / 2,
      } as CSSProperties;
      return <li key={item.index} data-key={item.index} data-lifted={Boolean(lifted && lift > 0)}
        data-selected={ranked && position < promptPoolConfig.topN} style={style}>
        <span className="p5-distance-track" aria-hidden="true"><i /></span>
        <strong>k{formatSubscript(item.index)}</strong>
        <span>{item.distance.toFixed(3)}</span>
      </li>;
    })}
  </ol>;
}

export function PromptShelf({ snapshot, progress }: { snapshot: SelectionSnapshot; progress: number }) {
  const reading = Math.floor(progress);
  return <div className="p5-prompt-shelf" aria-label="固定源池与本次读取的 Prompt">
    <strong className="p5-shelf-heading">源池 · 槽位固定</strong>
    {snapshot.candidates.map(({ index }) => <div key={index} className="p5-source-pair"
      data-slot={index} data-reading={progress > 0 && snapshot.selected[reading]?.index === index}>
      <span>k{formatSubscript(index)}</span><strong>P{formatSubscript(index)}</strong>
    </div>)}
    <strong className="p5-shelf-heading p5-read-heading">本次使用的 Prompt · 按距离次序</strong>
    {snapshot.selected.map(({ index }, rank) => {
      const amount = clamp01(progress - rank);
      const distance = (index - 0.5 - (rank * 2 + 1)) * 50;
      const style = { "--copy-x": distance * (1 - eased(clamp01(amount / .65))) + "%",
        "--copy-y": 1 - eased(clamp01((amount - .65) / .35)) } as CSSProperties;
      return <div className="p5-copy-target" key={index}>
        {amount > 0 && <div className="p5-copy" data-copy={index} data-arrived={amount >= 1} style={style}>
          <strong>P{formatSubscript(index)}</strong><PromptTokens />
        </div>}
      </div>;
    })}
  </div>;
}

export function QueryOverlap({ first, second }: { first: SelectionSnapshot; second: SelectionSnapshot }) {
  const a = first.selectedKeyIndices;
  const b = second.selectedKeyIndices;
  const groups = [
    { label: "仅 A 命中", indices: a.filter(index => !b.includes(index)) },
    { label: "A、B 共同命中", indices: a.filter(index => b.includes(index)) },
    { label: "仅 B 命中", indices: b.filter(index => !a.includes(index)) },
  ];
  return <div className="p5-overlap" role="group" aria-label="两个选集的交集与差集">
    {groups.map(group => <div key={group.label}>
      <strong>{group.label}</strong>
      <div>{group.indices.map(index => <span key={index}>P{formatSubscript(index)}</span>)}</div>
    </div>)}
  </div>;
}
