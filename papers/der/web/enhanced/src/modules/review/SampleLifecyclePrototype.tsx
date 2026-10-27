import { CLASSES } from "../math-model";
import { LIFECYCLE_CLIPS, lifecycleSceneAt, mix, windowAt } from "./lifecycle-model";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import "./animation.css";
import "./lifecycle.css";

const NARRATION = [
  "原图 x₁ 留在数据来源处，本次增强视图进入唯一当前网络。标签 y₁ 另行提供分类监督。",
  "信号穿过特征层，从出口生成猫、狗、狐狸的整组分数 aᵢ=(2,1,0)。这发生在参数更新之前。",
  "在源响应的相同位置复制数值，再将方形副本分离为 z₁。源圆点仍在原处；副本有自己的生命周期。",
  "空记忆中没有旧回放。当前 CE 先更新唯一网络；刚才冻结的 z₁ 始终为 (2,1,0)。",
  "更新完成后，原图与固定 z₁ 装配为候选。本例 N=0<K=2，直接追加到空槽，随后 N 变为 1。",
  "下一步先从已有记忆选中 x₁@i。当前 x₂ 形成 CE；记忆中的 x₁ 重新增强，再进入同一当前网络生成 aⱼ。",
  "历史方标与当前圆点在同一类别、同一尺度上对齐。逐类间距形成差值，平方贡献为 1、1、0，总和为 2。",
  "当前 CE 与 α 倍历史匹配损失汇入一次联合更新。历史 z₁ 保持冻结；这里停在 x₂ 候选写入之前。",
];
const PIXELS = ["01100110", "11111111", "10111101", "11111111", "01111110", "00111100", "00011000", "00000000"];
const NEW_PIXELS = ["00111100", "01111110", "11011011", "11111111", "01111110", "00111100", "00100100", "00000000"];

function Sample({ x, y, scale = 1, current = false, view = false, opacity = 1, id }: {
  x: number; y: number; scale?: number; current?: boolean; view?: boolean; opacity?: number; id?: string;
}) {
  return <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} data-sample-object={id}>
    <rect x="-32" y="-32" width="64" height="64" rx="6" className="lc-image" />
    {(current ? NEW_PIXELS : PIXELS).flatMap((row, r) => [...row].map((v, c) => v === "1" ? <rect key={`${r}-${c}`} x={-23 + c * 6} y={-23 + r * 6} width="5" height="5" className="lc-pixel" /> : null))}
    {view && <path d="M-28 -17V-28H-17 M17 28H28V17" className="lc-crop" />}
  </g>;
}

