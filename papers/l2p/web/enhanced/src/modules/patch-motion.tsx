import { useEffect, useMemo, useRef, useState } from "react";
import birdUrl from "./specimen.svg?inline";
import { PATCH_GRID, PATCH_SIZE } from "./specimen";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";

const CHANNELS = ["R", "G", "B"];
const COUNT = PATCH_SIZE * PATCH_SIZE * CHANNELS.length;
const DURATION = 6800;
const STOPS = [
  { at: 0, name: "分离 RGB 通道" },
  { at: 1350, name: "按索引展平" },
  { at: 4880, name: "应用线性投影" },
  { at: DURATION, name: "得到嵌入向量" },
];
const SAMPLE_WEIGHTS = [{ offset: 0, weight: .5 }, { offset: 1, weight: .3 }, { offset: 3, weight: .2 }];

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
function blend(from: number, to: number, amount: number) { return from + (to - from) * amount; }

function samplePatch(image: HTMLImageElement, index: number) {
  const sampler = document.createElement("canvas");
  sampler.width = PATCH_GRID * PATCH_SIZE;
  sampler.height = PATCH_GRID * PATCH_SIZE;
  const ctx = sampler.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  const col = index % PATCH_GRID;
  const row = Math.floor(index / PATCH_GRID);
  ctx.drawImage(image, 0, 0, sampler.width, sampler.height);
  const { data } = ctx.getImageData(col * PATCH_SIZE, row * PATCH_SIZE, PATCH_SIZE, PATCH_SIZE);
  return Array.from({ length: COUNT }, (_, i) => data[Math.floor(i / 3) * 4 + i % 3] / 255);
}

function project(values: number[]) {
  return values.map((_, i) => SAMPLE_WEIGHTS.reduce((sum, {offset, weight}) => sum + weight * values[(i + offset) % COUNT], 0));
}

function channelColor(channel: number, value: number) {
  const rgb = [[180, 64, 47], [46, 122, 80], [48, 101, 146]][channel];
  return "rgb(" + rgb.map(component => Math.round(blend(243, component, .22 + .78 * value))).join(",") + ")";
}

