import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { ArchitectureMap } from './architecture-map';
import { DesignAblation } from './design-ablation';
import { DictionaryAnalogy } from './dictionary-analogy';
import { DomainDrag } from './domain-drag';
import { LambdaLab } from './lambda-lab';
import { LossLab } from './loss-lab';
import { LwfHero } from './lwf-hero';
import { MethodMap } from './method-map';
import { ProblemCompare } from './problem-compare';
import { ResultRace } from './result-race';
import { SignalSource } from './signal-source';
import { TemperatureLab } from './temperature-lab';
import { TrainingSteps } from './training-steps';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['architecture-map'] = ArchitectureMap;
widgetRegistry['design-ablation'] = DesignAblation;
widgetRegistry['dictionary-analogy'] = DictionaryAnalogy;
widgetRegistry['domain-drag'] = DomainDrag;
widgetRegistry['lambda-lab'] = LambdaLab;
widgetRegistry['loss-lab'] = LossLab;
widgetRegistry['lwf-hero'] = LwfHero;
widgetRegistry['method-map'] = MethodMap;
widgetRegistry['problem-compare'] = ProblemCompare;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['signal-source'] = SignalSource;
widgetRegistry['temperature-lab'] = TemperatureLab;
widgetRegistry['training-steps'] = TrainingSteps;
