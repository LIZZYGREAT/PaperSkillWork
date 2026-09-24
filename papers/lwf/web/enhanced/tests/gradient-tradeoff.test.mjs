import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTradeoff,
  newTaskGradientAtOrigin,
  oldParameterOptimum,
  responseObjective,
} from '../src/simulation/gradientTradeoff.ts';

test('linear Teaching Toy matches the fixed Teacher response at its stated old optimum', () => {
  const result = responseObjective(oldParameterOptimum, 2, 'sum');
  assert.ok(Math.hypot(...result.gradient) < 1e-10);
});

test('mapped response gradient matches finite differences of the actual toy loss', () => {
  const theta = [.23, -.31];
  const result = responseObjective(theta, 1.7, 'mean');
  for (let index = 0; index < 2; index += 1) {
    const delta = 1e-5;
    const plus = [...theta]; const minus = [...theta];
    plus[index] += delta; minus[index] -= delta;
    const numerical = (responseObjective(plus, 1.7, 'mean').loss - responseObjective(minus, 1.7, 'mean').loss) / (2 * delta);
    assert.ok(Math.abs(result.gradient[index] - numerical) < 1e-7);
  }
});

test('geometry presets make aligned, orthogonal, and conflicting gradients', () => {
  const old = [3, 4];
  const aligned = newTaskGradientAtOrigin(old, 'aligned');
  const orthogonal = newTaskGradientAtOrigin(old, 'orthogonal');
  const conflicting = newTaskGradientAtOrigin(old, 'conflicting');
  const cosine = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0) / (Math.hypot(...left) * Math.hypot(...right));
  assert.ok(Math.abs(cosine(old, aligned) - 1) < 1e-12);
  assert.ok(Math.abs(cosine(old, orthogonal)) < 1e-12);
  assert.ok(Math.abs(cosine(old, conflicting) + 1) < 1e-12);
});

test('lambda scales the old gradient contribution, not the new gradient', () => {
  const common = { theta: [0, 0], newOptimum: [-.2, -.1], temperature: 2, oldReduction: 'sum', newReduction: 'sum', regularization: false };
  const one = evaluateTradeoff({ ...common, lambdaOld: 1 });
  const two = evaluateTradeoff({ ...common, lambdaOld: 2 });
  one.oldGradient.forEach((value, index) => assert.ok(Math.abs(two.oldScaledGradient[index] - 2 * value) < 1e-12));
  one.newGradient.forEach((value, index) => assert.equal(two.newGradient[index], value));
});
