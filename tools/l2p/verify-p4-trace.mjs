import assert from "node:assert/strict";
import { P4_TOY_EXPERIMENT, P4_TRAINING_TRACE, runP4Forward } from "../../papers/l2p/web/enhanced/src/modules/prompt-tuning-demo.ts";

const close = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};
const nested = (rows, callback) => rows.forEach((row, i) => row.forEach((value, j) => callback(value, i, j)));
const frozenBefore = JSON.stringify(P4_TOY_EXPERIMENT.frozenWeights);
const { prompt, classifier, learningRate } = P4_TOY_EXPERIMENT;
const trace = P4_TRAINING_TRACE;

const recomputedInitial = runP4Forward(prompt, classifier.weights, classifier.bias);
const recomputedUpdated = runP4Forward(trace.updatedPrompt, trace.updatedClassifierWeights, trace.updatedClassifierBias);
close(recomputedInitial.loss, trace.initial.loss);
close(recomputedUpdated.loss, trace.updated.loss);
nested(prompt, (value, i, j) => close(trace.updatedPrompt[i][j], value - learningRate * trace.promptGradients[i][j]));
nested(classifier.weights, (value, i, j) => close(trace.updatedClassifierWeights[i][j], value - learningRate * trace.classifierWeightGradients[i][j]));
classifier.bias.forEach((value, i) => close(trace.updatedClassifierBias[i], value - learningRate * trace.classifierBiasGradients[i]));
assert.ok(trace.gradientCheck.maxAbsoluteError < 1e-6, "analytic Prompt gradients should match the independent central-difference check");
assert.ok(trace.promptGradients.flat().some(value => value !== 0), "the Prompt should receive a classification gradient through frozen Attention");
assert.ok(trace.updated.loss < trace.initial.loss, "the declared teaching update should lower this sample's loss");
assert.equal(JSON.stringify(P4_TOY_EXPERIMENT.frozenWeights), frozenBefore, "frozen Attention parameters must remain unchanged");

console.log(`P4 trace verified: loss ${trace.initial.loss.toFixed(6)} → ${trace.updated.loss.toFixed(6)}, max gradient-check error ${trace.gradientCheck.maxAbsoluteError.toExponential(2)}.`);