export default function SampleLifecyclePrototype() {
  const timeline = useSceneTimeline(LIFECYCLE_CLIPS, true);
  const { clipIndex: clip, progress } = timeline.state;
  const s = lifecycleSceneAt(clip, progress);
  const camera = s.camera;
  const networkScale = mix(1, .45, camera);
  const firstOutput = clip <= 2 || (clip === 3 && s.update < .7);
  const sourceVisible = firstOutput || s.later;
  const targetDocked = s.copy >= .98 && s.store === 0;
  const packing = s.store > 0;
  const compare = clip >= 6;
  const networkPulse = clip === 1 ? windowAt(s.forward, .05, .6) : clip === 5 ? windowAt(s.replay, .65, .9) : 0;
  const updating = clip === 3 ? windowAt(s.update, .1, .7) : clip === 7 ? windowAt(s.joint, .1, .75) : 0;
  const plotX = mix(730, 580, camera), plotScale = mix(55, 100, camera);
  const targetLabelOpacity = targetDocked || packing ? 1 : 0;
  const packet = packing ? (s.stored ? { x: s.targetOrigin.x - 65, y: s.targetOrigin.y } : s.samplePacking) : null;
  const oldReferenceOpacity = compare ? windowAt(s.compare, 0, .12) : 0;

  return <section id="review-lifecycle" className="review-scene motion-scene lifecycle-scene" data-scene="lifecycle"
    data-clip={clip} data-progress={progress} data-status={timeline.state.status} data-memory-count={s.memoryCount}
    data-seen={s.seen} data-update-count={s.updateCount} data-replay-source={s.replaySource ?? "none"}
    data-loss-sources={s.lossSources.join(",")}>
    <header><p className="eyebrow">D1 · 单样本生命周期</p><h1>留下的是过去的响应，约束的是现在的网络。</h1>
      <p>跟踪同一份 x₁：更新前生成 → 复制冻结 → 更新后入池 → 未来回放 → 匹配与联合更新。</p></header>
    <div id="lifecycle-player" className="lifecycle-player"><SceneTransport timeline={timeline} clips={LIFECYCLE_CLIPS} label="样本生命周期" caption="自动完整播放一次。可随时暂停；选择阶段或前后单步，会停在该阶段的完整结果。" /></div>
    <div className="lifecycle-viewport">
      <svg className="lifecycle-canvas" viewBox="0 0 1120 640" role="img" aria-labelledby="lc-title lc-description">
        <title id="lc-title">一份样本的历史响应怎样产生、保存并约束未来训练</title>
        <desc id="lc-description">{NARRATION[clip]} 网络切片为结构抽象，两次输出为给定教学数据。</desc>
        <text x="35" y="40" className="lc-stage-label" data-layout-label>{s.later ? "第 j=i+1 步 · 当前网络已经更新" : "第 i 步 · 从空记忆开始"}</text>
        <text x="1080" y="40" textAnchor="end" className="lc-clock" data-canvas-time>{timeline.elapsedSeconds.toFixed(1)} 秒 · {clip + 1}/{LIFECYCLE_CLIPS.length}</text>
        <path d="M35 64H1085" className="lc-separator" />

        {/* Forward data is solid; the update corridor is reserved above the network. */}
        <g opacity={1 - camera}>
          {!s.later && <>
            <text x="105" y="185" textAnchor="middle" data-layout-label>原图 x₁</text>
            <Sample x={105} y={250} id={s.sampleId} />
            <text x="105" y="318" textAnchor="middle" className="lc-small" data-layout-label>原图身份保留</text>
            <path d="M140 250H300" className="lc-data-guide" />
            {s.enter > .05 && clip <= 1 && <Sample {...s.input} scale={.65} view opacity={1 - windowAt(s.forward, .05, .45)} id="view:x1:i" />}
            <text x="205" y="350" textAnchor="middle" className="lc-small" data-layout-label>本次增强视图</text>
          </>}
          {s.later && <>
            <text x="105" y="125" textAnchor="middle" data-layout-label>当前 x₂ / y₂</text>
            <Sample x={105} y={180} current id="sample:x2" />
            {s.replay < .4 && <Sample {...s.currentInput} scale={.6} current view opacity={1 - windowAt(s.replay, .32, .4)} id="view:x2:j" />}
            <path d="M142 180Q230 180 300 250" className="lc-data-guide" />
            <text x="80" y="560" className="lc-small" data-layout-label>从原槽读取，再增强</text>
            <path d="M735 555C125 535 125 390 305 270" className="lc-data-guide" opacity={s.replaySelected ? 1 : .2} />
            {s.replay >= .35 && s.replay < .9 && <Sample {...s.replayInput} scale={.65} view opacity={1 - windowAt(s.replay, .78, .9)} id="replay:x1:j" />}
          </>}
        </g>

        <text x="430" y="133" textAnchor="middle" opacity={1 - camera} className="lc-model-heading" data-layout-label>唯一当前网络 · <tspan data-parameter>{s.parameter}</tspan></text>
        <text x="185" y="474" textAnchor="middle" opacity={camera} className="lc-small" data-layout-label>同一模型 · {s.parameter}</text>
        <g data-current-model transform={`translate(${mix(0, -8.5, camera)},${mix(0, 272.5, camera)}) scale(${networkScale})`}>
          <path d="M282 370H560L600 340H322Z" className="lc-network-floor" />
          {[300, 385, 470].map((x, layer) => <g key={layer}>
            <path d={`M${x} ${180 - layer * 17}l76 18v150l-76 -18Z`} className="lc-layer" />
            {[0, 1, 2, 3].flatMap(row => [0, 1, 2].map(col => <circle key={`${row}-${col}`} cx={x + 17 + col * 21} cy={210 - layer * 17 + row * 28 + col * 4} r="4" className="lc-neuron" />))}
            {networkPulse > layer / 3 && <path d={`M${x + 5} ${247 - layer * 17}l65 15`} className="lc-processing" opacity={windowAt(networkPulse, layer / 3, (layer + 1) / 3)} />}
            {updating > 0 && <path d={`M${x} ${180 - layer * 17}l76 18v150l-76 -18Z`} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - updating} className="lc-parameter-pulse" />}
          </g>)}
        </g>
        <text x="430" y="410" textAnchor="middle" opacity={1 - camera} className="lc-small" data-layout-label>特征处理的结构抽象</text>

        {/* A single, unobstructed loss corridor. No arrows pass through labels. */}
        {s.currentCE && <g data-current-ce>
          <text x="80" y="94" className="lc-loss-label" data-layout-label>{s.later ? "x₂ / y₂ → 当前 CE" : "y₁ 与 aᵢ → 当前 CE"}</text>
          {clip === 3 && <path d="M255 92H430V109" pathLength="1" strokeDasharray=".025 .02" className="lc-gradient" opacity={s.update} />}
        </g>}

        {sourceVisible && <g data-source-output data-output-version={s.later ? "replay-current" : "before-update"}>
          <text x={mix(730, 580, camera)} y="145" className="lc-output-heading" data-layout-label>{s.later ? compare ? "同类、同尺度：□ 历史 z₁　● 当前 aⱼ" : "本次回放输出 aⱼ" : "更新前输出 aᵢ"}</text>
          {CLASSES.map((name, k) => {
            const point = s.later ? s.currentPoints[k] : { x: 730 + s.z[k] * 55, y: 205 + k * 55 };
            const reveal = s.outputReveal[k];
            const value = s.later ? s.match.a[k] : s.z[k];
            return <g key={name} data-comparison-row={k} data-a={s.match.a[k]} data-z={s.z[k]} data-difference={s.match.differences[k]}>
              <text x={plotX - 28} y={point.y + 6} textAnchor="end" data-layout-label>{name}</text>
              <path d={`M${plotX} ${point.y}h${plotScale * 2 + 18}`} className="lc-score-axis" />
              {[0, 1, 2].map(v => <g key={v}><path d={`M${plotX + v * plotScale} ${point.y - 4}v8`} className="lc-score-axis" />
                {camera > .8 && <text x={plotX + v * plotScale} y={point.y + 28} textAnchor="middle" className="lc-small" data-layout-label>{v}</text>}</g>)}
              <circle cx={point.x} cy={point.y} r={6 * reveal} className="lc-current-mark" data-current-point data-reveal={reveal} />
              {camera < .1 && reveal > .98 && <text x={point.x} y={point.y - 17} textAnchor="middle" className="lc-value" data-layout-label>{value}</text>}
              {compare && <>
                <rect x={s.referencePoints[k].x - 7} y={s.referencePoints[k].y - 7} width="14" height="14" className="lc-history-mark" opacity={oldReferenceOpacity} data-history-reference={k} />
                {s.difference > 0 && <>
                  <path d={`M${580 + s.z[k] * 100} ${point.y - 12}v-12H${mix(580 + s.z[k] * 100, point.x, s.difference)}v12`} className="lc-difference" />
                  <text x="858" y={point.y + 6} className="lc-difference-value" opacity={s.difference} data-layout-label>{s.match.differences[k] > 0 ? "+" : ""}{s.match.differences[k]}</text>
                </>}
                {s.squares > 0 && <g data-square-contribution={s.match.squares[k]}>
                  <path d={`M890 ${point.y}h22`} className="lc-calculation-link" />
                  {s.match.squares[k] ? <rect x="936" y={point.y - 19 * s.squares} width={38 * s.squares} height={38 * s.squares} className="lc-square" /> : <path d={`M936 ${point.y}h38`} className="lc-zero" />}
                  <text x="995" y={point.y + 6} opacity={s.squares} data-layout-label>{k === 0 ? "(−1)²=1" : k === 1 ? "1²=1" : "0²=0"}</text>
                </g>}
              </>}
            </g>;
          })}
        </g>}
        {clip === 3 && s.firstUpdated && <text x="730" y="190" className="lc-small" data-layout-label>本步计算结束，不重算新输出</text>}

        <g data-memory>
          <text x="645" y="492" className="lc-memory-heading" data-layout-label>记忆 M</text>
          <text x="1080" y="492" textAnchor="end" className="lc-small" data-layout-label>K=2 · N={s.seen}</text>
          <path d="M640 510H1070L1090 605H660Z" className="lc-memory-floor" />
          <path d="M677 520H930L943 590H690Z M962 520H1052L1066 590H976Z" className="lc-slot" />
          <text x="805" y="626" textAnchor="middle" className="lc-small" data-layout-label>slot:0 · {s.stored ? "x₁@i 已保存" : "空"}</text>
          <text x="1016" y="555" textAnchor="middle" className="lc-small" data-layout-label>空</text>
        </g>

        {/* This target/record group persists from birth through update, storage and replay. */}
        {s.hasTarget && <g data-record-id={s.recordId} data-target-id={s.targetId} data-history-z={s.z.join(",")} data-in-memory={s.stored}
          transform={`translate(${s.targetOrigin.x},${s.targetOrigin.y})`}>
          {packing && <rect x="-112" y="-50" width="244" height="80" rx="5" className="lc-record-outline" opacity={windowAt(s.store, .55, .92)} />}
          <text x={packing ? -22 : 0} y="-23" opacity={targetLabelOpacity} className="lc-frozen-heading" data-layout-label>{packing ? s.stored ? "x₁@i · 固定历史值" : "候选 (x₁,z₁)" : "独立副本 z₁ · 冻结"}</text>
          {s.targetPoints.map((point, k) => <g key={k}>
            <rect x={point.x - 7} y={point.y - 7} width="14" height="14" className="lc-history-mark" data-frozen-point={k} />
            <text x={point.x + 17} y={point.y + 6} opacity={targetLabelOpacity} className="lc-value" data-layout-label>{s.z[k]}</text>
            {!packing && <text x="-28" y={point.y + 6} opacity={targetLabelOpacity} textAnchor="end" className="lc-small" data-layout-label>{CLASSES[k]}</text>}
          </g>)}
        </g>}
        {packet && <Sample {...packet} scale={.55} id="record-original:x1" />}
        {clip === 4 && <text x="80" y="450" className="lc-small" data-layout-label>{s.stored ? "追加完成，N → 1" : s.store < .2 ? "先装配原图与冻结目标" : "N=0 < K=2 · 直接追加"}</text>}
        {compare && <>
          <text x="900" y="441" textAnchor="middle" className="lc-total" opacity={s.sum} data-loss={s.match.squaredDistance} data-layout-label>Ldark = 1 + 1 + 0 = 2</text>
          {clip === 7 && <g data-joint-update>
            <text x="510" y="94" textAnchor="middle" className="lc-loss-label" data-layout-label>当前 CE + α · Ldark → 一次更新</text>
            <path d="M255 108H350Q430 108 510 118 M1025 450H1095V108H660Q590 108 510 118" className="lc-loss-merge" opacity={s.joint} />
            <path d="M510 118Q400 150 300 163Q200 180 185 355" className="lc-gradient" opacity={s.joint} />
          </g>}
        </>}
      </svg>
    </div>
    <div className="lifecycle-reading" aria-live="polite"><strong>{LIFECYCLE_CLIPS[clip].id}</strong><p>{NARRATION[clip]}</p></div>
    <div className="lifecycle-equation" data-vqa-check-clipping>
      {compare ? <><math display="block" aria-label="历史匹配损失等于各类当前分数与冻结历史分数之差的平方和"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>C</mi></munderover><msup><mrow><mo>(</mo><msub><mi>a</mi><mrow><mi>j</mi><mo>,</mo><mi>k</mi></mrow></msub><mo>−</mo><msub><mi>z</mi><mrow><mn>1</mn><mo>,</mo><mi>k</mi></mrow></msub><mo>)</mo></mrow><mn>2</mn></msup>{s.sum === 1 && <><mo>=</mo><mn>2</mn></>}</math><span>□ 历史 z₁ 冻结　● 本次 aⱼ 可反传</span></> : <p>原图 x₁ 与数值 z₁ 保持同源身份。DER 记录为 (x₁,z₁)，其中不保存标签。</p>}
    </div>
    <p className="lifecycle-provenance">演示用的两次给定输出：z₁=(2,1,0)，aⱼ=(1,2,0)。网络为结构示意，未执行数值训练；入池与联合更新为后续单元的生命周期预览。</p>
  </section>;
}
