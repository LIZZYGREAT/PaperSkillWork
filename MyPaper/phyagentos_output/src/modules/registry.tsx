import React from 'react';
import { AnalogyScene } from './AnalogyScene';
import { ReturnCodeLab } from './ReturnCodeLab';
import { ProtocolViews } from './ProtocolViews';
import { SessionLifecycle } from './SessionLifecycle';
import { PreflightLab } from './PreflightLab';
import { SafetyBoundary } from './SafetyBoundary';
import { VerdictCompare } from './VerdictCompare';
import { DualFlow } from './DualFlow';
import { EvolveLoop } from './EvolveLoop';
import { ArchMap } from './ArchMap';
import { TierLadder } from './TierLadder';
import { FiveLayers } from './FiveLayers';
import { BenchmarkLab } from './BenchmarkLab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['hike-analogy'] = AnalogyScene;
widgetRegistry['return-code-lab'] = ReturnCodeLab;
widgetRegistry['protocol-views'] = ProtocolViews;
widgetRegistry['session-lifecycle'] = SessionLifecycle;
widgetRegistry['preflight-lab'] = PreflightLab;
widgetRegistry['safety-boundary'] = SafetyBoundary;
widgetRegistry['verdict-compare'] = VerdictCompare;
widgetRegistry['dual-flow'] = DualFlow;
widgetRegistry['evolve-loop'] = EvolveLoop;
widgetRegistry['arch-map'] = ArchMap;
widgetRegistry['tier-ladder'] = TierLadder;
widgetRegistry['five-layers'] = FiveLayers;
widgetRegistry['benchmark-lab'] = BenchmarkLab;
