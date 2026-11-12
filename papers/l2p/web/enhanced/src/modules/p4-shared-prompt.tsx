import type { CSSProperties } from "react";
import { useViewportMotion } from "./viewport-motion";
import "./viewport-diagrams.css";

export function P4SharedPrompt() {
  const { ref, entered } = useViewportMotion();
  return <figure className="p4-shared-prompt viewport-figure">
    <div className="viewport-drawing" ref={ref} data-entered={entered} tabIndex={0} role="region" aria-label="同一组 Prompt 在两项任务间共享">
      <svg viewBox="0 0 1060 252" role="img" aria-label="任务 B 的写回修改唯一一组 Prompt，A 和 B 后续输入均读取更新值">
        <path className="shared-prompt__read" d="M 408 114 H 264 m 8 -5 -8 5 8 5 M 652 114 H 796 m -8 -5 8 5 -8 5" />
        <text x="335" y="98" textAnchor="middle" className="viewport-muted">读取</text>
        <text x="725" y="98" textAnchor="middle" className="viewport-muted">读取</text>
        <path className="shared-prompt__write" d="M 903 165 V 206 H 530 V 170 m -5 8 5 -8 5 8" />
        <text x="716" y="230" textAnchor="middle" className="shared-prompt__write-label">任务 B 的优化器写回</text>

        <g className="shared-prompt__reader">
          <rect x="31" y="64" width="229" height="100" rx="10" />
          <text x="54" y="102">若再输入任务 A 的样本</text>
          <text x="54" y="131" className="viewport-muted">会读到改写后的 Prompt</text>
        </g>
        <g className="shared-prompt__reader">
          <rect x="800" y="64" width="229" height="100" rx="10" />
          <text x="823" y="102">任务 B 的后续输入</text>
          <text x="823" y="131" className="viewport-muted">也读取这一组 Prompt</text>
        </g>

        <rect x="411" y="53" width="238" height="114" rx="12" className="shared-prompt__slot" />
        <text x="530" y="81" textAnchor="middle" className="shared-prompt__label">共享参数 · 只有一组</text>
        <rect x="468" y="102" width="124" height="42" rx="6" className="shared-prompt__param" />
        <text x="530" y="131" textAnchor="middle" className="shared-prompt__value shared-prompt__old">P</text>
        <text x="530" y="131" textAnchor="middle" className="shared-prompt__value shared-prompt__new">P′</text>
        <g transform="translate(903 165)"><circle r="5.5" className="shared-prompt__write-pulse" /></g>
        <g transform="translate(408 114)"><circle r="5" className="shared-prompt__read-pulse" style={{ "--read-x": "-144px" } as CSSProperties} /></g>
        <g transform="translate(652 114)"><circle r="5" className="shared-prompt__read-pulse" style={{ "--read-x": "144px" } as CSSProperties} /></g>
      </svg>
    </div>
    <figcaption>任务 B 改写的是两边共用的参数。即使 A 的数据没有参与这次更新，它之后也会读到新值；旧任务表现是否下降还需要实测。</figcaption>
  </figure>;
}
