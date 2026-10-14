import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * One clip of a continuous teaching animation.
 *
 * `durationMs` covers visible motion; `holdMs` is an in-place pause on the end state so the
 * reader can observe the result before the next cause is introduced. A clip therefore never
 * needs to "jump" to a different picture at its boundary: state at `totalMs` already equals
 * the state at the next clip's time 0 for every object that survives the boundary.
 */
export type AnimationClip = {
  id: string;
  durationMs: number;
  holdMs?: number;
  narrative: string;
};

export type TimelineStatus = "playing" | "paused" | "finished";

export type TimelineState = {
  clipIndex: number;
  clip: AnimationClip;
  /** 0–1 while the clip is moving; frozen at 1 during the hold. */
  progress: number;
  /** Milliseconds elapsed inside the current clip, including its hold. */
  elapsedMs: number;
  status: TimelineStatus;
  isHolding: boolean;
  atStart: boolean;
  atEnd: boolean;
  totalClips: number;
};

export type TimelineControls = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  replayClip: () => void;
  stepBack: () => void;
  stepForward: () => void;
  goToClip: (index: number, options?: { autoPlay?: boolean }) => void;
};

function totalMs(clip: AnimationClip): number {
  return Math.max(1, clip.durationMs + (clip.holdMs ?? 0));
}

/** Visual-QA freeze instruction, set by the capture script before the app boots. */
type FreezeRequest = { clip?: number; pct?: number };

declare global {
  interface Window {
    __ICARL_FREEZE__?: FreezeRequest;
  }
}

/**
 * A single playback clock for one workbench. All derived geometry reads from this elapsed time,
 * so two panels of the same page can never drift apart.
 *
 * Reduced motion keeps every key state reachable: the reader advances clip by clip manually and
 * each clip is rendered at its completed state instead of being skipped.
 */
