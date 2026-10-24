# Sticky Figure with Scroll-Synchronized Reading

Use the existing `StickySystemView` when several text sections explain changes in one persistent figure. The Kit API uses a fixed 40% reading line and briefly prioritizes a manually selected step; it does not accept the `readingLineRatio` option present in the LwF paper copy.

## Use When

- The same system or object persists across several explanatory sections.
- Each section maps to a meaningful figure focus.
- Readers benefit from seeing the current diagram while reading the explanation.

## Do Not Use When

- There are only one or two short sections.
- The figure does not change with the reading.
- On a narrow screen, the pinned figure would obstruct the text. Stack the figure before the steps instead.

## Copyable Example

```tsx
import { useState } from "react";
import { StickySystemView, useStickyStepSync } from "./shared/foundation/layout/StickySystemView";
import { FigureFrame } from "./shared/compositions/figure-frame/FigureFrame";
import { StepNav } from "./shared/compositions/step-nav/StepNav";

type Step = { id: string; sectionId: string; title: string; body: string };

function SyncedFigure({ steps, activeId, onChoose }: {
  steps: Step[]; activeId: string; onChoose: (id: string) => void;
}) {
  const sync = useStickyStepSync();
  const active = steps.find(step => step.id === activeId) ?? steps[0];
  return <FigureFrame label="Current system state" title={active.title}
    footer={<StepNav items={steps.map(step => ({ id: step.id, label: step.title }))}
      activeId={activeId} label="Choose a figure step"
      onSelect={id => { onChoose(id); sync?.setManualStep(id); }} />}>
    {renderFigure(active.id)}
  </FigureFrame>;
}

export function ScrollStory({ steps }: { steps: Step[] }) {
  const [activeId, setActiveId] = useState(steps[0].id);
  const sections = steps.map(step => ({ id: step.sectionId, stepId: step.id }));
  return <StickySystemView sections={sections}
    onActiveSectionChange={section => { if (section.stepId) setActiveId(section.stepId); }}
    visual={<SyncedFigure steps={steps} activeId={activeId} onChoose={setActiveId} />}>
    {steps.map(step => <section id={step.sectionId} key={step.id}>
      <h2>{step.title}</h2><p>{step.body}</p>
    </section>)}
  </StickySystemView>;
}
```

`renderFigure` above is the paper's own figure implementation. Its visual state should be derived from the same step ID used by the text, not from a second timer.

## Minimum Step Contract

Each step needs a stable `id`, the corresponding DOM `sectionId`, a title, explanatory text, and enough paper-owned state to render the appropriate visual focus. The component API is `sections`, `visual`, and `children`; `useStickyStepSync` only supplies manual selection to controls rendered inside the view.

## Responsive and Accessibility Notes

- Keep steps in the same DOM order as the reading sequence.
- Use `StepNav` or native buttons so manual selection works from the keyboard.
- On narrow screens, let the view stack and make the visual non-sticky. Do not turn the figure into a horizontally scaled miniature.
- The component does not animate state transitions. If a paper adds motion, provide a stable reduced-motion state with the same information.
- Test scroll selection and manual selection separately. Manual selection has a short override window, after which the reading line becomes authoritative again.

## Existing Reference

`papers/lwf/web/final/src/v3/LwfVerticalSlice.tsx` with `styles/scrollytelling.css` demonstrates the paper-specific layout and data. It carries a `readingLineRatio` extension in its copied `StickySystemView`; do not copy that option into a new Kit consumer as though it were part of the current Kit API. The `demo/?demo=gallery` sample uses the unextended Kit API with two unrelated data sets.
