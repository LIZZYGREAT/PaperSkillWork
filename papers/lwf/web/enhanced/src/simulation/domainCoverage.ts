export type CoverageMode = 'high' | 'partial' | 'low';

export const coverageCopy: Record<CoverageMode, { title: string; newRange: [number, number]; description: string }> = {
  high: { title: '较广覆盖示意', newRange: [-1.75, 1.75], description: '新任务约束点分布在较宽的输入区间；这只是教学采样设计，不是论文数据集分布。' },
  partial: { title: '部分重叠示意', newRange: [-.55, .75], description: '约束点只覆盖旧域参考区间的一部分；未被采样的位置没有直接的响应约束。' },
  low: { title: '低重叠示意', newRange: [1.05, 1.85], description: '约束集中在输入空间另一侧；旧域参考点大多处于未观测区域。' },
};

export const oldSupportPoints = [-1.55, -.85, .85, 1.55];

export function constraintPoints(mode: CoverageMode, count: number) {
  const [start, end] = coverageCopy[mode].newRange;
  return Array.from({ length: count }, (_, i) => count === 1 ? (start + end) / 2 : start + (end - start) * i / (count - 1));
}

export function teacherOutput(x: number) { return .18 * x + .08 * x * x - .04; }

function vanishingShape(x: number, probes: number[]) {
  const [start, end] = coverageCopyFor(probes);
  const phase = Math.PI * (probes.length - 1) * (x - start) / (end - start);
  return Math.sin(phase);
}

function coverageCopyFor(probes: number[]): [number, number] {
  return [probes[0], probes[probes.length - 1]];
}

export function studentOutput(x: number, mode: 'A' | 'B', probes: number[], amplitude = .72) {
  return teacherOutput(x) + (mode === 'B' ? amplitude * vanishingShape(x, probes) : 0);
}

export function responseLossOnConstraints(mode: 'A' | 'B', probes: number[]) {
  return probes.reduce((sum, x) => sum + (studentOutput(x, mode, probes) - teacherOutput(x)) ** 2, 0) / probes.length;
}

export function oldSupportDrift(mode: 'A' | 'B', probes: number[]) {
  return oldSupportPoints.reduce((sum, x) => sum + (studentOutput(x, mode, probes) - teacherOutput(x)) ** 2, 0) / oldSupportPoints.length;
}

export function toyTeacherProbabilities(x: number, classes = 5) {
  const logits = Array.from({ length: classes }, (_, i) => .7 * Math.cos((i + 1) * x) - .17 * i);
  const exp = logits.map((value) => Math.exp(value - Math.max(...logits)));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((value) => value / sum);
}

export function summarizeTeacherResponse(probes: number[]) {
  const probabilities = probes.map((x) => toyTeacherProbabilities(x));
  const avgEntropy = probabilities.reduce((total, row) => total + row.reduce((sum, p) => sum - p * Math.log2(p), 0), 0) / probabilities.length;
  const avgTop = probabilities.reduce((total, row) => total + Math.max(...row), 0) / probabilities.length;
  return { avgEntropy, avgTop };
}