export function useAnimationTimeline({
  clips,
  reducedMotion,
  autoPlay = true,
}: {
  clips: readonly AnimationClip[];
  reducedMotion: boolean;
  autoPlay?: boolean;
}): { state: TimelineState; controls: TimelineControls } {
  /**
   * The freeze request is resolved once, while the initial state is computed, so a frozen
   * checkpoint can never be advanced by a frame that lands before an effect runs.
   */
  const freeze = useRef(readFreezeRequest()).current;
  const initialClip = freeze ? Math.max(0, Math.min(clips.length - 1, freeze.clip ?? 0)) : 0;
  const initialElapsed = freeze
    ? clips[initialClip].durationMs * Math.max(0, Math.min(0.999, freeze.pct ?? 0))
    : 0;

  const [clipIndex, setClipIndex] = useState(initialClip);
  const [elapsedMs, setElapsedMs] = useState(initialElapsed);
  const [status, setStatus] = useState<TimelineStatus>(
    reducedMotion || freeze ? "paused" : autoPlay ? "playing" : "paused",
  );
  const elapsedRef = useRef(initialElapsed);
  const lastFrameRef = useRef<number | null>(null);
  const clip = clips[Math.min(clipIndex, clips.length - 1)];
  const clipTotal = totalMs(clip);

  const seek = useCallback((next: number) => {
    const bounded = Math.max(0, next);
    elapsedRef.current = bounded;
    setElapsedMs(bounded);
  }, []);

  const advanceClip = useCallback(
    (delta: number) => {
      setClipIndex((current) => {
        const next = Math.max(0, Math.min(clips.length - 1, current + delta));
        // Reduced motion jumps between completed clips; every other mode starts at time 0.
        // Setting the time here (not in an effect) keeps the two state updates in one commit,
        // so a whole clip can never be observed at a partial time.
        const target = reducedMotion && next !== current ? totalMs(clips[next]) : 0;
        elapsedRef.current = target;
        setElapsedMs(target);
        return next;
      });
    },
    [clips, reducedMotion],
  );

  useEffect(() => {
    if (status !== "playing") {
      lastFrameRef.current = null;
      return;
    }
    let frame = 0;
    const tick = (time: number) => {
      const last = lastFrameRef.current;
      lastFrameRef.current = time;
      const delta = last === null ? 0 : time - last;
      const next = elapsedRef.current + delta;
      if (next >= clipTotal) {
        elapsedRef.current = clipTotal;
        setElapsedMs(clipTotal);
        if (clipIndex < clips.length - 1) {
          setClipIndex(clipIndex + 1);
          elapsedRef.current = 0;
          setElapsedMs(0);
          frame = requestAnimationFrame(tick);
        } else {
          setStatus("finished");
        }
        return;
      }
      elapsedRef.current = next;
      setElapsedMs(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, clipIndex, clipTotal, clips.length]);

  // Reduced motion holds each clip at its completed state so the reader controls the pace.
  // Asking for the end of the clip is idempotent, so re-running it is always safe.
  useEffect(() => {
    if (!reducedMotion || freeze) return;
    elapsedRef.current = clipTotal;
    setElapsedMs(clipTotal);
    setStatus("paused");
  }, [reducedMotion, freeze, clipTotal]);

  useEffect(() => {
    if (clipIndex > clips.length - 1) setClipIndex(Math.max(0, clips.length - 1));
  }, [clipIndex, clips.length]);

  const play = useCallback(() => {
    if (elapsedRef.current >= clipTotal && clipIndex >= clips.length - 1) {
      elapsedRef.current = 0;
      setElapsedMs(0);
    }
    setStatus("playing");
  }, [clipIndex, clipTotal, clips.length]);

  const pause = useCallback(() => setStatus("paused"), []);

  const toggle = useCallback(() => {
    setStatus((current) => {
      if (current === "playing") return "paused";
      if (current === "finished" && clipIndex >= clips.length - 1 && elapsedRef.current >= clipTotal) {
        elapsedRef.current = 0;
        setElapsedMs(0);
      }
      return "playing";
    });
    if (reducedMotion) {
      // Stepping through clips is the reduced-motion playback model.
      if (clipIndex < clips.length - 1) advanceClip(1);
    }
  }, [advanceClip, clipIndex, clipTotal, clips.length, reducedMotion]);

  const replayClip = useCallback(() => {
    elapsedRef.current = 0;
    setElapsedMs(0);
    setStatus(reducedMotion ? "paused" : "playing");
  }, [reducedMotion]);

  const stepBack = useCallback(() => {
    if (clipIndex === 0) {
      elapsedRef.current = 0;
      setElapsedMs(0);
      setStatus("paused");
      return;
    }
    const previous = clipIndex - 1;
    // Reduced motion renders whole clips, so landing on the previous one must not show time 0.
    const target = reducedMotion ? totalMs(clips[previous]) : 0;
    setClipIndex(previous);
    elapsedRef.current = target;
    setElapsedMs(target);
    setStatus("paused");
  }, [clipIndex, clips, reducedMotion]);

  const stepForward = useCallback(() => {
    if (clipIndex >= clips.length - 1) {
      elapsedRef.current = 0;
      setElapsedMs(0);
      setStatus(reducedMotion ? "paused" : "playing");
      return;
    }
    const next = clipIndex + 1;
    const target = reducedMotion ? totalMs(clips[next]) : 0;
    setClipIndex(next);
    elapsedRef.current = target;
    setElapsedMs(target);
    setStatus("paused");
  }, [clipIndex, clips, reducedMotion]);

  const goToClip = useCallback(
    (index: number, options?: { autoPlay?: boolean }) => {
      const next = Math.max(0, Math.min(clips.length - 1, index));
      const target = reducedMotion ? totalMs(clips[next]) : 0;
      setClipIndex(next);
      elapsedRef.current = target;
      setElapsedMs(target);
      setStatus(options?.autoPlay === false || reducedMotion ? "paused" : "playing");
    },
    [clips, reducedMotion],
  );

  const state = useMemo<TimelineState>(() => {
    const progress = elapsedMs >= clip.durationMs ? 1 : Math.min(1, elapsedMs / clip.durationMs);
    return {
      clipIndex,
      clip,
      progress,
      elapsedMs,
      status,
      isHolding: elapsedMs >= clip.durationMs,
      atStart: clipIndex === 0 && elapsedMs <= 0,
      atEnd: clipIndex >= clips.length - 1 && elapsedMs >= clipTotal,
      totalClips: clips.length,
    };
  }, [clip, clipIndex, clipTotal, elapsedMs, status, clips.length]);

  return { state, controls: { play, pause, toggle, replayClip, stepBack, stepForward, goToClip } };
}

/** Picks the narrative line that explains what is happening right now. */
export function activeNarrationIndex(lines: readonly string[], progress: number): number {
  if (lines.length <= 1) return 0;
  const index = Math.ceil(Math.min(progress, 0.999) * lines.length) - 1;
  return Math.max(0, Math.min(lines.length - 1, index));
}

/** Visual-QA freeze instruction, set by the capture script before the app boots. */
export function readFreezeRequest(): { clip?: number; pct?: number } | null {
  if (typeof window === "undefined") return null;
  const request = window.__ICARL_FREEZE__;
  return request && typeof request === "object" ? request : null;
}
