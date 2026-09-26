import { createRoot } from "react-dom/client";
import "../../foundation/styles/kit.css";
import { ArchitectureExplorer } from "../../core/architecture";
import { FlowStepper } from "../../core/flow-stepper";
import { PaperFigure } from "../../core/paper-figure";
import { ExpandableDetail, ReferenceHub, TermRef } from "../../core/reference";
import { ProcessLoopExplorer } from "../../core/process-loop";
import { ResponsibilityMap } from "../../core/responsibility-map";
import { StateMachineExplorer } from "../../core/state-machine";
import { Button } from "../../foundation/controls/Button";
import { Feedback } from "../../foundation/feedback/Feedback";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { StatusPill } from "../../foundation/feedback/StatusPill";
import { Chip } from "../../foundation/controls/Chip";
import { Slider } from "../../foundation/controls/Slider";
import { Popover } from "../../foundation/overlay/Popover";
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
const term = { id: "term-a", label: "Term A", definition: "A data-driven definition.", paperRole: "Test label.", confusion: "Another term." };

function Fixtures() {
  return <main>
    <button id="keyboard-target" type="button">Keyboard target</button>
    <Chip active>Active chip</Chip><Slider label="Demo slider" value={20} onChange={() => {}} />
    <Popover label="Popover detail" trigger="Open popover"><p>Popover content.</p></Popover>
    <ProcessLoopExplorer spec={process} mode="autoplay" />
    <ProcessLoopExplorer spec={{ ...process, steps: [{ ...process.steps[0], activeNodes: ["missing-node"] }] }} />
    <ArchitectureExplorer spec={{ nodes: [{ id: "arch-a", label: "Architecture A", detail: "Inspectable detail." }], edges: [] }} />
    <FlowStepper steps={[{ id: "f1", title: "Forward" }, { id: "f2", title: "Backward" }]} onStepChange={(step) => { document.body.dataset.flowChanged = step.title; }} />
    <ResponsibilityMap spec={responsibility} />
    <StateMachineExplorer spec={stateMachine} />
    <ReferenceHub items={[{ id: "term-a", title: "Term A", kind: "term", summary: "Searchable reference." }, { id: "method-b", title: "Method B", kind: "method", summary: "Another reference." }]} />
    <TermRef term={term} />
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
    <InlineCallout>Inline information.</InlineCallout><Feedback>Feedback message.</Feedback><StatusPill>Ready</StatusPill><Button>Reusable button</Button>
  </main>;
}

const nativeMatchMedia = window.matchMedia.bind(window);
window.matchMedia = ((query: string) => query.includes("prefers-reduced-motion")
  ? { matches: true, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }
  : nativeMatchMedia(query)) as typeof window.matchMedia;

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
    for (const label of ["Interactive process diagram", "Interactive architecture diagram", "Process steps", "Responsibility map", "Interactive state machine", "Reference Hub", "Evidence review", "Benchmark results"]) assert(document.querySelector(`[aria-label='${label}']`), `Missing ${label}`);
    assert(document.body.textContent?.includes("Sample set"), "Dataset did not render.");
    assert(document.body.textContent?.includes("a + b"), "Formula did not render.");
    assert(document.querySelector("input[type='range']"), "Slider control did not render.");
    assert(document.querySelector(".rk-chip[aria-pressed='true']"), "Chip pressed state did not render.");
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
  await check("Invalid process references show a useful error", () => assert(document.querySelector(".rk-error")?.textContent?.includes("unknown node 'missing-node'"), "Unknown node was not reported."));
  await check("Architecture node selection opens the inspector", async () => {
    document.querySelector<HTMLButtonElement>(".rk-architecture__node")?.click(); await wait();
    assert(document.querySelector(".rk-architecture__inspector")?.textContent?.includes("Inspectable detail"), "Node detail was not shown.");
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
  await check("Reference Hub search and deep links work", async () => {
    const hub = document.querySelector<HTMLElement>(".rk-reference-hub")!;
    const search = hub.querySelector<HTMLInputElement>("input[type='search']")!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(search, "Method");
    search.dispatchEvent(new Event("input", { bubbles: true })); await wait();
    assert(hub.textContent?.includes("Method B"), "Search did not find the item.");
    hub.querySelector<HTMLButtonElement>(".rk-reference-hub__list button")?.click(); await wait();
    assert(window.location.hash.includes("method-b"), "Selecting a reference did not update the deep link.");
  });
  await check("TermRef opens on click and closes on Escape", async () => {
    const button = document.querySelector<HTMLButtonElement>(".rk-term-ref")!;
    button.click(); await wait(); assert(button.getAttribute("aria-expanded") === "true", "Term did not open.");
    button.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await wait();
    assert(button.getAttribute("aria-expanded") === "false", "Escape did not close the term.");
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
    assert(document.querySelector("[role='dialog'][aria-label='Demo figure']"), "Zoom dialog did not open.");
    assert(figure.textContent?.includes("Reusable Kit demo"), "Source attribution was missing.");
  });
  await check("Empty compatibility input is not a false pass", () => assert(document.querySelector(".rk-compatibility__result")?.textContent === "NEEDS ADAPTER", "Empty checks reported PASS."));

  const failed = results.filter((item) => item.startsWith("FAIL"));
  const summary = document.getElementById("summary")!;
  summary.textContent = `${results.length - failed.length} passed · ${failed.length} failed`;
  summary.setAttribute("role", failed.length ? "alert" : "status");
  summary.dataset.result = failed.length ? "fail" : "pass";
  const list = document.createElement("ol");
  results.forEach((item) => { const row = document.createElement("li"); row.textContent = item; list.append(row); });
  summary.after(list);
  if (failed.length) console.error("Reusable Kit smoke checks failed", failed);
  else console.info("Reusable Kit smoke checks passed", results.length);
}

void run();
