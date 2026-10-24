# Typography and Formula Pairing

Use semantic type and mathematical markup to explain relationships. These recipes style emphasis and explanation; they do not validate a paper's equation or coefficients.

## Use When

- A short phrase carries the claim readers need to notice.
- One sentence states the section's takeaway more clearly than another paragraph.
- A displayed equation needs the definitions of its terms beside it.

## Do Not Use When

- Most of a paragraph is bold, so no phrase remains distinct.
- A pull quote repeats the paragraph word for word.
- A formula has not been checked against its cited source, or MathML would disguise uncertainty about a symbol.

## Inline Claim and Pull Quote

```tsx
import { PullQuote } from "./shared/foundation/data/PullQuote";

<p>
  The reference model remains fixed; <strong>the current model receives the update</strong>.
  Inline notation keeps its mathematical identity: <span className="rk-math"><var>θ</var><sub>t</sub></span>.
</p>

<PullQuote attribution="Teaching takeaway">
  State one conclusion the reader should carry into the next section.
</PullQuote>
```

Use one claim-bearing phrase per paragraph at most. Give the pull quote a new job: a concise conclusion, not decorative repetition.

## Formula with Selectable Terms

```tsx
import { FormulaBlock } from "./shared/optional/formula/FormulaBlock";

<FormulaBlock
  label="Objective"
  formula="L_total = L_task + λ L_preserve"
  accessibleLabel="Total loss equals task loss plus lambda times preservation loss"
  renderedFormula={<math xmlns="http://www.w3.org/1998/Math/MathML">
    <msub><mi>L</mi><mi>total</mi></msub><mo>=</mo>
    <msub><mi>L</mi><mi>task</mi></msub><mo>+</mo><mi>λ</mi>
    <msub><mi>L</mi><mi>preserve</mi></msub>
  </math>}
  terms={[
    { id: "task", label: "L_task", explanation: "Describe the term using the paper's definition." },
    { id: "weight", label: "λ", explanation: "State the coefficient and its source, if the paper specifies it." },
    { id: "preserve", label: "L_preserve", explanation: "Name the actual preservation objective; do not infer it from the visual label." },
  ]}
  description="Choose a symbol to read its role."
/>
```

MathML provides real subscript and operator layout. Keep a readable `formula` and accessible label alongside the rendered expression. Replace this illustrative equation with a source-verified one before presenting it as a paper fact.

## Dependencies and Maturity

- `PullQuote`: `foundation/data/PullQuote.tsx`; registered as P1 `candidate` in `registry.yaml`.
- `FormulaBlock`: `optional/formula/FormulaBlock.tsx`; registered as P1 `candidate`.
- Both are opt-in when scaffolding. Their candidate status is not a review approval.
- The data components need the Kit stylesheet `foundation/styles/kit.css`; MathML JSX projects also need the copied `foundation/math/mathml-jsx.d.ts` declaration.
