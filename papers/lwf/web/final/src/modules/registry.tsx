import React from "react";
import { ArchitectureMap } from "./architecture-map";
import { ProblemCompare } from "./problem-compare";
import { SignalSource } from "./signal-source";
import { TrainingSteps } from "./training-steps";
import { TermHints } from "./term-hints";
import { v3WidgetRegistry } from "./v3-widgets";

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

function withChapterHints(Widget: React.FC<WidgetProps>): React.FC<WidgetProps> {
  return function PaperWidget(props: WidgetProps) {
    return <>
      {props.moduleId.endsWith(".1") ? <TermHints chapterId={props.chapterId} /> : null}
      <Widget {...props} />
    </>;
  };
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {
  "architecture-map": withChapterHints(ArchitectureMap),
  "problem-compare": withChapterHints(ProblemCompare),
  "signal-source": withChapterHints(SignalSource),
  "training-steps": withChapterHints(TrainingSteps),
  ...v3WidgetRegistry,
};
