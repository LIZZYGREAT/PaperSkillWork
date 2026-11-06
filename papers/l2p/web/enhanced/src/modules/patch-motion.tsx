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
  { at: 3950, name: "应用线性投影" },
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
  const projection = clamp((position - 3950) / 1750);
  const visibleOutput = clamp((position - 5000) / 1800);
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
  } else if (position < 3950) {
    ctx.fillText("x[0] → x[767]", 42, 49);
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.fillText("每行连续 48 项，折行只为阅读", 42, 242);
  } else {
    ctx.fillText("输入 x", 34, 75);
    ctx.fillText("W 局部", 350, 75);
    ctx.fillText("输出 z", 452, 75);
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
    ctx.strokeStyle = "#709578";
    for (let i = 0; i < 3; i++) {
      const sourceX = blend(42, 34, projection) + SAMPLE_WEIGHTS[i].offset * blend(14.1, 5.9, projection);
      const sourceY = blend(72, 94, projection);
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      const matrixY = 98 + SAMPLE_WEIGHTS[i].offset * 11;
      ctx.bezierCurveTo(176, 80 + i * 14, 248, matrixY, 352, matrixY);
      ctx.stroke();
      ctx.fillStyle = "#9b632d";
      const progress = clamp(projection * 1.3 - i * .12);
      if (progress > 0 && progress < 1) {
        const inv = 1 - progress;
        const x = inv ** 3 * sourceX + 3 * inv ** 2 * progress * 176 + 3 * inv * progress ** 2 * 248 + progress ** 3 * 352;
        const y = inv ** 3 * sourceY + 3 * inv ** 2 * progress * (80 + i * 14) + 3 * inv * progress ** 2 * matrixY + progress ** 3 * matrixY;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.beginPath(); ctx.moveTo(360, 98); ctx.lineTo(452, 98); ctx.stroke();
    if (visibleOutput > 0 && visibleOutput < 1) {
      ctx.fillStyle = "#9b632d";
      ctx.beginPath(); ctx.arc(blend(360, 452, visibleOutput), 98, 3, 0, Math.PI * 2); ctx.fill();
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
      <div className="patch-motion-detail">
        <p><strong>展平顺序</strong><br />按行、列扫描，每个像素依次取 R、G、B。首个像素的三项为 {values.slice(0, 3).map(value => value.toFixed(3)).join("、")}。</p>
        <p><strong>投影示例 · 第 1 个输出坐标</strong><br />
          <span className="projection-equation">0.5 × {values[0].toFixed(3)} + 0.3 × {values[1].toFixed(3)} + 0.2 × {values[3].toFixed(3)} = {output[0].toFixed(3)}</span></p>
      </div>
      <p className="rk-note">输入从同一张图采样并缩放到 0–1。示例矩阵在每列取三个非零系数，循环使用同一索引规则。真实 ViT 使用学习到的投影权重，画面只跟踪第一列的三条贡献路径。</p>
    </> : <p>{error ? "暂时无法读取插图像素，可以从上方图解查看展平和投影关系。" : "正在读取所选 Patch 的 RGB 数值…"}</p>}
  </div>;
}
