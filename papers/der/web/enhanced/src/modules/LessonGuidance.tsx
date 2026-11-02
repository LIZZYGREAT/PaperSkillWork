import { useId } from 'react';

export function LessonCue({ steps, active, title, detail }: {
  steps: readonly string[];
  active: number;
  title: string;
  detail: string;
}) {
  return <div className="lesson-cue" data-attention={active}>
    <ol aria-label="观察顺序">{steps.map((step, i) => <li key={step} aria-current={i === active ? 'step' : undefined}><span>{i + 1}</span>{step}</li>)}</ol>
    <div className="lesson-cue-reading" aria-live="polite"><strong>{title}</strong><span>{detail}</span></div>
  </div>;
}

/** D1's masked stroke: dash spacing stays constant as the route is revealed. */
export function LessonPath({ d, progress = 1, tone = 'data', className = '' }: {
  d: string;
  progress?: number;
  tone?: 'data' | 'history' | 'gradient';
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const colors = { data: '#58836c', history: '#668796', gradient: '#a67840' };
  return <g className={`lesson-path ${className}`} data-path-tone={tone} data-path-progress={progress}>
    <defs>
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1120" height="640">
        <path d={d} pathLength="1" fill="none" stroke="white" strokeWidth="10" strokeDasharray="1" strokeDashoffset={1 - progress} />
      </mask>
      <marker id={`${id}-head`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M1 1L7 4L1 7" fill="none" stroke={colors[tone]} strokeWidth="1.3" />
      </marker>
    </defs>
    <path d={d} fill="none" stroke={colors[tone]} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tone === 'gradient' ? '4 4' : undefined} mask={`url(#${id}-mask)`} markerEnd={progress >= .99 ? `url(#${id}-head)` : undefined} />
  </g>;
}
