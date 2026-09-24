import type { GradientSource, ParamGroupId, TrainingPhase } from '../data/session';

export type Affine = { w: number[][]; b: number[] };
export type ToyParameters = Record<ParamGroupId, Affine>;
export type Sample = { id: number; x: number[]; y: number };
export type Vector = number[];

export interface ToyGroupGradient {
  old: Affine;
  new: Affine;
  regularization: Affine;
  total: Affine;
}

export interface TeachingToyState {
  student: ToyParameters;
  stepCount: number;
  lastUpdate: null | {
    before: Record<ParamGroupId, number>;
    after: Record<ParamGroupId, number>;
    updateNorms: Record<ParamGroupId, number>;
    gradients: Record<ParamGroupId, number>;
    updated: Record<ParamGroupId, boolean>;
    beforeParameters: ToyParameters;
    afterParameters: ToyParameters;
  };
  lastGradients: Partial<Record<ParamGroupId, Affine>> | null;
}

export const toySamples: Sample[] = [
  { id: 427, x: [0.8, 0.2], y: 1 },
  { id: 428, x: [-0.4, 0.9], y: 0 },
  { id: 901, x: [0.3, -0.7], y: 1 },
];

export const TOY_CLASSES_OLD = 3;
export const TOY_CLASSES_NEW = 2;
export const TOY_TEMPERATURE = 2;
export const TOY_LAMBDA_OLD = 1;
export const TOY_WEIGHT_DECAY = 0.0005;
export const TOY_LEARNING_RATE = 0.1;

const teacher: Pick<ToyParameters, 'theta_s' | 'theta_o'> = {
  theta_s: { w: [[0.65, -0.25], [0.15, 0.55]], b: [0.05, -0.1] },
  theta_o: { w: [[0.55, -0.4], [-0.3, 0.65], [0.2, 0.25]], b: [0.1, -0.05, 0.0] },
};

export const initialToyState: TeachingToyState = {
  student: {
    theta_s: cloneAffine(teacher.theta_s),
    theta_o: cloneAffine(teacher.theta_o),
    theta_n: { w: [[0.3, -0.55], [0.5, 0.15]], b: [0.02, -0.03] },
  },
  stepCount: 0,
  lastUpdate: null,
  lastGradients: null,
};

export type ToyAction =
  | { type: 'OPTIMIZER_STEP'; phase: TrainingPhase; optimizerGroups: ParamGroupId[] }
  | { type: 'BACKWARD'; phase: TrainingPhase }
  | { type: 'ZERO_GRAD' }
  | { type: 'RESET_TOY' };

export function teachingToyReducer(state: TeachingToyState, action: ToyAction): TeachingToyState {
  if (action.type === 'ZERO_GRAD') return { ...state, lastGradients: null };
  if (action.type === 'RESET_TOY') return { ...initialToyState, student: cloneParameters(initialToyState.student), lastGradients: null };
  if (action.type === 'BACKWARD') {
    const result = computeToyGradients(state.student, action.phase);
    const trainable: ParamGroupId[] = action.phase === 'warmup' ? ['theta_n'] : ['theta_s', 'theta_o', 'theta_n'];
    const lastGradients: Partial<Record<ParamGroupId, Affine>> = {};
    for (const group of trainable) lastGradients[group] = result.gradients.total[group];
    return { ...state, lastGradients };
  }
  const before = parameterNorms(state.student);
  if (!state.lastGradients) return state;
  const afterStudent = cloneParameters(state.student);
  const groupGradientNorms = {} as Record<ParamGroupId, number>;
  const updated = {} as Record<ParamGroupId, boolean>;

  for (const group of ['theta_s', 'theta_o', 'theta_n'] as ParamGroupId[]) {
    const groupGradient = state.lastGradients[group];
    const hasGradient = Boolean(groupGradient);
    const inOptimizer = action.optimizerGroups.includes(group);
    const gradient = groupGradient || zeroLike(state.student[group]);
    groupGradientNorms[group] = hasGradient ? affineNorm(gradient) : 0;
    updated[group] = hasGradient && inOptimizer;
    if (!updated[group]) continue;
    for (let row = 0; row < afterStudent[group].w.length; row += 1) {
      for (let col = 0; col < afterStudent[group].w[row].length; col += 1) {
        afterStudent[group].w[row][col] -= TOY_LEARNING_RATE * gradient.w[row][col];
      }
      afterStudent[group].b[row] -= TOY_LEARNING_RATE * gradient.b[row];
    }
  }

  const after = parameterNorms(afterStudent);
  const updateNorms = {} as Record<ParamGroupId, number>;
  for (const group of ['theta_s', 'theta_o', 'theta_n'] as ParamGroupId[]) {
    updateNorms[group] = affineNorm({
      w: afterStudent[group].w.map((row, rowIndex) => row.map((value, colIndex) => value - state.student[group].w[rowIndex][colIndex])),
      b: afterStudent[group].b.map((value, index) => value - state.student[group].b[index]),
    });
  }

  return {
    student: afterStudent,
    stepCount: state.stepCount + 1,
    lastUpdate: { before, after, updateNorms, gradients: groupGradientNorms, updated, beforeParameters: cloneParameters(state.student), afterParameters: cloneParameters(afterStudent) },
    lastGradients: state.lastGradients,
  };
}

