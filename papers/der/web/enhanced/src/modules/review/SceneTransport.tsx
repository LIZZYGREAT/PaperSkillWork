import { useEffect, useId, useRef, useState } from "react";
import { useAnimationTimeline, timelineClipTotal, type TimelineClip } from "../../shared/foundation/animation/useAnimationTimeline";
import { useReducedMotion } from "../../shared/foundation/accessibility/useReducedMotion";

export function useSceneTimeline(clips: readonly TimelineClip[], autoPlay = false) {
  const timeline = useAnimationTimeline({ clips, autoPlay });
  const reducedMotion = useReducedMotion();
  const [inspect, setInspect] = useState(false);
  const state = inspect ? { ...timeline.state, progress: 1, elapsedMs: timelineClipTotal(clips[timeline.state.clipIndex]), isHolding: false } : timeline.state;
  const jump = (index: number) => { timeline.controls.goToClip(index); setInspect(true); };
  const seek = (index: number) => { if (reducedMotion) jump(index); else { setInspect(false); timeline.controls.goToClip(index, { autoPlay: true }); } };
  const reset = () => { setInspect(false); timeline.controls.goToClip(0); };
  const toggle = () => {
    if (inspect) {
      setInspect(false);
      timeline.controls.goToClip(state.clipIndex < clips.length - 1 ? state.clipIndex + 1 : 0, { autoPlay: true });
    } else timeline.controls.toggle();
  };
  const elapsedSeconds = (clips.slice(0, state.clipIndex).reduce((sum, clip) => sum + timelineClipTotal(clip), 0) + state.elapsedMs) / 1000;
  return { state, elapsedSeconds, reducedMotion, jump, seek, reset, toggle,
    replay: () => { setInspect(false); timeline.controls.goToClip(0, { autoPlay: true }); } };
}
export type SceneTimeline = ReturnType<typeof useSceneTimeline>;

function StagePicker({ clips, value, onChange, label }: { clips: readonly TimelineClip[]; value: number; onChange: (n: number) => void; label: string }) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(value);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), list = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => { if (open) list.current?.querySelector<HTMLButtonElement>(`[data-stage-option="${active}"]`)?.focus({ preventScroll: true }); }, [open, active]);
  const choose = (n: number) => { onChange(n); setOpen(false); trigger.current?.focus(); };
  return <div className="motion-stage-picker" ref={root} onKeyDown={e => {
    if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); e.preventDefault(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setActive(open ? (active + (e.key === "ArrowDown" ? 1 : -1) + clips.length) % clips.length : value); setOpen(true); }
    if (open && (e.key === "Home" || e.key === "End")) { e.preventDefault(); setActive(e.key === "Home" ? 0 : clips.length - 1); }
    if (e.key === "Tab") setOpen(false);
  }}>
    <span className="motion-stage-label">阶段</span>
    <button ref={trigger} className="motion-stage-trigger" role="combobox" aria-label={`${label}阶段选择`} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => { setActive(value); setOpen(!open); }}>
      <span className="motion-stage-number">{String(value + 1).padStart(2, "0")}</span><span>{clips[value].id}</span>
      <span className="motion-stage-arrow" aria-hidden="true" />
    </button>
    {/* Synchronised native value for programmatic state inspection; the visible picker owns keyboard interaction. */}
    <select className="motion-stage-value" aria-hidden="true" tabIndex={-1} value={value} onChange={e => { onChange(Number(e.target.value)); setOpen(false); }}>{clips.map((c, i) => <option key={c.id} value={i}>{i + 1}. {c.id}</option>)}</select>
    {open && <div id={id} className="motion-stage-menu" ref={list} role="listbox" aria-label={`${label}阶段`}>
      <div className="motion-stage-menu-title">选择一个阶段<span>{clips.length} 个步骤</span></div>
      {clips.map((c, i) => <button key={c.id} role="option" aria-selected={value === i} data-stage-option={i} tabIndex={active === i ? 0 : -1} onClick={() => choose(i)}>
        <span className="motion-stage-number">{String(i + 1).padStart(2, "0")}</span><span>{c.id}</span><span className="motion-stage-check">{value === i ? "✓" : ""}</span>
      </button>)}
    </div>}
  </div>;
}

export default function SceneTransport({ timeline, clips, label, caption, stageSelection = "result" }: { timeline: SceneTimeline; clips: readonly TimelineClip[]; label: string; caption?: string; stageSelection?: "start" | "result" }) {
  const { state, reducedMotion, jump } = timeline;
  const total = clips.reduce((n, c) => n + timelineClipTotal(c), 0);
  const elapsed = clips.slice(0, state.clipIndex).reduce((n, c) => n + timelineClipTotal(c), 0) + state.elapsedMs;
  return <div className="motion-transport" role="group" aria-label={`${label}播放控制`}>
    <div className="motion-progress"><progress max={total} value={elapsed} aria-label="整段进度" /><span data-time-readout>{(elapsed / 1000).toFixed(1)} / {(total / 1000).toFixed(1)} 秒 · {state.isHolding ? "停留观察" : state.status === "finished" ? "播放结束" : state.status === "playing" ? "播放中" : "已暂停"}</span></div>
    <div className="motion-buttons"><button data-play onClick={timeline.toggle} disabled={reducedMotion && !state.hasNext}>{reducedMotion ? "下一语义步骤" : state.status === "playing" ? "暂停" : state.status === "finished" ? "再次播放" : "播放 / 继续"}</button><button data-back disabled={!state.hasPrevious} onClick={() => jump(state.clipIndex - 1)}>上一步</button><button data-next disabled={!state.hasNext} onClick={() => jump(state.clipIndex + 1)}>下一步</button><button data-replay onClick={timeline.replay}>重播整段</button><StagePicker clips={clips} value={state.clipIndex} onChange={stageSelection === "start" ? timeline.seek : jump} label={label} /></div>
    <p className="motion-caption">{reducedMotion ? "减少动态：显示每一阶段的完整语义，使用前后步骤阅读。" : caption ?? "默认暂停。点击播放可完整看完；前后单步停在所选阶段末态。"}</p>
  </div>;
}
