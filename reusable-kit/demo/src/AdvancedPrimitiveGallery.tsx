import { Button } from "../../foundation/controls/Button";
import { MiniNetworkGlyph, type MiniNetworkConnection } from "../../foundation/neural-network";
import { useAnimationTimeline, type TimelineClip } from "../../foundation/animation";
import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { GalleryCodePanel } from "./GalleryCodePanel";
const networkClips: TimelineClip[] = [
  { id: "input", durationMs: 850, holdMs: 350 },
  { id: "hidden", durationMs: 950, holdMs: 350 },
  { id: "output", durationMs: 800, holdMs: 450 },
];
const pipelineClips: TimelineClip[] = [
  { id: "read", durationMs: 700, holdMs: 250 },
  { id: "transform", durationMs: 850, holdMs: 250 },
  { id: "validate", durationMs: 650, holdMs: 300 },
  { id: "write", durationMs: 700, holdMs: 350 },
];

function TimelineControls({ timeline }: { timeline: ReturnType<typeof useAnimationTimeline> }) {
  const { state, controls } = timeline;
  return <div className="pg-timeline__controls" aria-label="Timeline controls">
    <Button size="small" onClick={controls.toggle} disabled={state.atEnd}>{state.status === "playing" ? "Pause" : state.atEnd ? "Complete" : "Play / advance"}</Button>
    <Button variant="secondary" size="small" onClick={controls.stepBack} disabled={!state.hasPrevious}>Previous</Button>
    <Button variant="secondary" size="small" onClick={controls.stepForward} disabled={!state.hasNext}>Next</Button>
    <Button variant="secondary" size="small" onClick={controls.replayClip}>Replay</Button>
    <span role="status">{state.clipId ?? "empty"} · {Math.round(state.progress * 100)}%{state.isHolding ? " · hold" : ""}</span>
  </div>;
}

function NetworkTimelineExample() {
  const timeline = useAnimationTimeline({ clips: networkClips });
  const active = timeline.state.clipId ?? "input";
  const phase = Math.max(0, timeline.state.clipIndex);
  const connections: MiniNetworkConnection[] = [
    { id: "input-hidden", fromLayer: "input", fromNode: 1, toLayer: "hidden", toNode: 1, progress: phase === 0 ? 0 : phase === 1 ? timeline.state.progress : 1 },
    { id: "hidden-output", fromLayer: "hidden", fromNode: 1, toLayer: "output", toNode: 0, progress: phase < 2 ? 0 : timeline.state.progress },
  ];
  const focus = active === "input"
    ? { nodes: ["input:1"], edges: [] }
    : active === "hidden"
      ? { nodes: ["input:1", "hidden:1"], edges: ["input-hidden"] }
      : { nodes: ["input:1", "hidden:1", "output:0"], edges: ["input-hidden", "hidden-output"] };
  return <article className="pg-timeline" data-timeline-example="network" data-clip={timeline.state.clipId} data-progress={timeline.state.progress.toFixed(3)} data-holding={timeline.state.isHolding}>
    <header><span>SCENE A · NETWORK FLOW</span><h3>Forward progress along a retained path</h3></header>
    <MiniNetworkGlyph label="Illustrative forward flow" description="Timeline focus is illustrative and does not encode a paper algorithm."
      layers={[{ id: "input", label: "Input", nodeCount: 3 }, { id: "hidden", label: "Representation", nodeCount: 5 }, { id: "output", label: "Output", nodeCount: 2 }]}
      connections={connections} focus={focus} />
    <TimelineControls timeline={timeline} />
  </article>;
}

function PipelineTimelineExample() {
  const timeline = useAnimationTimeline({ clips: pipelineClips });
  const index = timeline.state.clipIndex;
  return <article className="pg-timeline" data-timeline-example="pipeline" data-clip={timeline.state.clipId} data-progress={timeline.state.progress.toFixed(3)} data-holding={timeline.state.isHolding}>
    <header><span>SCENE B · DATA PIPELINE</span><h3>Read, transform, validate, and write</h3></header>
    <ol className="pg-pipeline">
      {pipelineClips.map((clip, clipIndex) => <li key={clip.id} data-stage={clip.id} data-state={clipIndex < index ? "done" : clipIndex === index ? "active" : "waiting"}>
        <span>{String(clipIndex + 1).padStart(2, "0")}</span><strong>{clip.id}</strong><small>{clipIndex === index ? `${Math.round(timeline.state.progress * 100)}%${timeline.state.isHolding ? " · hold" : ""}` : clipIndex < index ? "complete" : "waiting"}</small>
      </li>)}
    </ol>
    <TimelineControls timeline={timeline} />
  </article>;
}

const timelineCode = `import { useAnimationTimeline } from "./shared/foundation/animation/useAnimationTimeline";

const clips = [
  { id: "read", durationMs: 700, holdMs: 250 },
  { id: "transform", durationMs: 850, holdMs: 250 },
  { id: "write", durationMs: 700 },
];

export function PipelineTimeline() {
  const timeline = useAnimationTimeline({ clips, autoPlay: false });
  const { state, controls } = timeline;
  return <section data-clip={state.clipId} data-progress={state.progress}>
    <p>{state.clipId} · {Math.round(state.progress * 100)}% {state.isHolding ? "hold" : ""}</p>
    <button onClick={controls.toggle}>Play / pause</button>
    <button onClick={controls.stepBack}>Previous</button>
    <button onClick={controls.stepForward}>Next</button>
    <button onClick={controls.replayClip}>Replay</button>
  </section>;
}`;

export function TimelineGallerySection() {
  return <section id="gallery-timeline" className="pattern-gallery__section" aria-labelledby="gallery-timeline-title">
    <SectionHeader index="06" eyebrow="FOUNDATION / TIMELINE" title="One clock, several derived visual regions" lead="The hook owns only clip time and navigation. Network emphasis and a data pipeline derive their visible state from it without adding local timers." headingId="gallery-timeline-title" />
    <div className="pg-timeline-grid"><NetworkTimelineExample /><PipelineTimelineExample /></div>
    <div className="pattern-gallery__facts"><dl>
      <div><dt>Use</dt><dd>Several visual regions must share motion progress, hold states, pause, replay, stepping, or direct clip jumps.</dd></div>
      <div><dt>Do not use</dt><dd>A single short CSS transition, reverse-only micro replay, or as a container for paper algorithms and business state.</dd></div>
      <div><dt>Reduced motion</dt><dd>Each clip starts at a meaningful completed state; Play never restarts continuous motion, while Next/Previous remain usable.</dd></div>
      <div><dt>Source</dt><dd><code>foundation/animation/useAnimationTimeline.ts</code>; generic easing helpers live beside it. Gallery defaults to <code>autoPlay: false</code>.</dd></div>
    </dl></div>
    <GalleryCodePanel title="Open runnable timeline example" code={timelineCode} source="recipes/animation-timeline.md" level="runnable" notice="Complete TSX. Derive every moving region from timeline.state; do not add a second setTimeout/RAF clock." />
  </section>;
}