export function computeToyGradients(student: ToyParameters, phase: TrainingPhase) {
  const batch = toySamples;
  const oldLossGradient = emptyGradients(student);
  const newLossGradient = emptyGradients(student);
  let oldLoss = 0;
  let newLoss = 0;
  const oldPredictions: number[][] = [];
  const newPredictions: number[][] = [];
  const oldTargets: number[][] = [];
  const teacherRawResponses: number[][] = [];
  const contributionWeight = 1 / batch.length;

  for (const sample of batch) {
    const x = sample.x;
    const shared = affineForward(student.theta_s, x);
    const oldLogits = affineForward(student.theta_o, shared);
    const newLogits = affineForward(student.theta_n, shared);
    const teacherFeature = affineForward(teacher.theta_s, x);
    const teacherLogits = affineForward(teacher.theta_o, teacherFeature);
    const rawResponse = softmax(teacherLogits);
    const oldTarget = softmax(teacherLogits.map((value) => value / TOY_TEMPERATURE));
    const studentOld = softmax(oldLogits.map((value) => value / TOY_TEMPERATURE));
    const studentNew = softmax(newLogits);
    teacherRawResponses.push(rawResponse);
    oldTargets.push(oldTarget);
    oldPredictions.push(studentOld);
    newPredictions.push(studentNew);
    oldLoss += crossEntropy(oldTarget, studentOld) * contributionWeight;
    newLoss += -Math.log(Math.max(studentNew[sample.y], Number.EPSILON)) * contributionWeight;

    const oldDz = studentOld.map((p, index) => (p - oldTarget[index]) / TOY_TEMPERATURE * contributionWeight * TOY_LAMBDA_OLD);
    const newDz = studentNew.map((p, index) => (p - Number(index === sample.y)) * contributionWeight);
    accumulateOutputPath(student, oldLossGradient, 'theta_o', oldDz, shared, x);
    accumulateOutputPath(student, newLossGradient, 'theta_n', newDz, shared, x);
  }

  const regularizationGradient = emptyGradients(student);
  const regularizationLoss = addToyWeightDecay(student, regularizationGradient);
  const allGroups: ParamGroupId[] = ['theta_s', 'theta_o', 'theta_n'];
  const activeGroups = phase === 'warmup' ? ['theta_n'] as ParamGroupId[] : allGroups;
  const total = emptyGradients(student);
  for (const group of allGroups) {
    if (!activeGroups.includes(group)) continue;
    addAffine(total[group], oldLossGradient[group]);
    addAffine(total[group], newLossGradient[group]);
    addAffine(total[group], regularizationGradient[group]);
  }

  return {
    oldLoss,
    newLoss,
    regularizationLoss,
    totalLoss: TOY_LAMBDA_OLD * oldLoss + newLoss + regularizationLoss,
    oldPredictions,
    newPredictions,
    oldTargets,
    teacherRawResponses,
    gradients: { old: oldLossGradient, new: newLossGradient, regularization: regularizationGradient, total } as Record<GradientSource, Record<ParamGroupId, Affine>>,
  };
}

