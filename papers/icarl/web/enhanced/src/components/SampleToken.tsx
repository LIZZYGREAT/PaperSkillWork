import type { Sample } from "../data/icarl-runtime";
import { CLASS_VISUALS, sampleModifier } from "../data/icarl-runtime";

export type SampleTokenRole = "raw" | "incoming" | "exemplar" | "selected" | "removed" | "ghost";

export function SampleToken({ sample, role = "raw", order, compact = false }: {
  sample: Sample;
  role?: SampleTokenRole;
  order?: number;
  compact?: boolean;
}) {
  const visual = CLASS_VISUALS[sample.classId];
  const label = `${visual.label}, sample ${sample.id}${order ? `, exemplar priority ${order}` : ""}, role ${role}`;
  return (
    <span
      className={`sample-token sample-token--${role}${compact ? " sample-token--compact" : ""}`}
      aria-label={label}
      title={label}
      data-sample-id={sample.id}
      data-class-id={sample.classId}
    >
      <span className="sample-token__glyph" style={{ color: visual.color }} aria-hidden="true">{visual.glyph}<small>{sampleModifier(sample.id)}</small></span>
      <span className="sample-token__class">{sample.classId}</span>
      <span className="sample-token__id">{sample.id}</span>
      {role !== "raw" ? <span className="sample-token__role" aria-hidden="true">{role === "incoming" ? "in" : role === "exemplar" ? "mem" : role === "selected" ? "sel" : role === "removed" ? "tail" : role}</span> : null}
      {order ? <span className="sample-token__order" aria-hidden="true">p{order}</span> : null}
    </span>
  );
}
