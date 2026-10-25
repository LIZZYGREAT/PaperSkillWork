import { createRoot } from "react-dom/client";
import { useState } from "react";
import "../../foundation/styles/kit.css";
import { ArchitectureExplorer } from "../../core/architecture";
import type { ArchitectureSpec } from "../../core/architecture";
import { FlowStepper } from "../../core/flow-stepper";
import { PaperFigure } from "../../core/paper-figure";
import { ExpandableDetail, ReferenceHub, TermRef } from "../../core/reference";
import { ProcessLoopExplorer } from "../../core/process-loop";
import type { ProcessLoopSpec } from "../../core/process-loop";
import { ResponsibilityMap } from "../../core/responsibility-map";
import { StateMachineExplorer } from "../../core/state-machine";
import type { StateMachineSpec } from "../../core/state-machine";
import { Button } from "../../foundation/controls/Button";
import { Feedback } from "../../foundation/feedback/Feedback";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { StatusPill } from "../../foundation/feedback/StatusPill";
import { Chip } from "../../foundation/controls/Chip";
import { Slider } from "../../foundation/controls/Slider";
import { Popover } from "../../foundation/overlay/Popover";
import { MiniNetworkGlyph, validateMiniNetworkGlyph } from "../../foundation/neural-network";
import { useAnimationTimeline, validateTimelineClips, type TimelineClock, type TimelineClip } from "../../foundation/animation";
import { BenchmarkExplorer } from "../../optional/benchmark-explorer";
import { CompatibilityChecker } from "../../optional/compatibility-checker";
import { CompareView } from "../../optional/compare-view";
import { DatasetCard } from "../../optional/dataset-card";
import { EvidenceViewer } from "../../optional/evidence-viewer";
import { FormulaBlock } from "../../optional/formula";
import { MultiViewInspector } from "../../optional/multi-view";
import { RepresentationTransform } from "../../optional/representation-transform";