function drawPatch(ctx: CanvasRenderingContext2D, values: number[], output: number[], position: number) {
  const split = clamp(position / 1100);
  const projection = clamp((position - 3920) / 730);
  const matrix = clamp((position - 4680) / 200);
  const contribution = clamp((position - 4880) / 1100);
  const visibleOutput = clamp((position - 5980) / 820);
  ctx.clearRect(0, 0, 760, 286);
  ctx.fillStyle = "#f2f5ed";
  ctx.fillRect(0, 0, 760, 286);
  for (let i = 0; i < COUNT; i++) {
    const channel = i % 3;
    const pixel = Math.floor(i / 3);
    const col = pixel % PATCH_SIZE;
    const row = Math.floor(pixel / PATCH_SIZE);
    // Each position is tracked by its original (row, column, channel) identity.
    const flatten = clamp((position - 1350 - i * .46) / 2150);
    const planeX = blend(298 + channel * 26, 72 + channel * 231, split);
    const planeY = blend(54 + channel * 15, 70, split);
    const flatX = blend(42, 34, projection) + (i % 48) * blend(14.1, 5.9, projection);
    const flatY = blend(72, 94, projection) + Math.floor(i / 48) * blend(9.4, 8.7, projection);
    const x = blend(planeX + col * 8.9, flatX, flatten);
    const y = blend(planeY + row * 8.9, flatY, flatten);
    ctx.fillStyle = channelColor(channel, values[i]);
    ctx.fillRect(x, y, blend(8.25, blend(12.5, 5.2, projection), flatten), blend(8.25, 7.8, flatten));
  }
  ctx.fillStyle = "#214c3a";
  ctx.font = "600 16px Segoe UI, sans-serif";
  if (position < 1350) {
    for (let c = 0; c < 3; c++) {
      ctx.globalAlpha = split;
      ctx.fillText(CHANNELS[c] + " · 16 × 16", 72 + c * 231, 54);
    }
    ctx.globalAlpha = 1;
  } else if (matrix === 0) {
    ctx.fillText("x[0] → x[767]", 42, 49);
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.fillText("每行连续 48 项，折行只为阅读", 42, 242);
  } else {
    ctx.globalAlpha = matrix;
    ctx.fillText("x · 768 项输入", 34, 255);
    ctx.fillText("W 局部", 350, 75);
    ctx.fillText("z · 768 项输出", 452, 255);
    ctx.strokeStyle = "#8ca78f";
    ctx.lineWidth = 1;
    ctx.strokeRect(346, 88, 65, 144);
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 5; col++) {
        const coefficient = SAMPLE_WEIGHTS.find(({offset}) => (col + offset) % COUNT === row)?.weight ?? 0;
        ctx.fillStyle = coefficient > 0 ? channelColor(1, coefficient) : "#e4ebe0";
        ctx.fillRect(352 + col * 11, 94 + row * 11, 8, 8);
      }
    }
    const colors = ["#a34f3d", "#397655", "#426e8d"];
    for (let i = 0; i < SAMPLE_WEIGHTS.length; i++) {
      const { offset, weight } = SAMPLE_WEIGHTS[i];
      const x = 34 + i * 87;
      const y = 98 + offset * 11;
      const color = colors[i];
      const point = (t: number) => {
        const u = 1 - t;
        return [u ** 3 * (x + 38) + 3 * u ** 2 * t * (x + 76) + 3 * u * t ** 2 * 292 + t ** 3 * 352,
          u ** 3 * 53 + 3 * u ** 2 * t * 53 + 3 * u * t ** 2 * y + t ** 3 * y];
      };
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.font = "600 13px Segoe UI, sans-serif";
      ctx.fillText("x[" + offset + "] × " + weight, x, 41);
      ctx.strokeRect(33 + offset * 5.9, 93, 7, 10);
      ctx.strokeRect(351, y - 5, 10, 10);
      ctx.globalAlpha = matrix * .21;
      ctx.beginPath();
      ctx.moveTo(x + 38, 53);
      ctx.bezierCurveTo(x + 76, 53, 292, y, 352, y);
      ctx.stroke();
      const head = contribution * 1.3 - i * .14;
      for (let n = 0; n < 16; n++) {
        const t = head - n * .017;
        if (t < 0 || t > 1) continue;
        const [px, py] = point(t);
        ctx.globalAlpha = matrix * (1 - n / 16) ** 1.5;
        ctx.beginPath(); ctx.arc(px, py, n === 0 ? 3.1 : 2.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = matrix;
    }
    ctx.strokeStyle = "#709578";
    for (const {offset} of SAMPLE_WEIGHTS) {
      const y = 98 + offset * 11;
      ctx.beginPath();
      ctx.moveTo(362, y);
      ctx.bezierCurveTo(392, y, 410, 98, 422, 98);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(439, 98); ctx.lineTo(452, 98); ctx.stroke();
    ctx.fillStyle = "#e5eee1";
    ctx.beginPath(); ctx.arc(431, 98, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#214c3a";
    ctx.font = "600 11px Segoe UI, sans-serif";
    ctx.fillText("Σ", 427.5, 102);
    if (visibleOutput > 0) {
      ctx.fillStyle = "#326a50";
      for (let n = 0; n < 12; n++) {
        const t = visibleOutput * 2 - n * .025;
        if (t < 0 || t > 1) continue;
        ctx.globalAlpha = (1 - n / 12) ** 1.5;
        ctx.beginPath(); ctx.arc(blend(439, 452, t), 98, n === 0 ? 3 : 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (let i = 0; i < COUNT; i++) {
      const opacity = clamp(visibleOutput * 1.22 - i / COUNT * .22);
      if (opacity === 0) continue;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = channelColor(1, output[i]);
      ctx.fillRect(452 + (i % 48) * 5.7, 94 + Math.floor(i / 48) * 8.7, 5, 7.8);
    }
    ctx.globalAlpha = 1;
  }
}

export function PatchMotion({ index }: { index: number }) {
  const [values, setValues] = useState<number[]>();
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const playback = useLessonPlayback(DURATION);
  const output = useMemo(() => values ? project(values) : [], [values]);
  const stage = STOPS.filter(stop => playback.position >= stop.at).length - 1;

  useEffect(() => {
    const image = new Image(224, 224);
    let active = true;
    image.src = birdUrl;
    image.decode().then(() => {
      if (active) setValues(samplePatch(image, index));
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [index]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx && values) drawPatch(ctx, values, output, playback.position);
  }, [values, output, playback.position]);

  return <div className="patch-motion">
    {values ? <>
      <PlaybackControls playback={playback} label="Patch 展平与投影进度" />
      <div className="motion-stops" aria-label="跳到计算步骤">
        {STOPS.map(({ at, name }, i) => <button type="button" key={at} className="lesson-choice"
          aria-pressed={i === stage} onClick={() => playback.seek(at)}>{i + 1}. {name}</button>)}
      </div>
      <canvas ref={canvas} width="760" height="286" className="patch-motion-canvas"
        aria-label="所选 Patch 的 RGB 通道、展平向量与线性投影。下面提供同一运算的数值说明。" />
      <p className="motion-status">{playback.position < 1350 ? "同一块图像分成 R、G、B 三张 16×16 平面。" :
        playback.position < 3920 ? "每个格子带着原值移动到新索引。展平只改变顺序。" :
        playback.position < 4880 ? "把向量放到计算区左侧。下一步追踪 x[0]、x[1]、x[3]。" :
        playback.position < 5980 ? "三条有色拖尾分别指向第一列的三个非零系数。" :
        "三项贡献相加得到 z[0]。其他列用同一规则得到其余输出。"}</p>
      <div className="patch-motion-detail">
        <p><strong>展平顺序</strong><br />按行、列扫描，每个像素依次取 R、G、B。首个像素的三项为 {values.slice(0, 3).map(value => value.toFixed(3)).join("、")}。</p>
        <p><strong>投影示例 · 第 1 个输出坐标</strong><br />
          <span className="projection-equation">0.5 × {values[0].toFixed(3)} + 0.3 × {values[1].toFixed(3)} + 0.2 × {values[3].toFixed(3)} = {output[0].toFixed(3)}</span></p>
      </div>
      <p className="rk-note">输入从同一张图采样并缩放到 0–1。示例矩阵在每列取三个非零系数，循环使用同一索引规则。真实 ViT 使用学习到的投影权重，画面只跟踪第一列的三条贡献路径。</p>
    </> : <p>{error ? "暂时无法读取插图像素，可以从上方图解查看展平和投影关系。" : "正在读取所选 Patch 的 RGB 数值…"}</p>}
  </div>;
}
