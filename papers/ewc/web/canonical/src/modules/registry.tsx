import type React from 'react';
import {
  AtariSystem,
  ClaimBoundary,
  HandoffStage,
  ImportanceExplorer,
  MethodCompare,
  MnistEvidence,
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
  'atari-system': AtariSystem,
  'claim-boundary': ClaimBoundary,
};