const process = {
  nodes: [{ id: "input", label: "Input", description: "Input detail." }, { id: "output", label: "Output", description: "Output detail." }],
  edges: [{ id: "path", from: "input", to: "output" }],
  steps: [
    { id: "first", title: "First step", summary: "Input is received.", activeNodes: ["input"], activeEdges: [] },
    { id: "second", title: "Second step", summary: "Output is produced.", activeNodes: ["output"], activeEdges: ["path"] },
  ],
};
const responsibility = { actors: [{ id: "reader", name: "Reader", can: "Inspect data." }], steps: [{ id: "owned", label: "Owned step", owners: ["reader"] }, { id: "gap", label: "Unassigned step", owners: [] }] };
const stateMachine = {
  initialState: "ready",
  states: [{ id: "ready", label: "Ready" }, { id: "trained", label: "Trained" }, { id: "done", label: "Done", terminal: true }],
  transitions: [{ from: "ready", to: "trained" }, { from: "trained", to: "done" }],
  illegalHints: [{ from: "ready", to: "done", message: "Complete training before finishing." }],
};
const semanticProcess: ProcessLoopSpec = {
  nodes: [
    { id: "origin", label: "Origin", position: { x: 150, y: 145 } },
    { id: "branch", label: "Branch", position: { x: 490, y: 145 } },
    { id: "result", label: "Result", position: { x: 490, y: 365 } },
    { id: "auto", label: "Auto layout fallback" },
  ],
  edges: [
    { id: "forward-data", from: "origin", to: "branch", kind: "data", path: "straight" },
    { id: "reverse-gradient", from: "branch", to: "result", kind: "gradient", direction: "reverse", path: "curve" },
    { id: "loop-back", from: "result", to: "origin", kind: "control", path: "orthogonal" },
  ],
  steps: [{ id: "signals", title: "Signals", summary: "Follow data, gradient, and control paths.", activeNodes: ["origin", "branch", "result"], activeEdges: ["forward-data", "reverse-gradient", "loop-back"] }],
};
const branchingArchitecture: ArchitectureSpec = {
  nodes: [
    { id: "root", label: "Shared backbone θₛ", group: "Shared backbone", status: "frozen", position: { x: 150, y: 255 } },
    { id: "old", label: "Old head θₒ", group: "Task-specific heads", status: "trainable", position: { x: 480, y: 155 } },
    { id: "new", label: "New head θₙ", group: "Task-specific heads", status: "trainable", position: { x: 480, y: 365 } },
  ],
  edges: [
    { id: "old-branch", from: "root", to: "old", branch: "old", path: "curve" },
    { id: "new-branch", from: "root", to: "new", branch: "new", path: "orthogonal" },
  ],
};
const branchingMachine: StateMachineSpec = {
  initialState: "idle",
  states: [
    { id: "idle", label: "Idle", position: { x: 120, y: 230 } },
    { id: "fork", label: "Branch A", position: { x: 420, y: 115 } },
    { id: "retry", label: "Retry", position: { x: 420, y: 350 } },
    { id: "done", label: "Done", terminal: true, position: { x: 740, y: 115 } },
    { id: "blocked", label: "Blocked", terminal: true, position: { x: 740, y: 350 } },
  ],
  transitions: [
    { from: "retry", to: "fork", path: "curve", condition: "loop back" },
    { from: "idle", to: "blocked", path: "curve", condition: "branch B" },
    { from: "idle", to: "fork", path: "straight", condition: "branch A" },
    { from: "fork", to: "done", condition: "complete" },
  ],
  illegalHints: [{ from: "idle", to: "done", message: "Choose a legal branch first." }],
};
const knowledge = [
  { id: "term-a", kind: "term" as const, hover: { title: "术语 A", definitionZh: "用于测试的中文短解释。", paperRoleZh: "验证统一知识 ID。", confusionZh: "另一个术语。" }, reference: { titleEn: "Term A", summaryEn: "Searchable reference.", relatedIds: ["method-b"], tags: ["alpha"] } },
  { id: "method-b", kind: "method" as const, hover: { title: "方法 B", definitionZh: "第二个中文短解释。" }, reference: { titleEn: "Method B", summaryEn: "Another reference.", relatedIds: ["term-a"], tags: ["beta"] } },
];
const term = knowledge[0];
const timelineClips: TimelineClip[] = [
  { id: "read", durationMs: 100, holdMs: 40 },
  { id: "transform", durationMs: 80, holdMs: 20 },
  { id: "output", durationMs: 60 },
];
const shortenedTimelineClips = [timelineClips[0], timelineClips[2]];

class ManualClock implements TimelineClock {
  private callbacks = new Map<number, FrameRequestCallback>();
  private nextId = 1;
  cancelled = 0;
  request = (callback: FrameRequestCallback) => { const id = this.nextId++; this.callbacks.set(id, callback); return id; };
  cancel = (handle: number) => { if (this.callbacks.delete(handle)) this.cancelled += 1; };
  advance(now: number) { const current = [...this.callbacks.values()]; this.callbacks.clear(); current.forEach((callback) => callback(now)); }
  get pending() { return this.callbacks.size; }
}

const manualClock = new ManualClock();
const unmountClock = new ManualClock();

