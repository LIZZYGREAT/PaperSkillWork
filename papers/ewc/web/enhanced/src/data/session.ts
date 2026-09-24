export const TOY_STATE = {
  anchor: [0.2, -0.1, 0.4],
  theta: [0.5, 0.2, 0.1],
  fisher: [1, 4, 9],
  newTaskGradient: [-0.3, 0.2, -0.1],
  learningRate: 0.1,
} as const;

export type Session = {
  lambda: number;
  delta: number;
  parameterIndex: number;
};

export const INITIAL_SESSION: Session = {
  lambda: 2,
  delta: 0.4,
  parameterIndex: 0,
};

export function calculateParameterPenalty(session: Session) {
  const importance = TOY_STATE.fisher[session.parameterIndex];
  const penalty = (session.lambda / 2) * importance * session.delta ** 2;
  const restoringGradient = session.lambda * importance * session.delta;
  return { importance, penalty, restoringGradient };
}

export function calculateTrainingStep(lambda: number) {
  const { anchor, theta, fisher, newTaskGradient, learningRate } = TOY_STATE;
  const difference = theta.map((value, index) => value - anchor[index]);
  const penalty = (lambda / 2) * difference.reduce((sum, value, index) => sum + fisher[index] * value * value, 0);
  const ewcGradient = difference.map((value, index) => lambda * fisher[index] * value);
  const totalGradient = ewcGradient.map((value, index) => value + newTaskGradient[index]);
  const nextTheta = theta.map((value, index) => value - learningRate * totalGradient[index]);
  return { difference, penalty, ewcGradient, totalGradient, nextTheta };
}

export function formatVector(values: number[]) {
  return `[${values.map((value) => (Object.is(value, -0) ? 0 : value).toFixed(2)).join(', ')}]`;
}
