import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareResponseLosses,
  computeDistillation,
  entropy,
  softmax,
  temperatureTransform,
} from '../src/simulation/distillation.ts';

const teacherLogits = [1.4, 0.8, 0.1, -0.6, -1.2];
const studentLogits = [1.1, 0.6, 0.2, -0.4, -1.0];

test('softmax produces a normalized distribution and temperature softens it', () => {
  const raw = softmax(teacherLogits);
  const warm = softmax(teacherLogits, 3);
  assert.ok(Math.abs(raw.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  assert.ok(entropy(warm) > entropy(raw));
});

test('probability-space and logits-space temperature transforms agree', () => {
  const fromProbabilities = temperatureTransform(softmax(teacherLogits), 2);
  const fromLogits = softmax(teacherLogits, 2);
  fromProbabilities.forEach((value, index) => assert.ok(Math.abs(value - fromLogits[index]) < 1e-12));
});

test('per-class cross entropy adds to the displayed loss under sum reduction', () => {
  const result = computeDistillation({ teacherLogits, studentLogits, temperature: 2, reduction: 'sum' });
  assert.ok(Math.abs(result.perClassCrossEntropy.reduce((sum, value) => sum + value, 0) - result.loss) < 1e-12);
});

test('teacher/student mismatch gives the expected cross-entropy logit gradient', () => {
  const result = computeDistillation({ teacherLogits, studentLogits, temperature: 2, reduction: 'sum' });
  result.gradient.forEach((value, index) => {
    assert.ok(Math.abs(value - (result.student[index] - result.teacherTarget[index]) / 2) < 1e-12);
  });
});

test('KD and cross-entropy share gradients while their losses differ by target entropy', () => {
  const [kd, crossEntropy] = compareResponseLosses(teacherLogits, studentLogits, 2, 'sum');
  kd.gradient.forEach((value, index) => assert.ok(Math.abs(value - crossEntropy.gradient[index]) < 1e-12));
  assert.ok(Math.abs((crossEntropy.loss - kd.loss) - entropy(kd.teacherTarget)) < 1e-12);
});

test('L1 and L2 logit gradients match central finite differences away from kinks', () => {
  for (const lossKind of ['l1', 'l2']) {
    const analytic = computeDistillation({ teacherLogits, studentLogits, temperature: 1.7, reduction: 'sum', lossKind });
    analytic.gradient.forEach((gradient, index) => {
      const delta = 1e-5;
      const plus = [...studentLogits];
      const minus = [...studentLogits];
      plus[index] += delta;
      minus[index] -= delta;
      const lossPlus = computeDistillation({ teacherLogits, studentLogits: plus, temperature: 1.7, reduction: 'sum', lossKind }).loss;
      const lossMinus = computeDistillation({ teacherLogits, studentLogits: minus, temperature: 1.7, reduction: 'sum', lossKind }).loss;
      assert.ok(Math.abs(gradient - (lossPlus - lossMinus) / (2 * delta)) < 2e-5);
    });
  }
});
