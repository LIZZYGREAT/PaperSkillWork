export type VectorN = number[];
export type Vector2 = [number, number];

export const probeInputs = [-1.2, -.4, .4, 1.2] as const;
export const directionProbes = [.5, 1.5] as const;
export const oldFunctionParameters = [.4, .48, 0] as const;

export function teacherFunction(x: number) {
  return oldFunctionParameters[0] * x + oldFunctionParameters[1] * .25 * x * x;
}

export function studentFunction(x: number, change: VectorN) {
  return teacherFunction(x) + change[0] * x + change[1] * .25 * x * x + (change[2] || 0) * probeVanisher(x);
}

export function probeVanisher(x: number) {
  return probeInputs.reduce((product, point) => product * (x - point), 1) / 1.6384;
}

export function functionResponseDrift(change: VectorN, inputs: readonly number[] = probeInputs) {
  if (!inputs.length) return 0;
  const squared = inputs.reduce((sum, x) => sum + (studentFunction(x, change) - teacherFunction(x)) ** 2, 0);
  return Math.sqrt(squared / inputs.length);
}

export function parameterDistance(change: VectorN) {
  return Math.sqrt(change.reduce((sum, value) => sum + value * value, 0));
}

export function parameterPreservationLoss(change: VectorN, coefficient: number) {
  return .5 * coefficient * change.reduce((sum, value) => sum + value * value, 0);
}

export function ordinaryWeightDecayLoss(currentParameters: VectorN, coefficient: number) {
  return .5 * coefficient * currentParameters.reduce((sum, value) => sum + value * value, 0);
}

export function equalRadiusChange(radius: number, angleRadians: number): Vector2 {
  return [radius * Math.cos(angleRadians), radius * Math.sin(angleRadians)];
}

export function responseVector(change: Vector2, inputs: readonly number[] = directionProbes): Vector2 {
  return [
    change[0] * inputs[0] + change[1] * .25 * inputs[0] ** 2,
    change[0] * inputs[1] + change[1] * .25 * inputs[1] ** 2,
  ];
}

export function vectorMagnitude(vector: readonly number[]) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

export function linearReparameterization(a: number, x: number) {
  if (!Number.isFinite(a) || a === 0) throw new RangeError('a must be non-zero.');
  const b = 1 / a;
  return { a, b, parameterDistance: Math.hypot(a - 1, b - 1), output: a * b * x };
}

export function directionDrift(radius: number, angleRadians: number) {
  return vectorMagnitude(responseVector(equalRadiusChange(radius, angleRadians)));
}

export function jacobianEllipsePoint(radius: number, angleRadians: number): Vector2 {
  return responseVector(equalRadiusChange(radius, angleRadians));
}
