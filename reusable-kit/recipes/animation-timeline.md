# Animation Timeline Core

## Purpose

Give several visual regions one clock for motion, hold, pause, replay, stepping, and direct clip selection. The hook manages time and stages only; callers derive every diagram, position, label, and business state from `timeline.state`.

## Use When

- Two or more regions must remain frame-aligned.
- A clip has meaningful motion followed by an observation hold.
- Readers need pause, replay, Previous/Next, or direct clip navigation.

## Do Not Use When

- A single short CSS transition is enough.
- The interaction is a reverse-only micro replay with different semantics.
- The proposed hook API would need paper model names, classes, samples, losses, or page CSS.

## Runnable Example

```tsx
import { useAnimationTimeline } from "./shared/foundation/animation/useAnimationTimeline";

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
}
```

`clips=[]` returns an explicit `empty` state. Invalid durations, negative holds, and duplicate IDs return `invalid` with errors; no clip is indexed. Runtime replacement preserves the current ID when possible and resets safely when it disappears. Reduced motion shows each selected clip at its completed state; Play cannot restart continuous motion, while stepping remains meaningful.

Tests inject a `TimelineClock` and advance frames deterministically. Production callers normally omit it. Optional `initialState` is generic and replaces any need for a paper-specific global freeze variable.

## Provenance

The multi-clip clock and generation guard were extracted from `papers/icarl/web/enhanced/src/shared/animation/useAnimationTimeline.ts`. Only dependency-free easing helpers were retained; no `icarl-runtime` type or `window.__ICARL_FREEZE__` global enters the Kit. The reverse-capable `useLocalReplay` in Page Nine remains paper-local because it has a different responsibility.
