import { computeDistillation, type Reduction, type Vector } from './distillation.ts';

export type Vector2 = [number, number];
export type GradientGeometry = 'aligned' | 'orthogonal' | 'conflicting';

const teacherLogits = [.46, .27, .14, .08, .05].map(Math.log);

// A deliberately small linear Teaching Toy: z_old(θ) = z₀ + Jθ.
// This Jacobian is synthetic and does not stand in for the paper's CNN.
const logitJacobian: Vector2[] = [
  [1, .2], [.3, 1], [-.8, .2], [.1, -.7], [-.6, -.7],
];
export const oldParameterOptimum: Vector2 = [-1.2, .9];
const studentBaseLogits = teacherLogits.map((value, index) => value - dot(logitJacobian[index], oldParameterOptimum));

export function responseObjective(theta: Vector2, temperature: number, reduction: Reduction) {
  const logits = studentBaseLogits.map((base, index) => base + dot(logitJacobian[index], theta));
  const result = computeDistillation({
    teacherLogits,
    studentLogits: logits,
    temperature,
    reduction,
    lossKind: 'cross-entropy',
  });
  const gradient: Vector2 = [
    result.gradient.reduce((sum, value, index) => sum + value * logitJacobian[index][0], 0),
    result.gradient.reduce((sum, value, index) => sum + value * logitJacobian[index][1], 0),
  ];
  return { loss: result.loss, gradient, logitGradient: result.gradient, logits };
}

export function newTaskGradientAtOrigin(oldGradient: Vector2, geometry: GradientGeometry, newScale = 1): Vector2 {
  const magnitude = Math.max(norm(oldGradient) * .85, .04);
  const unit = norm(oldGradient) > 1e-10 ? scale(oldGradient, 1 / norm(oldGradient)) : [1, 0] as Vector2;
  const direction: Vector2 = geometry === 'aligned'
    ? unit
    : geometry === 'orthogonal'
      ? [-unit[1], unit[0]]
      : scale(unit, -1);
  return scale(direction, magnitude / newScale);
}

export function evaluateTradeoff(input: {
  theta: Vector2;
  newOptimum: Vector2;
  temperature: number;
  oldReduction: Reduction;
  newReduction: Reduction;
  lambdaOld: number;
  regularization: boolean;
}) {
  const old = responseObjective(input.theta, input.temperature, input.oldReduction);
  const newScale = reductionScale(input.newReduction);
  const displacement = subtract(input.theta, input.newOptimum);
  const newGradient = scale(displacement, newScale);
  const newLoss = .5 * dot(displacement, displacement) * newScale;
  const regularizationGradient = input.regularization ? [...input.theta] as Vector2 : [0, 0] as Vector2;
  const regularizationLoss = input.regularization ? .5 * dot(input.theta, input.theta) : 0;
  const oldScaled = scale(old.gradient, input.lambdaOld);
  const totalGradient = add(add(oldScaled, newGradient), regularizationGradient);
  const oldNorm = norm(old.gradient);
  const newNorm = norm(newGradient);
  const alignment = oldNorm * newNorm > 1e-12 ? dot(old.gradient, newGradient) / (oldNorm * newNorm) : 0;
  return {
    oldLoss: old.loss,
    newLoss,
    regularizationLoss,
    totalLoss: input.lambdaOld * old.loss + newLoss + regularizationLoss,
    oldGradient: old.gradient,
    oldScaledGradient: oldScaled,
    newGradient,
    regularizationGradient,
    totalGradient,
    oldNorm,
    newNorm,
    oldScaledNorm: norm(oldScaled),
    totalNorm: norm(totalGradient),
    alignment,
    responseLogits: old.logits,
  };
}

export function norm(vector: Vector2) {
  return Math.sqrt(dot(vector, vector));
}

export function dot(left: Vector2, right: Vector2) {
  return left[0] * right[0] + left[1] * right[1];
}

export function add(left: Vector2, right: Vector2): Vector2 {
  return [left[0] + right[0], left[1] + right[1]];
}

export function subtract(left: Vector2, right: Vector2): Vector2 {
  return [left[0] - right[0], left[1] - right[1]];
}

export function scale(vector: Vector2, factor: number): Vector2 {
  return [vector[0] * factor, vector[1] * factor];
}

export function reductionScale(reduction: Reduction) {
  return reduction === 'mean' ? .5 : 1; // one toy sample, two new-task coordinates
}

export function vectorAngle(vector: Vector2, radians: number): Vector2 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return [c * vector[0] - s * vector[1], s * vector[0] + c * vector[1]];
}
