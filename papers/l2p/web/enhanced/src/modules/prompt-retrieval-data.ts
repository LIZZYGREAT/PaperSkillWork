export const promptPoolConfig = {
  poolSize: 10,
  topN: 5,
  promptLength: 5,
  imageLength: 197,
  featureWidth: 768,
} as const;

export type QueryId = "A" | "B";

export function keyAngle(index: number) {
  return (Math.PI * 2 * (index - 1)) / promptPoolConfig.poolSize;
}

export function queryAngle(query: QueryId) {
  return query === "A" ? 0 : keyAngle(4);
}

export function distanceToKey(query: QueryId, index: number) {
  const difference = queryAngle(query) - keyAngle(index);
  return 1 - Math.cos(difference);
}

export function rankKeys(query: QueryId) {
  return Array.from({ length: promptPoolConfig.poolSize }, (_, offset) => ({
    index: offset + 1,
    distance: distanceToKey(query, offset + 1),
  })).sort((left, right) => left.distance - right.distance || left.index - right.index);
}

export function selectedKeyIndices(query: QueryId) {
  return rankKeys(query).slice(0, promptPoolConfig.topN).map(item => item.index);
}
