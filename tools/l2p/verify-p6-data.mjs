import assert from "node:assert/strict";
import {
  P6_FINAL_POOL_EXAMPLE,
  P6_FIRST_PATCH_SEQUENCE_INDEX,
  P6_IMAGE_CLS_SEQUENCE_INDEX,
  P6_LAST_PATCH_SEQUENCE_INDEX,
  P6_POOL_SAMPLE_ROWS,
  P6_PROMPT_COUNT,
  P6_PROMPT_TOKEN_COUNT,
  P6_PROMPT_TOKEN_MAP,
  P6_RETRIEVAL_SNAPSHOT,
  P6_SELECTED_PROMPT_INDICES,
  P6_SEQUENCE_LENGTH,
  buildPromptTokenMap,
  computePromptOutputPool,
} from "../../papers/l2p/web/enhanced/src/modules/prompt-forward-data.ts";
import { promptPoolConfig } from "../../papers/l2p/web/enhanced/src/modules/prompt-retrieval-data.ts";

const close = (actual, expected, tolerance = 1e-12) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};

assert.deepEqual([...P6_SELECTED_PROMPT_INDICES], [1, 2, 10, 3, 9], "P6 should use P5 Query A's computed Top-5 order");
assert.deepEqual([...P6_SELECTED_PROMPT_INDICES], P6_RETRIEVAL_SNAPSHOT.ranking.slice(0, promptPoolConfig.topN).map(row => row.index));
assert.equal(P6_PROMPT_COUNT, 5);
assert.equal(P6_PROMPT_TOKEN_COUNT, 25);
assert.equal(P6_IMAGE_CLS_SEQUENCE_INDEX, 25);
assert.equal(P6_FIRST_PATCH_SEQUENCE_INDEX, 26);
assert.equal(P6_LAST_PATCH_SEQUENCE_INDEX, 221);
assert.equal(P6_SEQUENCE_LENGTH, 222);
assert.equal(promptPoolConfig.featureWidth, 768);

assert.equal(P6_PROMPT_TOKEN_MAP.length, 25);
P6_PROMPT_TOKEN_MAP.forEach((ref, linearIndex) => {
  const promptOrdinal = Math.floor(linearIndex / promptPoolConfig.promptLength);
  const tokenIndex = linearIndex % promptPoolConfig.promptLength;
  assert.equal(ref.promptIndex, P6_SELECTED_PROMPT_INDICES[promptOrdinal]);
  assert.equal(ref.promptOrdinal, promptOrdinal);
  assert.equal(ref.tokenIndex, tokenIndex);
  assert.equal(ref.sequenceIndex, linearIndex);
});
assert.equal(P6_PROMPT_TOKEN_MAP[12].promptIndex, 10);
assert.equal(P6_PROMPT_TOKEN_MAP[12].tokenIndex, 2);
assert.equal(P6_PROMPT_TOKEN_MAP[12].sequenceIndex, 12);
assert.throws(() => buildPromptTokenMap([1], 0), RangeError);

assert.deepEqual(P6_POOL_SAMPLE_ROWS.map(row => row.promptIndex), [...P6_SELECTED_PROMPT_INDICES]);
assert.deepEqual(P6_POOL_SAMPLE_ROWS.map(row => row.sequenceStart), [0, 5, 10, 15, 20]);
P6_FINAL_POOL_EXAMPLE.groupSums.forEach((value, index) => close(value, [1.5, 1, 1.5, 0.5, 1.5][index]));
assert.equal(P6_FINAL_POOL_EXAMPLE.includedCount, 25);
assert.equal(P6_FINAL_POOL_EXAMPLE.sum, 6);
assert.equal(P6_FINAL_POOL_EXAMPLE.runningMean, 0.24);

const midpoint = computePromptOutputPool(P6_POOL_SAMPLE_ROWS.map(row => row.values), 12);
midpoint.groupSums.forEach((value, index) => close(value, [1.5, 1, 0.7, 0, 0][index]));
assert.ok(Math.abs(midpoint.sum - 3.2) < 1e-12);
assert.ok(Math.abs(midpoint.runningMean - (3.2 / 12)) < 1e-12);
assert.equal(computePromptOutputPool(P6_POOL_SAMPLE_ROWS.map(row => row.values), 0).runningMean, null);
assert.throws(() => computePromptOutputPool([[1, Number.NaN]], 1), RangeError);
assert.throws(() => computePromptOutputPool([[1]], 2), RangeError);

console.log(`P6 data verified: selected P${P6_SELECTED_PROMPT_INDICES.join(", P")}, positions ${P6_PROMPT_TOKEN_COUNT}+${promptPoolConfig.imageLength}=${P6_SEQUENCE_LENGTH}, AvgPool ${P6_FINAL_POOL_EXAMPLE.sum}/25=${P6_FINAL_POOL_EXAMPLE.runningMean}.`);
