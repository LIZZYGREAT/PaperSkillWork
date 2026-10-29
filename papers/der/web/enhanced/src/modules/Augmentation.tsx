import { useState } from "react";
import SceneTransport, { useSceneTimeline } from "./review/SceneTransport";
import { windowAt } from "./review/lifecycle-model";
import { ScoreGlyph, fmt, vectorText } from "./LearningGlyphs";
import { PelicanIllustration, type ImageView } from "./PelicanIllustration";
import { runTraining, forward, viewOf } from "./training-model";
import "./learning-scenes.css";

const clips = [
  { id: "原图与保存时视图", durationMs: 4500, holdMs: 1500 },
  { id: "生成并冻结 z", durationMs: 4500, holdMs: 1800 },
  { id: "未来回放另一视图", durationMs: 5000, holdMs: 1800 },
  { id: "多个视图，共用一个目标", durationMs: 5500, holdMs: 2200 },
];
const steps = runTraining("DER");
const record = steps[0].candidate;
const W = steps[1].before.W;

type ReplayView = "center" | "flip";

export default function Augmentation() {
  const timeline = useSceneTimeline(clips);
  const [view, setView] = useState<ReplayView>("center");
  const { clipIndex: c, progress: p } = timeline.state;
  const done = (i: number) => c > i ? 1 : c < i ? 0 : windowAt(p, .08, .85);
  const modelView = view === "center" ? -1 : 1;
  const current = forward(W, viewOf(record.u, modelView));
  const loss = current.reduce((sum, value, k) => sum + (value - record.z[k]) ** 2, 0);
  const notes = [
    "记忆保留原图 x₁；首次训练从轻微裁剪的 A₀(x₁) 计算更新前输出。",
    "保存时把更新前输出复制为 z。图像身份仍是 x₁，目标 z 随后冻结。",
    "未来从同一 x₁ 重新生成 A₁(x₁)。中心裁剪或水平翻转只改变本次视图。",
    "回放的当前输出 a 会随视图改变，并与原来冻结的 z 比较；z 本身不变。",
  ];
  const replayImageView: ImageView = view;

  return <section className="teaching-scene" data-scene="augmentation" data-clip={c} data-progress={p} data-status={timeline.state.status} data-target={record.z.join(",")} data-view={view} data-loss={loss}>
    <header><div>
      <p className="eyebrow">AUGMENTATION / 恢复真实视图</p>
      <h3>记忆保存原图，回放时重新取视图。</h3>
      <p>对同一张图做保持类别语义的裁剪或翻转；保存时产生的目标固定不变。两次视图共用同一个鹈鹕原图身份。</p>
    </div></header>
    <SceneTransport timeline={timeline} clips={clips} label="增强与一致性" showTiming={false} />
    <div className="aug-view-controls" role="group" aria-label="选择未来回放时的图像视图">
      <span>回放视图 A₁(x₁)</span>
      <button type="button" aria-pressed={view === "center"} onClick={() => setView("center")}>中心裁剪</button>
      <button type="button" aria-pressed={view === "flip"} onClick={() => setView("flip")}>水平翻转</button>
      <span className="aug-fixed-target"><i aria-hidden="true" /> z 目标固定</span>
    </div>
    <div className="teaching-stage aug-stage"><svg viewBox="0 0 1280 500" role="img" className="teaching-canvas aug-canvas" aria-label="白色鹈鹕原图分别生成保存视图与回放视图，回放输出和冻结目标匹配">
      <defs>
        <marker id="aug-arrow-source" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" className="aug-arrow-head" /></marker>
        <marker id="aug-arrow-current" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" className="aug-arrow-current-head" /></marker>
      </defs>

      <text x="35" y="125" className="tg-title">同一张原图 x₁</text>
      <PelicanIllustration view="original" label="原图 x1：戴蓝帽、骑青绿色自行车的白色鹈鹕" x={35} y={142} width={292} height={173} className="aug-pelican-art" />
      <text x="35" y="337" className="tg-small">保留原图身份；增强结果不覆盖它</text>
      <circle cx="340" cy="228" r="5" className="aug-source-node" />
      <path d="M340 228H365V174H392M365 228V373H392" className="aug-source-path" markerEnd="url(#aug-arrow-source)" />
      <text x="348" y="210" className="tg-small aug-path-label">按需生成视图</text>

      <g opacity={done(0)}>
        <text x="400" y="84" className="tg-title">保存时 · A₀(x₁)</text>
        <PelicanIllustration view="saved" label="保存时轻微裁剪的同一只白色鹈鹕 A0(x1)" x={400} y={96} width={232} height={138} className="aug-pelican-art" />
        <text x="400" y="258" className="tg-small">首次训练时的合理裁剪</text>
        <path d="M638 165H654" className="aug-forward-path" markerEnd="url(#aug-arrow-source)" />
        <rect x="662" y="105" width="306" height="150" rx="14" className="aug-score-card aug-score-frozen" />
        <ScoreGlyph x={673} y={153} label="更新前输出 z" values={record.z} reveal={done(1)} frozen />
        <path d="M968 177H992V215H1007" className="aug-target-path" markerEnd="url(#aug-arrow-source)" />
      </g>

      <g opacity={done(2)}>
        <text x="400" y="283" className="tg-title">未来回放 · A₁(x₁)</text>
        <PelicanIllustration view={replayImageView} label={view === "center" ? "未来回放中心裁剪视图：同一只白色鹈鹕 A1(x1)" : "未来回放水平翻转视图：同一只白色鹈鹕 A1(x1)"} x={400} y={295} width={232} height={138} className="aug-pelican-art" />
        <text x="400" y="457" className="tg-small">{view === "center" ? "中心裁剪" : "水平翻转"} · 仍是同一个 x₁</text>
        <path d="M638 364H654" className="aug-forward-path" markerEnd="url(#aug-arrow-source)" />
        <rect x="662" y="300" width="306" height="150" rx="14" className="aug-score-card aug-score-current" />
        <ScoreGlyph x={673} y={348} label="当前输出 a" values={current} reveal={done(2)} />
        <path d="M968 374H991V294H1007" className="aug-current-path" markerEnd="url(#aug-arrow-current)" />
      </g>

      <rect x="1007" y="171" width="240" height="156" rx="15" className="aug-match-card" />
      <text x="1027" y="202" className="tg-title">与同一个 z 比较</text>
      <text x="1027" y="244" className="aug-match-formula">L_match = ‖a − z‖²</text>
      <text x="1027" y="286" className="aug-match-value">{fmt(loss, 5)}</text>
      <text x="1027" y="309" className="tg-small">当前视图变化 · 冻结目标不变</text>
      <text x="35" y="489" className="tg-small aug-boundary">合成鹈鹕插图用于解释视图身份；输出数值来自 W5 二维小模型，不是图像分类器。</text>
    </svg></div>
    <div className="scene-explanation" aria-live="polite"><strong>{clips[c].id}</strong><p>{notes[c]}</p></div>
    <p className="quiet-note">视图切换时，模型输入按 uₛ=(u₁+0.1s,u₂) 改变，s={modelView}；目标 z={vectorText(record.z)} 来自同一训练状态。这里展示的是增强一致性机制，不新增一项 DER 训练损失。</p>
  </section>;
}