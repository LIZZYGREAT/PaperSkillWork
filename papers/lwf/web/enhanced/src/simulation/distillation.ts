export type Vector = number[];
export type ResponseLossKind = 'kd' | 'cross-entropy' | 'l1' | 'l2';
export type Reduction = 'mean' | 'sum' | 'batchmean';
export type CacheFormat = 'probabilities' | 'logits';

export interface DistillationResult {
  teacherRaw: Vector;
  teacherTarget: Vector;
  student: Vector;
  perClassCrossEntropy: Vector;
  perClassLoss: Vector;
  loss: number;
  gradient: Vector;
}

const EPSILON = 1e-12;

export function softmax(logits: Vector, temperature = 1): Vector {
  assertDistributionInput(logits, temperature);
  const scaled = logits.map((value) => value / temperature);
  const maximum = Math.max(...scaled);
  const exponentials = scaled.map((value) => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

export function temperatureTransform(probabilities: Vector, temperature: number): Vector {
  assertDistributionInput(probabilities, temperature);
  if (probabilities.some((value) => value < 0)) throw new RangeError('Probabilities cannot be negative.');
  const powered = probabilities.map((value) => Math.pow(Math.max(value, 0), 1 / temperature));
  const total = powered.reduce((sum, value) => sum + value, 0);
  if (total === 0) throw new RangeError('At least one probability must be positive.');
  return powered.map((value) => value / total);
}

export function entropy(probabilities: Vector): number {
  return -probabilities.reduce((sum, probability) => sum + (probability > 0 ? probability * Math.log(probability) : 0), 0);
}

export function crossEntropy(target: Vector, prediction: Vector): number {
  assertSameLength(target, prediction);
  return -target.reduce((sum, value, index) => sum + value * Math.log(Math.max(prediction[index], EPSILON)), 0);
}

export function perClassCrossEntropy(target: Vector, prediction: Vector): Vector {
  assertSameLength(target, prediction);
  return target.map((value, index) => -value * Math.log(Math.max(prediction[index], EPSILON)));
}

export function distributionDistance(left: Vector, right: Vector): number {
  assertSameLength(left, right);
  return left.reduce((sum, value, index) => sum + Math.abs(value - right[index]), 0);
}

export function argmax(values: Vector): number {
  return values.reduce((best, value, index) => value > values[best] ? index : best, 0);
}

export function reducePerClass(values: Vector, reduction: Reduction, batchSize = 1): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (reduction === 'sum') return total;
  if (reduction === 'batchmean') return total / Math.max(1, batchSize);
  return total / Math.max(1, values.length * batchSize);
}

export function computeDistillation(input: {
  teacherLogits: Vector;
  studentLogits: Vector;
  temperature: number;
  reduction?: Reduction;
  lossKind?: ResponseLossKind;
  cacheFormat?: CacheFormat;
  includeT2?: boolean;
  batchSize?: number;
}): DistillationResult {
  const { teacherLogits, studentLogits, temperature } = input;
  assertSameLength(teacherLogits, studentLogits);
  const reduction = input.reduction || 'sum';
  const lossKind = input.lossKind || 'cross-entropy';
  const batchSize = Math.max(1, input.batchSize || 1);
  const teacherRaw = softmax(teacherLogits);
  const teacherTarget = input.cacheFormat === 'probabilities'
    ? temperatureTransform(teacherRaw, temperature)
    : softmax(teacherLogits, temperature);
  const student = softmax(studentLogits, temperature);
  const perClassCE = perClassCrossEntropy(teacherTarget, student);
  const perClassLoss = responseLossTerms(lossKind, teacherTarget, student);
  const reductionScale = reduction === 'sum' ? 1 : reduction === 'batchmean' ? 1 / batchSize : 1 / (batchSize * teacherTarget.length);
  const t2Scale = input.includeT2 && (lossKind === 'kd' || lossKind === 'cross-entropy') ? temperature * temperature : 1;
  const loss = reducePerClass(perClassLoss, reduction, batchSize) * t2Scale;
  const unscaledGradient = lossGradientWithRespectToProbabilities(lossKind, teacherTarget, student);
  const gradient = lossKind === 'kd' || lossKind === 'cross-entropy'
    ? student.map((probability, index) => (probability - teacherTarget[index]) / temperature * reductionScale * t2Scale)
    : (() => {
      const centered = unscaledGradient.reduce((sum, value, index) => sum + value * student[index], 0);
      return student.map((probability, index) => probability * (unscaledGradient[index] - centered) / temperature * reductionScale * t2Scale);
    })();
  return { teacherRaw, teacherTarget, student, perClassCrossEntropy: perClassCE, perClassLoss, loss, gradient };
}

export function compareResponseLosses(teacherLogits: Vector, studentLogits: Vector, temperature: number, reduction: Reduction, includeT2 = false) {
  const kinds: ResponseLossKind[] = ['kd', 'cross-entropy', 'l1', 'l2'];
  return kinds.map((kind) => ({ kind, ...computeDistillation({ teacherLogits, studentLogits, temperature, reduction, lossKind: kind, includeT2 }) }));
}

function responseLossTerms(kind: ResponseLossKind, target: Vector, prediction: Vector): Vector {
  if (kind === 'kd') return target.map((value, index) => value * Math.log(Math.max(value, EPSILON) / Math.max(prediction[index], EPSILON)));
  if (kind === 'cross-entropy') return perClassCrossEntropy(target, prediction);
  if (kind === 'l1') return target.map((value, index) => Math.abs(prediction[index] - value));
  return target.map((value, index) => 0.5 * (prediction[index] - value) ** 2);
}

function lossGradientWithRespectToProbabilities(kind: ResponseLossKind, target: Vector, prediction: Vector): Vector {
  if (kind === 'kd' || kind === 'cross-entropy') return prediction.map((value, index) => value - target[index]);
  if (kind === 'l1') return prediction.map((value, index) => Math.sign(value - target[index]));
  return prediction.map((value, index) => value - target[index]);
}

function assertDistributionInput(values: Vector, temperature: number) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new RangeError('Expected a non-empty finite vector.');
  if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError('Temperature must be positive and finite.');
}

function assertSameLength(left: Vector, right: Vector) {
  if (left.length !== right.length || !left.length) throw new RangeError('Vectors must have the same non-zero length.');
}
