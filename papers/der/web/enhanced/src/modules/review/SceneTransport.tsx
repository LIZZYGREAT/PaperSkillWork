import { useState } from "react";
import { useAnimationTimeline, timelineClipTotal, type TimelineClip } from "../../shared/foundation/animation/useAnimationTimeline";
import { useReducedMotion } from "../../shared/foundation/accessibility/useReducedMotion";

export function useSceneTimeline(clips: readonly TimelineClip[]) {
  const timeline = useAnimationTimeline({ clips });
  const reducedMotion = useReducedMotion();
  // Manual inspection shows a completed clip; resume at its successor with the same clock.
  const [inspect, setInspect] = useState(false);
  const state = inspect ? { ...timeline.state, progress: 1, elapsedMs: timelineClipTotal(clips[timeline.state.clipIndex]), isHolding: false } : timeline.state;
  const jump = (index: number) => { timeline.controls.goToClip(index); setInspect(true); };
  const reset = () => { setInspect(false); timeline.controls.goToClip(0); };
  const toggle = () => {
    if (inspect) {
      setInspect(false);
      timeline.controls.goToClip(state.clipIndex < clips.length - 1 ? state.clipIndex + 1 : 0, { autoPlay: true });
    } else timeline.controls.toggle();
  };
  return { state, reducedMotion, jump, reset, toggle,
    replay: () => { setInspect(false); timeline.controls.goToClip(0, { autoPlay: true }); } };
}
export type SceneTimeline = ReturnType<typeof useSceneTimeline>;
export default function SceneTransport({ timeline, clips, label }: { timeline: SceneTimeline; clips: readonly TimelineClip[]; label: string }) {
  const { state, reducedMotion, jump } = timeline;
  const total = clips.reduce((n, c) => n + timelineClipTotal(c), 0);
  const elapsed = clips.slice(0, state.clipIndex).reduce((n, c) => n + timelineClipTotal(c), 0) + state.elapsedMs;
  return <div className="motion-transport" role="group" aria-label={`${label}播放控制`}>
    <div className="motion-progress"><progress max={total} value={elapsed} aria-label="整段进度" /><span data-time-readout>{(elapsed / 1000).toFixed(1)} / {(total / 1000).toFixed(1)} 秒 · {state.isHolding ? "停留观察" : state.status === "finished" ? "播放结束" : state.status === "playing" ? "播放中" : "已暂停"}</span></div>
    <div className="motion-buttons"><button data-play onClick={timeline.toggle} disabled={reducedMotion && !state.hasNext}>{reducedMotion ? "下一语义步骤" : state.status === "playing" ? "暂停" : state.status === "finished" ? "再次播放" : "播放 / 继续"}</button><button data-back disabled={!state.hasPrevious} onClick={() => jump(state.clipIndex - 1)}>上一步</button><button data-next disabled={!state.hasNext} onClick={() => jump(state.clipIndex + 1)}>下一步</button><button data-replay onClick={timeline.replay}>重播整段</button><label>阶段 <select aria-label={`${label}阶段`} value={state.clipIndex} onChange={(e) => jump(Number(e.target.value))}>{clips.map((c, i) => <option key={c.id} value={i}>{i + 1}. {c.id}</option>)}</select></label></div>
    <p className="motion-caption">{reducedMotion ? "减少动态：显示每一阶段的完整语义，使用前后步骤阅读。" : "默认暂停。点击播放可完整看完；前后单步停在所选阶段末态。"}</p>
  </div>;
}
