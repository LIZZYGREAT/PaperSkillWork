export type SceneId = 'A' | 'B' | 'C';
export type MethodId = 'feature' | 'finetune' | 'joint';
export type BoundaryId = 'classifier' | 'fc7';
export type TrainingPhase = 'warmup' | 'joint';
export type TrainingStage = 'idle' | 'batch' | 'forward' | 'loss' | 'backward' | 'updated';
export type ParamGroupId = 'theta_s' | 'theta_o' | 'theta_n';
export type GradientSource = 'new' | 'old' | 'regularization' | 'total';

export interface LearningSession {
  activeScene: SceneId;
  newTaskArrived: boolean;
  selectedMethod: MethodId;
  exploredMethods: MethodId[];
  oldResponseRevealed: boolean;
  boundary: BoundaryId;
  studentCreated: boolean;
  responseCacheReady: boolean;
  cacheBySampleId: boolean;
  teacherStudentShared: boolean;
  phase: TrainingPhase;
  optimizerGroups: ParamGroupId[];
  trainingStage: TrainingStage;
  selectedGradientSource: GradientSource;
  selectedSampleId: number;
  selectedObject: string;
}

export type LearningAction =
  | { type: 'NAVIGATE'; scene: SceneId }
  | { type: 'NEW_TASK_ARRIVES' }
  | { type: 'SELECT_METHOD'; method: MethodId }
  | { type: 'REVEAL_OLD_RESPONSE' }
  | { type: 'SET_BOUNDARY'; boundary: BoundaryId }
  | { type: 'CREATE_STUDENT' }
  | { type: 'GENERATE_RESPONSE_CACHE' }
  | { type: 'TOGGLE_CACHE_IDENTITY' }
  | { type: 'TOGGLE_SHARED_TEACHER' }
  | { type: 'SET_PHASE'; phase: TrainingPhase }
  | { type: 'TOGGLE_OPTIMIZER_GROUP'; group: ParamGroupId }
  | { type: 'SET_TRAINING_STAGE'; stage: TrainingStage }
  | { type: 'SET_GRADIENT_SOURCE'; source: GradientSource }
  | { type: 'SET_SAMPLE'; id: number }
  | { type: 'INSPECT_OBJECT'; id: string };

export const methodOrder: MethodId[] = ['feature', 'finetune', 'joint'];

export const initialLearningSession: LearningSession = {
  activeScene: 'A',
  newTaskArrived: false,
  selectedMethod: 'feature',
  exploredMethods: [],
  oldResponseRevealed: false,
  boundary: 'classifier',
  studentCreated: false,
  responseCacheReady: false,
  cacheBySampleId: true,
  teacherStudentShared: false,
  phase: 'warmup',
  optimizerGroups: ['theta_n'],
  trainingStage: 'idle',
  selectedGradientSource: 'total',
  selectedSampleId: 427,
  selectedObject: 'theta_s',
};

export function learningReducer(state: LearningSession, action: LearningAction): LearningSession {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, activeScene: action.scene };
    case 'NEW_TASK_ARRIVES':
      return { ...state, newTaskArrived: true };
    case 'SELECT_METHOD':
      return {
        ...state,
        selectedMethod: action.method,
        exploredMethods: state.newTaskArrived && !state.exploredMethods.includes(action.method)
          ? [...state.exploredMethods, action.method]
          : state.exploredMethods,
      };
    case 'REVEAL_OLD_RESPONSE':
      return { ...state, oldResponseRevealed: true };
    case 'SET_BOUNDARY':
      return {
        ...state,
        boundary: action.boundary,
        studentCreated: false,
        responseCacheReady: false,
        trainingStage: 'idle',
      };
    case 'CREATE_STUDENT':
      return { ...state, studentCreated: true, responseCacheReady: false, trainingStage: 'idle' };
    case 'GENERATE_RESPONSE_CACHE':
      return { ...state, responseCacheReady: true };
    case 'TOGGLE_CACHE_IDENTITY':
      return { ...state, cacheBySampleId: !state.cacheBySampleId };
    case 'TOGGLE_SHARED_TEACHER':
      return { ...state, teacherStudentShared: !state.teacherStudentShared };
    case 'SET_PHASE':
      return {
        ...state,
        phase: action.phase,
        optimizerGroups: action.phase === 'warmup' ? ['theta_n'] : ['theta_s', 'theta_o', 'theta_n'],
        trainingStage: 'idle',
      };
    case 'TOGGLE_OPTIMIZER_GROUP':
      return {
        ...state,
        optimizerGroups: state.optimizerGroups.includes(action.group)
          ? state.optimizerGroups.filter((group) => group !== action.group)
          : [...state.optimizerGroups, action.group],
      };
    case 'SET_TRAINING_STAGE':
      return { ...state, trainingStage: action.stage };
    case 'SET_GRADIENT_SOURCE':
      return { ...state, selectedGradientSource: action.source };
    case 'SET_SAMPLE':
      return { ...state, selectedSampleId: action.id };
    case 'INSPECT_OBJECT':
      return { ...state, selectedObject: action.id };
    default:
      return state;
  }
}
