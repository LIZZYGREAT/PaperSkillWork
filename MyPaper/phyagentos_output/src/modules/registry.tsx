import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { HeroCompare } from './hero-compare';
import { HikeAnalogy } from './hike-analogy';
import { PhyModule } from './phy-module';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['hero-compare'] = HeroCompare;
widgetRegistry['hike-analogy'] = HikeAnalogy;
widgetRegistry['phy-module'] = PhyModule;
