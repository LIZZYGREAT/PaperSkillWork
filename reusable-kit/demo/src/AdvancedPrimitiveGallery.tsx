import { useMemo, useState } from "react";
import { Button } from "../../foundation/controls/Button";
import { MiniNetworkGlyph, type MiniNetworkConnection, type MiniNetworkLayer } from "../../foundation/neural-network";
import { useAnimationTimeline, type TimelineClip } from "../../foundation/animation";
import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { GalleryCodePanel } from "./GalleryCodePanel";

const importanceLayers: MiniNetworkLayer[] = [
  { id: "signals", label: "Observed signals", nodeCount: 3 },
  { id: "shared", label: "Shared representation", nodeCount: 32, displayNodeCount: 5, detail: "Compressed structural illustration" },
  { id: "decision", label: "Decision", nodeCount: 2 },
];
const importanceConnections: MiniNetworkConnection[] = [
  { id: "signal-a", fromLayer: "signals", fromNode: 0, toLayer: "shared", toNode: 1 },
  { id: "signal-b", fromLayer: "signals", fromNode: 1, toLayer: "shared", toNode: 3, state: "muted" },
  { id: "important-a", fromLayer: "shared", fromNode: 1, toLayer: "decision", toNode: 0 },
  { id: "important-b", fromLayer: "shared", fromNode: 3, toLayer: "decision", toNode: 1, state: "muted" },
];
const roleLayers: MiniNetworkLayer[] = [
  { id: "input", label: "Shared input", nodeCount: 3 },
  { id: "reference", label: "Frozen reference", nodeCount: 4, identity: "frozen" },
  { id: "current", label: "Trainable output", nodeCount: 12, displayNodeCount: 6, identity: "trainable", detail: "Output width is illustrative, not a CNN feature block" },
];

const networkCode = `import { MiniNetworkGlyph } from "./shared/foundation/neural-network/MiniNetworkGlyph";

export function StructureExample() {
  return <MiniNetworkGlyph
    label="Frozen reference and trainable output"
    description="A structural illustration; displayed nodes are representatives."
    layers={[
      { id: "input", label: "Shared input", nodeCount: 3 },
      { id: "reference", label: "Frozen reference", nodeCount: 4, identity: "frozen" },
      { id: "output", label: "Trainable output", nodeCount: 12, displayNodeCount: 6, identity: "trainable" },
    ]}
    connectAdjacent
  />;
}`;

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
    <Button size="small" onClick={controls.toggle}>{state.status === "playing" ? "Pause" : "Play / advance"}</Button>
    <Button variant="secondary" size="small" onClick={controls.stepBack} disabled={!state.hasPrevious}>Previous</Button>
    <Button variant="secondary" size="small" onClick={controls.stepForward}>Next</Button>
    <Button variant="secondary" size="small" onClick={controls.replayClip}>Replay</Button>
    <span role="status">{state.clipId ?? "empty"} · {Math.round(state.progress * 100)}%{state.isHolding ? " · hold" : ""}</span>
  </div>;
}

function NetworkTimelineExample() {
  const timeline = useAnimationTimeline({ clips: networkClips });
  const active = timeline.state.clipId ?? "input";
  const connections: MiniNetworkConnection[] = [
    { id: "input-hidden", fromLayer: "input", fromNode: 1, toLayer: "hidden", toNode: 1 },
    { id: "hidden-output", fromLayer: "hidden", fromNode: 1, toLayer: "output", toNode: 0 },
  ];
  const focus = active === "input" ? { nodes: ["input:1"], edges: [] } : active === "hidden" ? { nodes: ["hidden:1"], edges: ["input-hidden"] } : { nodes: ["output:0"], edges: ["hidden-output"] };
  return <article className="pg-timeline" data-timeline-example="network" data-clip={timeline.state.clipId} data-progress={timeline.state.progress.toFixed(3)} data-holding={timeline.state.isHolding}>
    <header><span>SCENE A · NETWORK FLOW</span><h3>Forward attention through representative nodes</h3></header>
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

export function MiniNetworkGallerySection() {
  const [focusImportant, setFocusImportant] = useState(true);
  const focus = useMemo(() => focusImportant ? { nodes: ["shared:1"], edges: ["signal-a", "important-a"] } : undefined, [focusImportant]);
  return <section id="gallery-mini-network" className="pattern-gallery__section" aria-labelledby="gallery-mini-network-title">
    <SectionHeader index="05" eyebrow="FOUNDATION / MINI NETWORK" title="Small network structure without paper-owned computation" lead="The same SVG primitive changes its structure, identity, and connection data. It is a glyph for relationships—not a default architecture and not a CNN feature extractor." headingId="gallery-mini-network-title" />
    <div className="pattern-gallery__controls"><Button size="small" variant={focusImportant ? "primary" : "secondary"} aria-pressed={focusImportant} onClick={() => setFocusImportant((value) => !value)}>{focusImportant ? "Show all context" : "Focus example connections"}</Button></div>
    <div className="pg-network-grid">
      <article><h3>Parameter-importance illustration</h3><MiniNetworkGlyph label="Selected representative connections" description="Synthetic focus data highlights two representative connections; this is not a measured parameter score." layers={importanceLayers} connections={importanceConnections} focus={focus} /></article>
      <article><h3>Frozen / trainable structural roles</h3><MiniNetworkGlyph label="Frozen and trainable structure" description="The output-width example is distinct from a convolutional feature-block diagram." layers={roleLayers} connectAdjacent /></article>
    </div>
    <div className="pattern-gallery__facts"><dl>
      <div><dt>Use</dt><dd>Small layer/node topology, selected representative connections, or frozen/trainable identity.</dd></div>
      <div><dt>Do not use</dt><dd>Exact large architectures, CNN feature maps, probabilities, Fisher computation, gradients, or class-incremental logic.</dd></div>
      <div><dt>Responsive / access</dt><dd>SVG title/description IDs are unique per instance; labels stay HTML-sized and stack below 520px. Counts above seven are disclosed as representative.</dd></div>
      <div><dt>Source</dt><dd><code>foundation/neural-network/MiniNetworkGlyph.tsx</code> + <code>mini-network-glyph.css</code>; inspired by EWC's small node mark and checked against iCaRL/LwF role differences.</dd></div>
    </dl></div>
    <GalleryCodePanel title="Open runnable MiniNetworkGlyph example" code={networkCode} source="recipes/mini-network-glyph.md" level="runnable" notice="Complete TSX. The component imports its paired CSS; supply paper-owned labels, counts, and connection data." />
  </section>;
}

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
