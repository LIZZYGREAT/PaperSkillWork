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
import { TermHints } from './term-hints';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

function withChapterHints(Widget: React.FC<WidgetProps>): React.FC<WidgetProps> {
  return function PaperWidget(props: WidgetProps) {
    return (
      <>
        {props.moduleId.endsWith('.1') ? <TermHints chapterId={props.chapterId} /> : null}
        <Widget {...props} />
      </>
    );
  };
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = withChapterHints(ExampleSlider);
widgetRegistry['architecture-map'] = withChapterHints(ArchitectureMap);
widgetRegistry['design-ablation'] = withChapterHints(DesignAblation);
widgetRegistry['dictionary-analogy'] = withChapterHints(DictionaryAnalogy);
widgetRegistry['domain-drag'] = withChapterHints(DomainDrag);
widgetRegistry['lambda-lab'] = withChapterHints(LambdaLab);
widgetRegistry['loss-lab'] = withChapterHints(LossLab);
widgetRegistry['lwf-hero'] = withChapterHints(LwfHero);
widgetRegistry['method-map'] = withChapterHints(MethodMap);
widgetRegistry['problem-compare'] = withChapterHints(ProblemCompare);
widgetRegistry['result-race'] = withChapterHints(ResultRace);
widgetRegistry['signal-source'] = withChapterHints(SignalSource);
widgetRegistry['temperature-lab'] = withChapterHints(TemperatureLab);
widgetRegistry['training-steps'] = withChapterHints(TrainingSteps);
