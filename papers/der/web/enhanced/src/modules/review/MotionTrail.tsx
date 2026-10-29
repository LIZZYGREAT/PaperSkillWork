import { curve, mix, type Point } from "./lifecycle-model";

/** A short, already-travelled section behind a moving object, matching D1. */
export function MotionTrail({ points, progress, className }: {
  points: readonly [Point, Point, Point, Point];
  progress: number;
  className: string;
}) {
  if (progress <= .06 || progress >= .99) return null;
  const start = Math.max(0, progress - .32), end = Math.max(0, progress - .07);
  const path = Array.from({ length: 16 }, (_, i) => {
    const p = curve(mix(start, end, i / 15), points[0], points[1], points[2], points[3]);
    return `${i ? "L" : "M"}${p.x} ${p.y}`;
  }).join(" ");
  return <path d={path} className={className} aria-hidden="true" data-trail-progress={progress}
    opacity={Math.min(1, progress * 6, (1 - progress) * 8)} />;
}
