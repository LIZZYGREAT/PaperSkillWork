import { useEffect, useState } from "react";

export function useLessonPlayback(duration: number) {
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    function tick(now: number) {
      const elapsed = now - previous;
      previous = now;
      setPosition(value => Math.min(value + elapsed, duration));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, playing]);

  useEffect(() => {
    if (position >= duration && playing) setPlaying(false);
  }, [duration, playing, position]);

  function toggle() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPosition(duration);
      return;
    }
    if (position >= duration) setPosition(0);
    setPlaying(true);
  }

  function seek(value: number) {
    setPlaying(false);
    setPosition(value);
  }

  return { position, playing, toggle, seek, duration };
}

export function PlaybackControls({ playback, label }: { playback: ReturnType<typeof useLessonPlayback>; label: string }) {
  const { position, playing, toggle, seek, duration } = playback;
  return <div className="playback-controls">
    <button type="button" className="lesson-choice" onClick={toggle}>
      {playing ? "暂停" : position >= duration ? "重播" : "播放过程"}
    </button>
    <label><span>{label}</span><input type="range" min="0" max={duration} step="10"
      value={Math.round(position / 10) * 10} onChange={event => seek(Number(event.target.value))} /></label>
    <button type="button" className="text-button" onClick={() => seek(0)}>回到起点</button>
  </div>;
}
