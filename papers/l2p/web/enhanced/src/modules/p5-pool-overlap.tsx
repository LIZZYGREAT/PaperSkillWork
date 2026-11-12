import type { CSSProperties } from "react";
import { promptPoolConfig, type SelectionSnapshot } from "./prompt-retrieval-data";
import { useViewportMotion } from "./viewport-motion";
import "./viewport-diagrams.css";

const top = 61;
const center = 127;
const bottom = 193;
const pool = Array.from({ length: promptPoolConfig.poolSize }, (_, index) => index + 1);

export function QueryOverlap({ first, second }: { first: SelectionSnapshot; second: SelectionSnapshot }) {
  const { ref, entered } = useViewportMotion();
  const a = first.selectedKeyIndices;
  const b = second.selectedKeyIndices;
  const shared = pool.filter(index => a.includes(index) && b.includes(index));
  return <figure className="p5-overlap viewport-figure">
    <div className="viewport-drawing" ref={ref} data-entered={entered} tabIndex={0} role="region" aria-label="两份选集与固定源池">
      <svg viewBox="0 0 1060 247" role="img"
        aria-label={`A 取 ${a.join("、")} 号，B 取 ${b.join("、")} 号；共用 ${shared.join("、")} 号，原槽位不动`}>
        <g className="pool-overlap__labels">
          <text x="28" y={top - 5}>图像 A 的选集</text>
          <text x="28" y={top + 16} className="viewport-muted">{a.length} 组 Prompt</text>
          <text x="28" y={center - 5}>同一个源池</text>
          <text x="28" y={center + 16} className="viewport-muted">{pool.length} 个固定槽位</text>
          <text x="28" y={bottom - 5}>图像 B 的选集</text>
          <text x="28" y={bottom + 16} className="viewport-muted">{b.length} 组 Prompt</text>
        </g>
        <path className="pool-overlap__rail" d={`M 165 ${top} H 1024 M 165 ${center} H 1024 M 165 ${bottom} H 1024`} />
        {pool.map((index, offset) => {
          const isShared = shared.includes(index);
          const x = 204 + offset * 86;
          const destinations = [{ row: "a", selected: a.includes(index), y: top }, { row: "b", selected: b.includes(index), y: bottom }];
          return <g key={index} transform={`translate(${x} 0)`} data-pool-slot={index} data-shared={isShared}>
            {isShared && <rect className="pool-overlap__shared" x="-35" y="19" width="70" height="209" rx="10" />}
            {destinations.map(({ row, selected, y }) => <g key={row}>
              <rect className="pool-overlap__socket" x="-27" y={y - 17} width="54" height="34" rx="6" />
              {selected && <path className="pool-overlap__stem" d={`M 0 ${center} V ${y}`} />}
            </g>)}
            {destinations.map(({ row, selected, y }) => selected && <g key={row} transform={`translate(0 ${y})`}>
              <g className="pool-overlap__copy" data-branch={row} data-copy={index}
                style={{ "--from-y": `${center - y}px`, "--delay": `${(row === "a" ? 180 : 580) + offset * 44}ms` } as CSSProperties}>
                <rect x="-27" y="-17" width="54" height="34" rx="6" />
                <text y="5" textAnchor="middle">P<tspan fontSize="12" dy="4">{index}</tspan></text>
              </g>
            </g>)}
            <rect className="pool-overlap__slot" x="-32" y={center - 20} width="64" height="40" rx="6" />
            <text className="pool-overlap__slot-label" y={center + 5} textAnchor="middle">{index} 号</text>
          </g>;
        })}
      </svg>
    </div>
    <figcaption>紫色底带把上下两份选集对在同一槽位上：{shared.join("、")} 号被共同读取，其余入选项只供各自的输入使用。池中原来的 Prompt 没有被移走。</figcaption>
  </figure>;
}