function TimelineFixture({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [shortened, setShortened] = useState(false);
  const activeClips = shortened ? shortenedTimelineClips : timelineClips;
  const timeline = useAnimationTimeline({ clips: activeClips, reducedMotion, clock: manualClock });
  const state = timeline.state;
  return <section className="timeline-fixture" data-reduced={reducedMotion} data-status={state.status} data-clip={state.clipId ?? "none"} data-progress={state.progress.toFixed(2)} data-holding={state.isHolding}>
    <div data-timeline-region="network">{state.clipId}:{state.progress.toFixed(2)}</div>
    <div data-timeline-region="pipeline">{state.clipId}:{state.progress.toFixed(2)}</div>
    <button type="button" onClick={timeline.controls.play}>Play timeline</button>
    <button type="button" onClick={timeline.controls.pause}>Pause timeline</button>
    <button type="button" onClick={timeline.controls.replayClip}>Replay clip</button>
    <button type="button" onClick={timeline.controls.stepBack}>Previous clip</button>
    <button type="button" onClick={timeline.controls.stepForward}>Next clip</button>
    <button type="button" onClick={() => timeline.controls.goToClip(2)}>Go to output</button>
    <button type="button" onClick={() => setShortened(true)}>Replace clips</button>
  </section>;
}

function TimelineBoundaryFixture({ clips }: { clips: TimelineClip[] }) {
  const { state } = useAnimationTimeline({ clips, reducedMotion: false, clock: manualClock });
  return <p className="timeline-boundary" data-status={state.status} data-errors={state.errors.length}>{state.clipId ?? "no clip"}</p>;
}

function AutoTimeline() {
  const { state } = useAnimationTimeline({ clips: timelineClips, reducedMotion: false, autoPlay: true, clock: unmountClock });
  return <span data-auto-timeline={state.status}>{state.clipId}</span>;
}

function UnmountTimelineFixture() {
  const [mounted, setMounted] = useState(true);
  return <section className="timeline-unmount"><button type="button" onClick={() => setMounted(false)}>Unmount timeline</button>{mounted && <AutoTimeline />}</section>;
}

function Fixtures() {
  return <main>
    <button id="keyboard-target" type="button">Keyboard target</button>
    <Chip active>Active chip</Chip><Slider label="Demo slider" value={20} onChange={() => {}} />
    <Popover label="Popover detail" trigger="Open popover"><p>Popover content.</p></Popover>
    <ProcessLoopExplorer spec={process} mode="autoplay" />
    <ProcessLoopExplorer spec={semanticProcess} />
    <ProcessLoopExplorer spec={{ ...process, steps: [{ ...process.steps[0], activeNodes: ["missing-node"] }] }} />
    <ArchitectureExplorer spec={{ nodes: [{ id: "arch-a", label: "Architecture A", detail: "Inspectable detail." }], edges: [] }} />
    <ArchitectureExplorer spec={branchingArchitecture} highlightedBranches={["old"]} />
    <FlowStepper steps={[{ id: "f1", title: "Forward" }, { id: "f2", title: "Backward" }]} onStepChange={(step) => { document.body.dataset.flowChanged = step.title; }} />
    <ResponsibilityMap spec={responsibility} />
    <StateMachineExplorer spec={stateMachine} />
    <StateMachineExplorer spec={branchingMachine} />
    <ReferenceHub entries={knowledge} />
    <TermRef entry={term} onOpenReference={(termId) => { document.body.dataset.reference = termId; }} />
    <TermRef entry={term} onOpenReference={(termId) => { document.body.dataset.reference = termId; }}>Term A repeated</TermRef>
    <ExpandableDetail title="Supporting detail"><p>Expandable content.</p></ExpandableDetail>
    <PaperFigure src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='80'%3E%3Crect width='160' height='80' fill='%23e3f2f6'/%3E%3C/svg%3E" alt="Simple demo illustration" figureLabel="Demo figure" caption="A local illustration." source="Reusable Kit demo" annotations={[{ id: "a", x: 50, y: 50, label: "A", text: "Annotation detail." }]} />
    <CompareView variants={[{ id: "a", title: "A" }, { id: "b", title: "B" }]} />
    <MultiViewInspector objectLabel="Sample object" views={[{ id: "one", label: "One", content: "First view." }]} />
    <RepresentationTransform stages={[{ id: "raw", title: "Raw", description: "Raw input." }, { id: "structured", title: "Structured", description: "Structured output." }]} />
    <CompatibilityChecker checks={[]} />
    <BenchmarkExplorer records={[{ id: "result", benchmark: "Sample benchmark", protocol: "Task sequence A → B", metric: "Accuracy", condition: "Illustrative only", result: "No value", interpretation: "Not a paper result.", limitation: "Demo content only." }]} />
    <EvidenceViewer mode="judge" data={{ claim: "A sample claim.", experiment: "A sample protocol.", evidence: ["An observation."], interpretation: "An interpretation.", boundary: "A limit.", correctVerdict: "supported" }} />
    <DatasetCard dataset={{ name: "Sample set", task: "Classification", paperRole: "Illustrative only." }} />
    <FormulaBlock formula="a + b" terms={[{ id: "a", label: "a", explanation: "First term." }]} />
    <MiniNetworkGlyph
      label="Importance illustration"
      description="Selected representative connections receive emphasis."
      layers={[{ id: "input", label: "Input", nodeCount: 3 }, { id: "hidden", label: "Shared representation", nodeCount: 24, displayNodeCount: 5 }, { id: "output", label: "Output", nodeCount: 2 }]}
      connections={[
        { id: "important-a", fromLayer: "input", fromNode: 0, toLayer: "hidden", toNode: 1 },
        { id: "important-b", fromLayer: "hidden", fromNode: 1, toLayer: "output", toNode: 0 },
        { id: "context", fromLayer: "input", fromNode: 2, toLayer: "hidden", toNode: 4, state: "muted" },
      ]}
      focus={{ nodes: ["hidden:1"], edges: ["important-a", "important-b"] }}
    />
    <MiniNetworkGlyph
      label="Role and structure illustration"
      description="A frozen reference and a trainable copy use different visible identities and output widths."
      layers={[{ id: "frozen", label: "Frozen reference", nodeCount: 4, identity: "frozen" }, { id: "trainable", label: "Trainable output", nodeCount: 8, displayNodeCount: 6, identity: "trainable" }]}
      connectAdjacent
    />
    <TimelineFixture />
    <TimelineFixture reducedMotion />
    <TimelineBoundaryFixture clips={[]} />
    <TimelineBoundaryFixture clips={[{ id: "bad", durationMs: 0, holdMs: -1 }, { id: "bad", durationMs: 10 }]} />
    <UnmountTimelineFixture />
    <InlineCallout>Inline information.</InlineCallout><Feedback>Feedback message.</Feedback><StatusPill>Ready</StatusPill><Button>Reusable button</Button>
  </main>;
}

const nativeMatchMedia = window.matchMedia.bind(window);
let prefersReducedMotion = true;
const motionListeners = new Set<() => void>();
const reducedMotionQuery = {
  get matches() { return prefersReducedMotion; },
  media: "(prefers-reduced-motion: reduce)",
  onchange: null,
  addListener: (listener: () => void) => motionListeners.add(listener),
  removeListener: (listener: () => void) => motionListeners.delete(listener),
  addEventListener: (_type: string, listener: () => void) => motionListeners.add(listener),
  removeEventListener: (_type: string, listener: () => void) => motionListeners.delete(listener),
  dispatchEvent: () => true,
};
window.matchMedia = ((query: string) => query.includes("prefers-reduced-motion") ? reducedMotionQuery : nativeMatchMedia(query)) as typeof window.matchMedia;

createRoot(document.getElementById("root")!).render(<><h1>Reusable Kit smoke checks</h1><p id="summary">Running…</p><Fixtures /></>);
const wait = () => new Promise<void>((resolve) => window.setTimeout(resolve, 25));
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };

