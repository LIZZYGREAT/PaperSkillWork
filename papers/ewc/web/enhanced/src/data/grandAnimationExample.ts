export const GRAND_TASK_EXAMPLES = {
  a: {
    task: "A",
    logits: [1.3, 0.4, -0.2],
    targetIndex: 0,
    examples: [
      { label: "A", pixels: "0110111111110110" },
      { label: "B", pixels: "0100111001001110" },
      { label: "C", pixels: "1111001111001111" },
    ],
  },
  b: {
    task: "B",
    logits: [-0.2, 1.3, 0.4],
    targetIndex: 1,
    examples: [
      { label: "A", pixels: "1100101010100011" },
      { label: "B", pixels: "1111100110011110" },
      { label: "C", pixels: "0110100111101011" },
    ],
  },
  c: {
    task: "C",
    logits: [0.4, -0.2, 1.3],
    targetIndex: 2,
    examples: [
      { label: "A", pixels: "1001011001101001" },
      { label: "B", pixels: "1010101010101010" },
      { label: "C", pixels: "0101010110101010" },
    ],
  },
} as const;

export type GrandTaskKey = keyof typeof GRAND_TASK_EXAMPLES;

export function softmax(logits: readonly number[]) {
  const exponents = logits.map((value) => Math.exp(value - Math.max(...logits)));
  const denominator = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / denominator);
}

export const GRAND_TASK_OUTPUTS = Object.fromEntries(
  Object.entries(GRAND_TASK_EXAMPLES).map(([key, example]) => {
    const probabilities = softmax(example.logits);
    return [key, {
      ...example,
      probabilities,
      targetProbability: probabilities[example.targetIndex],
    }];
  }),
) as Record<GrandTaskKey, (typeof GRAND_TASK_EXAMPLES)[GrandTaskKey] & { probabilities: number[]; targetProbability: number }>;

export const TASK_B_GRADIENT_EXAMPLE = {
  anchor: 0.42,
  current: 0.52,
  fisherHigh: 8,
  fisherLow: 0.5,
  lambda: 0.2,
  taskGradient: -0.2,
  learningRate: 0.1,
};

export function parameterUpdate(fisher: number) {
  const { anchor, current, lambda, taskGradient, learningRate } = TASK_B_GRADIENT_EXAMPLE;
  const ewcGradient = lambda * fisher * (current - anchor);
  const totalGradient = taskGradient + ewcGradient;
  return { ewcGradient, totalGradient, next: current - learningRate * totalGradient };
}

export function lifecycleAt(index: number) {
  return {
    task: index >= 17 ? "c" as const : index >= 14 ? "b" as const : "a" as const,
    anchorReady: index >= 11,
    fisherReady: index >= 12,
    taskAStateReady: index >= 13,
    taskBStateReady: index >= 17,
    currentTaskActive: index >= 14 && index < 17,
    taskAIsOldSource: index >= 7,
    trainingUpdate: index >= 1 && index <= 6,
  };
}
