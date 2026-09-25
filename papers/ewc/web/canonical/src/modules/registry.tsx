import type React from 'react';
import {
  AtariSystem,
  ClaimBoundary,
  HandoffStage,
  ImportanceExplorer,
  MethodCompare,
  MnistEvidence,
  MnistProtocol,
  MnistResults,
  StateLifecycle,
  SynthesisReview,
  UpdateCalculator,
} from './ewc-widgets';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {
  'method-compare': MethodCompare,
  'handoff-stage': HandoffStage,
  'importance-explorer': ImportanceExplorer,
  'update-calculator': UpdateCalculator,
  'mnist-evidence': MnistEvidence,
  'state-lifecycle': StateLifecycle,
  'mnist-protocol': MnistProtocol,
  'mnist-results': MnistResults,
  'synthesis-review': SynthesisReview,
  'atari-system': AtariSystem,
  'claim-boundary': ClaimBoundary,
};
