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

This is a complete, runnable TSX component with two local steps and a small visual that changes with the active step. It needs the Kit stylesheet imported once by the app entry point.

```tsx
import { useState } from "react";
import { StickySystemView, useStickyStepSync } from "./shared/foundation/layout/StickySystemView";
import { FigureFrame } from "./shared/compositions/figure-frame/FigureFrame";
import { StepNav } from "./shared/compositions/step-nav/StepNav";

type Step = { id: string; sectionId: string; title: string; body: string; reference: string; learner: string };

const steps: Step[] = [
  { id: "arrive", sectionId: "story-arrive", title: "共享输入", body: "同一份样本进入两个职责不同的对象。", reference: "冻结参考模型", learner: "当前可训练模型" },
  { id: "compare", sectionId: "story-compare", title: "目标比较", body: "参照目标与当前预测用于响应比较；真实标签进入任务比较。", reference: "响应目标 + 当前预测", learner: "当前预测 + 真实标签 y" },
];

function SyncedFigure({ activeId, onChoose }: { activeId: string; onChoose: (id: string) => void }) {
  const sync = useStickyStepSync();
  const active = steps.find(step => step.id === activeId) ?? steps[0];
  return <FigureFrame label="Current system state" title={active.title}
    footer={<StepNav items={steps.map(step => ({ id: step.id, label: step.title }))}
      activeId={activeId} label="Choose a figure step"
      onSelect={id => { onChoose(id); sync?.setManualStep(id); }} />}>
    <div role="img" aria-label={`${active.reference} leads to ${active.learner}`}>
      <p><strong>REFERENCE</strong> · {active.reference}</p>
      <p aria-hidden="true">↓</p>
      <p><strong>LEARNING</strong> · {active.learner}</p>
    </div>
  </FigureFrame>;
}

export function ScrollStoryExample() {
  const [activeId, setActiveId] = useState(steps[0].id);
  const sections = steps.map(step => ({ id: step.sectionId, stepId: step.id }));
  return <StickySystemView sections={sections}
    onActiveSectionChange={section => { if (section.stepId) setActiveId(section.stepId); }}
    visual={<SyncedFigure activeId={activeId} onChoose={setActiveId} />}>
    {steps.map(step => <section id={step.sectionId} key={step.id}>
      <h2>{step.title}</h2><p>{step.body}</p>
    </section>)}
  </StickySystemView>;
}
```

The `FigureFrame` content here is deliberately small so the synchronization contract is easy to copy. Replace the two object descriptions with the paper's actual visual and derive its state from the same `activeId` as the reading, not from a second timer.

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