export function selectGradientSource(result: ReturnType<typeof computeToyGradients>, source: GradientSource, group: ParamGroupId): Affine {
  return result.gradients[source][group];
}

export function parameterNorms(parameters: ToyParameters): Record<ParamGroupId, number> {
  return {
    theta_s: affineNorm(parameters.theta_s),
    theta_o: affineNorm(parameters.theta_o),
    theta_n: affineNorm(parameters.theta_n),
  };
}

export function getTeacherResponse(sample: Sample) {
  const h = affineForward(teacher.theta_s, sample.x);
  const logits = affineForward(teacher.theta_o, h);
  return { logits, probabilities: softmax(logits) };
}

export function getToyForward(parameters: ToyParameters, sample: Sample) {
  const h = affineForward(parameters.theta_s, sample.x);
  const oldLogits = affineForward(parameters.theta_o, h);
  const newLogits = affineForward(parameters.theta_n, h);
  return { h, oldLogits, newLogits, oldProbabilities: softmax(oldLogits), newProbabilities: softmax(newLogits) };
}

export function stageRank(stage: string) {
  return ({ idle: 0, batch: 1, forward: 2, loss: 3, backward: 4, updated: 5 } as Record<string, number>)[stage] ?? 0;
}

function emptyGradients(parameters: ToyParameters): Record<ParamGroupId, Affine> {
  return { theta_s: zeroLike(parameters.theta_s), theta_o: zeroLike(parameters.theta_o), theta_n: zeroLike(parameters.theta_n) };
}

function accumulateOutputPath(parameters: ToyParameters, target: Record<ParamGroupId, Affine>, group: 'theta_o' | 'theta_n', dz: Vector, shared: Vector, x: Vector) {
  const head = parameters[group];
  addOuter(target[group].w, dz, shared);
  addVector(target[group].b, dz);
  const dh = head.w[0].map((_, column) => head.w.reduce((sum, row, index) => sum + row[column] * dz[index], 0));
  addOuter(target.theta_s.w, dh, x);
  addVector(target.theta_s.b, dh);
}

function addToyWeightDecay(parameters: ToyParameters, target: Record<ParamGroupId, Affine>) {
  let loss = 0;
  for (const group of ['theta_s', 'theta_o', 'theta_n'] as ParamGroupId[]) {
    for (let row = 0; row < parameters[group].w.length; row += 1) {
      for (let col = 0; col < parameters[group].w[row].length; col += 1) {
        const value = parameters[group].w[row][col];
        loss += 0.5 * TOY_WEIGHT_DECAY * value * value;
        target[group].w[row][col] = TOY_WEIGHT_DECAY * value;
      }
    }
  }
  return loss;
}

function affineForward(layer: Affine, input: Vector): Vector {
  return layer.w.map((row, index) => row.reduce((sum, weight, col) => sum + weight * input[col], layer.b[index]));
}

function softmax(values: Vector): Vector {
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

function crossEntropy(target: Vector, prediction: Vector) {
  return -target.reduce((sum, value, index) => sum + value * Math.log(Math.max(prediction[index], Number.EPSILON)), 0);
}

function addOuter(target: number[][], left: Vector, right: Vector) {
  left.forEach((value, row) => right.forEach((entry, col) => { target[row][col] += value * entry; }));
}

function addVector(target: Vector, source: Vector) {
  source.forEach((value, index) => { target[index] += value; });
}

function addAffine(target: Affine, source: Affine) {
  source.w.forEach((row, rowIndex) => row.forEach((value, colIndex) => { target.w[rowIndex][colIndex] += value; }));
  addVector(target.b, source.b);
}

function zeroLike(value: Affine): Affine {
  return { w: value.w.map((row) => row.map(() => 0)), b: value.b.map(() => 0) };
}

function cloneAffine(value: Affine): Affine {
  return { w: value.w.map((row) => [...row]), b: [...value.b] };
}

function cloneParameters(parameters: ToyParameters): ToyParameters {
  return { theta_s: cloneAffine(parameters.theta_s), theta_o: cloneAffine(parameters.theta_o), theta_n: cloneAffine(parameters.theta_n) };
}

function affineNorm(value: Affine): number {
  return Math.sqrt([...value.w.flat(), ...value.b].reduce((sum, entry) => sum + entry * entry, 0));
}
