import test from 'node:test';
import assert from 'node:assert/strict';
import {
  directionDrift,
  functionResponseDrift,
  linearReparameterization,
  ordinaryWeightDecayLoss,
  parameterPreservationLoss,
  probeInputs,
  probeVanisher,
  studentFunction,
  teacherFunction,
} from '../src/simulation/functionPreservation.ts';

test('different parameters can encode the same a*b*x function', () => {
  const result = linearReparameterization(2, 2);
  assert.ok(result.parameterDistance > 0);
  assert.equal(result.output, 2);
});

test('a 0.001 parameter change is magnified to an output change of 1 at x=1000', () => {
  assert.ok(Math.abs(Math.abs(1000 * (1.001 - 1)) - 1) < 1e-10);
});

test('equal parameter radii can produce different response drift by direction', () => {
  const alignedWithSensitiveAxis = directionDrift(.35, 0);
  const weaklySensitiveAxis = directionDrift(.35, Math.PI / 2);
  assert.ok(alignedWithSensitiveAxis > weaklySensitiveAxis * 2);
});

test('probe-null parameter direction leaves every X_n point fixed but moves between probes', () => {
  const change = [0, 0, .8];
  assert.ok(functionResponseDrift(change, probeInputs) < 1e-12);
  assert.ok(Math.abs(studentFunction(0, change) - teacherFunction(0)) > .01);
  assert.ok(probeInputs.every((x) => probeVanisher(x) === 0));
});

test('parameter preservation and ordinary weight decay measure different anchors', () => {
  const change = [.1, -.2, .3];
  const current = [.5, -.08, .3];
  const preserveOld = parameterPreservationLoss(change, 1);
  const decayToZero = ordinaryWeightDecayLoss(current, 1);
  assert.notEqual(preserveOld, decayToZero);
});
