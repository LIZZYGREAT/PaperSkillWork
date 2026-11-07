import { buildSelectionSnapshot, promptPoolConfig, type QueryId } from "./prompt-retrieval-data";

export type BatchSample = Readonly<{
  id: QueryId;
  symbol: string;
  queryLabel: string;
  labelSymbol: string;
  logitsSymbol: string;
  selected: readonly number[];
  distances: Readonly<Record<number, number>>;
}>;

export const P7_BATCH_SAMPLES: readonly BatchSample[] = Object.freeze((["A", "B"] as const).map(id => {
  const snapshot = buildSelectionSnapshot(id);
  return Object.freeze({
    id,
    symbol: `x_${id}`,
    queryLabel: `q_${id}`,
    labelSymbol: `y_${id}`,
    logitsSymbol: `z_${id}`,
    selected: snapshot.selectedKeyIndices,
    distances: Object.freeze(Object.fromEntries(snapshot.selected.map(candidate => [candidate.index, candidate.distance]))),
  });
}));

export const P7_COMMON_INDICES: readonly number[] = Object.freeze(
  P7_BATCH_SAMPLES[0].selected.filter(index => P7_BATCH_SAMPLES[1].selected.includes(index)),
);

export const P7_BATCH_INDICES: readonly number[] = Object.freeze(
  [...new Set(P7_BATCH_SAMPLES.flatMap(sample => sample.selected))].sort((left, right) => left - right),
);

export const P7_UNTOUCHED_INDICES: readonly number[] = Object.freeze(
  Array.from({ length: promptPoolConfig.poolSize }, (_, offset) => offset + 1).filter(index => !P7_BATCH_INDICES.includes(index)),
);

export function gradientSourcesForSlot(index: number) {
  const selectedBy = P7_BATCH_SAMPLES.filter(sample => sample.selected.includes(index)).map(sample => sample.id);
  return Object.freeze({
    prompts: selectedBy,
    keys: selectedBy,
    classifier: Object.freeze(["A", "B"] as const),
  });
}

export function selectedDistanceTotal(sample: BatchSample) {
  return sample.selected.reduce((sum, index) => sum + sample.distances[index], 0);
}

export const P7_EXAMPLE_GRADIENT = Object.freeze({
  query: Object.freeze({ x: 1, y: 0 }),
  initialKey: Object.freeze({ x: 0, y: 1 }),
  learningRate: 0.2,
  gradient: Object.freeze({ x: -1, y: 0 }),
  updatedKey: Object.freeze({ x: 0.2, y: 1 }),
});

export function distanceFromExampleKey(key: Readonly<{ x: number; y: number }>) {
  const norm = Math.hypot(key.x, key.y);
  return norm === 0 ? Number.NaN : 1 - key.x / norm;
}
