import { useEffect, useRef, useState } from "react";
import { trainingSteps } from "../data/process";

export function ReplayControl({ onSelectStep }: { onSelectStep: (stepId: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("完成六步后，Student′ 保持高亮。");
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const replay = () => {
    if (playing) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      setPlaying(false);
      setStatus("回放已停止。当前图仍与所选步骤同步。");
      return;
    }
    setPlaying(true);
    setStatus("正在回放完整训练周期。");
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 260 : 760;
    const advance = (index: number) => {
      onSelectStep(trainingSteps[index].id);
      if (index === trainingSteps.length - 1) {
        timer.current = window.setTimeout(() => {
          setPlaying(false);
          setStatus("Student updated · 参数在 Optimizer Step 后更新。");
          timer.current = null;
        }, delay);
        return;
      }
      timer.current = window.setTimeout(() => advance(index + 1), delay);
    };
    advance(0);
  };

  return <div className="v3-replay-control">
    <button type="button" onClick={replay} aria-pressed={playing}>{playing ? "■ 停止回放" : "▶ Replay one training cycle"}</button>
    <span role="status" aria-live="polite">{status}</span>
  </div>;
}