async function run() {
  await wait();
  const results: string[] = [];
  const check = async (name: string, action: () => void | Promise<void>) => {
    try { await action(); results.push(name); }
    catch (error) { results.push(`FAIL — ${name}: ${error instanceof Error ? error.message : String(error)}`); }
  };
  await check("Core components render", () => {
    for (const label of ["Interactive process diagram", "Interactive architecture diagram", "Process steps", "Responsibility map", "Interactive state machine", "Evidence review", "Benchmark results"]) assert(document.querySelector(`[aria-label='${label}']`), `Missing ${label}`);
    assert(document.querySelector(".rk-reference-hub"), "Missing Reference Hub");
    assert(document.body.textContent?.includes("Sample set"), "Dataset did not render.");
    assert(document.body.textContent?.includes("a + b"), "Formula did not render.");
    assert(document.querySelector("input[type='range']"), "Slider control did not render.");
    assert(document.querySelector(".rk-chip[aria-pressed='true']"), "Chip pressed state did not render.");
  });
  await check("Mini network glyph distinguishes structure, identity, focus, and compression", () => {
    const glyphs = document.querySelectorAll<HTMLElement>(".rk-mini-network");
    assert(glyphs.length === 2, "Both mini network scenarios did not render.");
    assert(glyphs[0].querySelectorAll("[data-network-edge]").length === 3, "Explicit sparse connections were not preserved.");
    assert(glyphs[0].querySelectorAll("[data-network-edge].is-focused").length === 2, "Focused connections were not identified.");
    assert(glyphs[0].textContent?.includes("Original structure: 24; showing 5 representative nodes."), "Compressed structure was not disclosed.");
    assert(glyphs[1].querySelector("[data-network-layer='frozen'][data-identity='frozen']"), "Frozen identity was not exposed.");
    assert(glyphs[1].querySelector("[data-network-layer='trainable'][data-identity='trainable']"), "Trainable identity was not exposed.");
    const labelledBy = Array.from(glyphs).map(glyph => glyph.querySelector("svg")?.getAttribute("aria-labelledby"));
    assert(labelledBy.every(Boolean) && new Set(labelledBy).size === glyphs.length, "Multiple glyph instances reused SVG title/description IDs.");
    assert(validateMiniNetworkGlyph({ layers: [{ id: "same", label: "A", nodeCount: 1 }, { id: "same", label: "B", nodeCount: 0 }] }).length === 2, "Duplicate IDs and invalid node counts were not rejected deterministically.");
    assert(validateMiniNetworkGlyph({ layers: [{ id: "a", label: "A", nodeCount: 1 }, { id: "b", label: "B", nodeCount: 1 }], connections: [{ id: "bad-progress", fromLayer: "a", fromNode: 0, toLayer: "b", toNode: 0, progress: 1.2 }] }).length === 1, "Out-of-range connection progress was accepted.");
  });
  await check("Timeline validation rejects empty access, invalid durations, holds, and duplicate IDs", () => {
    const boundaries = document.querySelectorAll<HTMLElement>(".timeline-boundary");
    assert(boundaries[0].dataset.status === "empty" && boundaries[0].dataset.errors === "0", "Empty clips did not produce an explicit empty state.");
    assert(boundaries[1].dataset.status === "invalid" && Number(boundaries[1].dataset.errors) === 3, "Invalid timeline input did not produce deterministic errors.");
    assert(validateTimelineClips([{ id: "a", durationMs: Number.NaN }]).length === 1, "NaN duration was accepted.");
  });
  await check("One deterministic timeline clock drives two regions through motion, hold, stepping, replay, and replacement", async () => {
    const fixture = document.querySelector<HTMLElement>(".timeline-fixture[data-reduced='false']")!;
    const buttons = (label: string) => Array.from(fixture.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === label)!;
    buttons("Play timeline").click(); await wait();
    manualClock.advance(0); await wait();
    manualClock.advance(50); await wait();
    assert(fixture.dataset.clip === "read" && fixture.dataset.progress === "0.50", "Controlled clock did not expose a real intermediate state.");
    assert(new Set(Array.from(fixture.querySelectorAll("[data-timeline-region]")).map((region) => region.textContent)).size === 1, "Two visual regions drifted apart.");
    manualClock.advance(110); await wait();
    assert(fixture.dataset.progress === "1.00" && fixture.dataset.holding === "true", "Motion did not enter its hold state continuously.");
    buttons("Pause timeline").click(); await wait();
    const paused = fixture.dataset.progress;
    manualClock.advance(200); await wait();
    assert(fixture.dataset.progress === paused, "A stale frame overwrote pause.");
    buttons("Replay clip").click(); await wait();
    assert(fixture.dataset.progress === "0.00" && fixture.dataset.status === "playing", "Replay did not reset the current clip.");
    buttons("Go to output").click(); await wait();
    assert(fixture.dataset.clip === "output" && fixture.dataset.status === "paused", "goToClip did not jump deterministically.");
    buttons("Previous clip").click(); await wait();
    assert(fixture.dataset.clip === "transform", "stepBack did not select the previous clip.");
    buttons("Replace clips").click(); await wait();
    assert(fixture.dataset.clip === "read" && fixture.dataset.progress === "0.00", "Runtime clip replacement left the timeline out of bounds.");
    buttons("Next clip").click(); await wait();
    assert(fixture.dataset.clip === "output", "Rapid forward stepping did not use the replacement list.");
  });
  await check("Reduced motion exposes meaningful completed clips without continuous playback", async () => {
    const fixture = document.querySelector<HTMLElement>(".timeline-fixture[data-reduced='true']")!;
    const button = (label: string) => Array.from(fixture.querySelectorAll<HTMLButtonElement>("button")).find((item) => item.textContent === label)!;
    assert(fixture.dataset.clip === "read" && fixture.dataset.progress === "1.00" && fixture.dataset.status === "paused", "Reduced motion did not start on a meaningful end state.");
    button("Play timeline").click(); await wait();
    manualClock.advance(500); await wait();
    assert(fixture.dataset.clip === "read" && fixture.dataset.status === "paused", "Play restarted continuous motion under reduced motion.");
    button("Next clip").click(); await wait();
    assert(fixture.dataset.clip === "transform" && fixture.dataset.progress === "1.00", "Reduced-motion step did not expose the next completed state.");
  });
  await check("Timeline unmount cancels the scheduled frame", async () => {
    await wait();
    assert(unmountClock.pending === 1, "Autoplay did not schedule exactly one frame.");
    document.querySelector<HTMLButtonElement>(".timeline-unmount button")!.click(); await wait();
    assert(unmountClock.pending === 0 && unmountClock.cancelled >= 1, "Unmount left a frame scheduled.");
  });
  await check("Popover opens and Escape dismisses", async () => {
    const trigger = document.querySelector<HTMLButtonElement>(".rk-popover__trigger")!;
    trigger.click(); await wait();
    assert(document.querySelector("[role='dialog'][aria-label='Popover detail']"), "Popover did not open.");
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await wait();
    assert(!document.querySelector("[role='dialog'][aria-label='Popover detail']"), "Popover did not dismiss with Escape.");
  });
  await check("Data-driven steps update the graph and progress", async () => {
    const diagram = document.querySelectorAll<HTMLElement>(".rk-process-loop")[0];
    Array.from(diagram.querySelectorAll("button")).find((button) => button.textContent === "Next")?.click(); await wait();
    assert(diagram.textContent?.includes("Second step"), "Next did not select the second step.");
    assert(diagram.querySelector("[aria-valuenow='2']"), "Progress did not advance.");
    assert(diagram.querySelector(".rk-process-node.is-active")?.textContent?.includes("Output"), "Active node did not update.");
  });
  await check("Process layout, arrows, reverse gradients, and loop-back use semantic data", () => {
    const diagram = document.querySelectorAll<HTMLElement>(".rk-process-loop")[1];
    const node = diagram.querySelector<HTMLButtonElement>(".rk-process-node:nth-child(4)");
    assert(node?.style.left === "875px" && node.style.top === "70px", "Missing node did not use the documented automatic layout fallback.");
    const edges = Array.from(diagram.querySelectorAll<SVGGElement>(".rk-process-loop__edge"));
    assert(edges.length === semanticProcess.edges.length, "Rendered edge count did not match the process topology.");
    assert(edges.every((edge) => edge.querySelector("path[marker-end]")), "An edge is missing its arrowhead.");
    assert(edges.find((edge) => edge.dataset.edgeId === "reverse-gradient")?.dataset.direction === "reverse", "Gradient direction was not reversed.");
    assert(edges.find((edge) => edge.dataset.edgeId === "loop-back")?.dataset.path === "orthogonal", "Loop-back route was not preserved.");
    assert(edges.every((edge) => edge.classList.contains("is-active")), "The active path was not highlighted.");
  });
  await check("Signal pulses follow active data paths and stop for reduced motion", async () => {
    const diagram = document.querySelectorAll<HTMLElement>(".rk-process-loop")[1];
    const dataEdge = diagram.querySelector<SVGGElement>("[data-edge-id='forward-data']")!;
    const controlEdge = diagram.querySelector<SVGGElement>("[data-edge-id='loop-back']")!;
    assert(!dataEdge.classList.contains("is-flowing"), "Pulse animation ignored reduced motion.");
    prefersReducedMotion = false;
    motionListeners.forEach((listener) => listener()); await wait();
    assert(dataEdge.classList.contains("is-flowing"), "Active data edge did not receive its flow cue.");
    assert(!controlEdge.classList.contains("is-flowing"), "Control edge received a continuous animation.");
    prefersReducedMotion = true;
    motionListeners.forEach((listener) => listener()); await wait();
    assert(!dataEdge.classList.contains("is-flowing"), "Pulse animation remained enabled after reduced motion was requested.");
  });
  await check("Invalid process references show a useful error", () => assert(document.querySelector(".rk-error")?.textContent?.includes("unknown node 'missing-node'"), "Unknown node was not reported."));
  await check("Architecture node selection opens the inspector", async () => {
    document.querySelector<HTMLButtonElement>(".rk-architecture__node")?.click(); await wait();
    assert(document.querySelector(".rk-architecture__inspector")?.textContent?.includes("Inspectable detail"), "Node detail was not shown.");
  });
  await check("Architecture manual positions, branches, groups, and statuses are rendered", () => {
    const architecture = document.querySelectorAll<HTMLElement>(".rk-architecture")[1];
    const oldHead = architecture.querySelector<HTMLButtonElement>("#architecture-node-old")!;
    assert(oldHead.style.left === "480px" && oldHead.style.top === "155px", "Manual architecture coordinates were ignored.");
    assert(architecture.querySelectorAll(".rk-architecture__group-region").length === 2, "Group regions were not drawn.");
    assert(oldHead.querySelector(".rk-architecture__status")?.textContent === "trainable", "Trainable status was missing.");
    assert(architecture.querySelector("#architecture-node-root")?.classList.contains("rk-architecture__node--frozen"), "Frozen status was missing.");
    assert(architecture.querySelector("[data-branch='new']")?.classList.contains("is-dimmed"), "Unselected branch was not dimmed.");
    assert(architecture.querySelector("[data-branch='old'] path[marker-end]"), "Branch edge or arrowhead was missing.");
  });
  await check("FlowStepper notifies connected views", async () => {
    document.querySelector<HTMLButtonElement>(".rk-flow-step[aria-current='step']")?.parentElement?.nextElementSibling?.querySelector("button")?.click(); await wait();
    assert(document.body.dataset.flowChanged === "Backward", "onStepChange did not receive the step.");
  });
  await check("Responsibility map exposes unassigned work", async () => {
    document.querySelector<HTMLButtonElement>(".rk-responsibility__step.is-unowned")?.click(); await wait();
    assert(document.querySelector(".rk-responsibility .rk-feedback")?.textContent?.includes("No actor is assigned"), "Missing owner was not explained.");
  });
  await check("State machine records valid and invalid transitions", async () => {
    const machine = document.querySelector<HTMLElement>(".rk-state-machine")!;
    const states = machine.querySelectorAll<HTMLButtonElement>(".rk-state-machine__state");
    states[2].click(); await wait();
    assert(machine.querySelector(".rk-feedback")?.textContent?.includes("Complete training before finishing"), "Illegal transition hint was not shown.");
    states[1].click(); await wait();
    assert(machine.querySelector(".rk-state-machine__header")?.textContent?.includes("Trained"), "Legal transition did not advance.");
    assert(machine.textContent?.includes("Rejected attempts: 1"), "Rejected transition was not recorded.");
  });
  await check("State machine arrows come from transitions, including branch and loop-back", () => {
    const machine = document.querySelectorAll<HTMLElement>(".rk-state-machine")[1];
    const edges = Array.from(machine.querySelectorAll<SVGGElement>(".rk-state-machine__edge"));
    assert(edges.length === branchingMachine.transitions.length, "State arrows were inferred from state order instead of transitions.");
    assert(edges[0].dataset.from === "retry" && edges[0].dataset.to === "fork", "The declared transition order/topology was not preserved.");
    assert(edges[0].dataset.path === "curve" && edges[0].querySelector("path[marker-end]"), "Loop-back arrow was not rendered.");
    assert(machine.querySelector("#rk-state-done .rk-state-machine__terminal"), "Terminal state is not identified.");
    assert(machine.querySelector("#rk-state-fork")?.classList.contains("is-next"), "Legal next state was not highlighted.");
    assert(machine.querySelector("#rk-state-blocked")?.classList.contains("is-next"), "Branch alternative was not highlighted.");
    assert(edges.filter((edge) => edge.dataset.from === "idle").length === 2, "Branch transitions were lost.");
  });
  await check("Reference Hub search and controlled selection work without rewriting the page hash", async () => {
    const hub = document.querySelector<HTMLElement>(".rk-reference-hub")!;
    window.history.replaceState(null, "", "#paper-anchor");
    const search = hub.querySelector<HTMLInputElement>("input[type='search']")!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(search, "Method");
    search.dispatchEvent(new Event("input", { bubbles: true })); await wait();
    assert(hub.textContent?.includes("Method B"), "Search did not find the item.");
    hub.querySelector<HTMLButtonElement>(".rk-reference-hub__list button")?.click(); await wait();
    assert(hub.querySelector(".rk-reference-hub__detail")?.textContent?.includes("Method B"), "Selecting a reference did not open its detail.");
    assert(window.location.hash === "#paper-anchor", "Selecting a reference rewrote the paper anchor.");
  });
  await check("TermRef opens on click, closes on Escape, and opens its reference", async () => {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".rk-term-ref[data-term-id='term-a']"));
    const controls = buttons.map((button) => button.getAttribute("aria-controls"));
    assert(buttons.length === 2 && controls.every(Boolean) && new Set(controls).size === controls.length, "Repeated references do not have unique panel IDs.");
    const button = buttons[0]!;
    button.click(); await wait(); assert(button.getAttribute("aria-expanded") === "true", "Term did not open.");
    button.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await wait();
    assert(button.getAttribute("aria-expanded") === "false", "Escape did not close the term.");
    button.click(); await wait();
    document.querySelector<HTMLButtonElement>(".rk-term-popover__link")?.click(); await wait();
    assert(document.body.dataset.reference === term.id, "The Chinese hover did not report the canonical Hub ID.");
  });
  await check("Native controls accept keyboard focus", () => {
    const target = document.getElementById("keyboard-target") as HTMLButtonElement; target.focus();
    assert(document.activeElement === target && target.tabIndex >= 0, "Control cannot receive focus.");
  });
  await check("Reduced motion disables autoplay", () => {
    const diagram = document.querySelectorAll<HTMLElement>(".rk-process-loop")[0];
    const play = Array.from(diagram.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Play");
    assert(play?.disabled, "Autoplay remained enabled with reduced motion requested.");
  });
  await check("PaperFigure zoom and source render", async () => {
    const figure = document.querySelector<HTMLElement>(".rk-paper-figure")!;
    figure.querySelector<HTMLButtonElement>(".rk-paper-figure__zoom")?.click(); await wait();
    const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-modal='true']");
    const titleId = dialog?.getAttribute("aria-labelledby");
    assert(titleId && document.getElementById(titleId)?.textContent === "Demo figure", "Zoom dialog did not open with its figure title.");
    assert(dialog?.textContent?.includes("Reusable Kit demo"), "Source attribution was missing from the zoom dialog.");
  });
  await check("Empty compatibility input is not a false pass", () => assert(document.querySelector(".rk-compatibility__result")?.textContent === "NEEDS ADAPTER", "Empty checks reported PASS."));

  const failed = results.filter((item) => item.startsWith("FAIL"));
  const summary = document.getElementById("summary")!;
  summary.textContent = `${results.length - failed.length} passed · ${failed.length} failed`;
  summary.setAttribute("role", failed.length ? "alert" : "status");
  summary.dataset.result = failed.length ? "fail" : "pass";
  summary.dataset.passCount = String(results.length - failed.length);
  summary.dataset.failureCount = String(failed.length);
  const list = document.createElement("ol");
  results.forEach((item) => { const row = document.createElement("li"); row.textContent = item; list.append(row); });
  summary.after(list);
  if (failed.length) console.error("Reusable Kit smoke checks failed", failed);
  else console.info("Reusable Kit smoke checks passed", results.length);
}

void run();
