export type Point = { x: number; y: number };

export function clamp(value: number, min = 0, max = 1) {
  return value < min ? min : value > max ? max : value;
}

export function progressWithin(value: number, start: number, end: number) {
  if (end <= start) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start));
}

export function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

export function easeOutCubic(value: number) {
  const t = clamp(value);
  return 1 - Math.pow(1 - t, 3);
}

export function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * clamp(progress);
}

export function lerpPoint(from: Point, to: Point, progress: number) {
  const t = smoothstep(progress);
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
}
