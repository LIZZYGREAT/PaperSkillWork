# MiniNetworkGlyph / Timeline revision · 2026-10-25

## G0 · source audit

- Baseline HEAD: `6500a8c8b95c07ff5c8e3fd570bd23eccf3cbd4e`; working tree clean before edits. Task scope is the two Kit candidates and their direct demo, recipe, scaffold and QA consumers. Original `papers/**` stay read-only.
- Located and inspected the current `reusable-kit/demo/src/AdvancedPrimitiveGallery.tsx`, `pattern-gallery.css`, `PatternGallery.tsx`; `foundation/neural-network/MiniNetworkGlyph.tsx` and paired CSS; `foundation/animation/useAnimationTimeline.ts` and `easing.ts`; both recipes, registry, browser tests and smoke fixtures. Current defects match the task: `roleLayers` serializes reference/current models; arbitrary sparse importance data has no teaching contract; two timeline hooks demonstrate independent clocks, not synchronized regions.
- Read-only references confirmed at `papers/ewc/web/enhanced/src/shared/teaching/EWCNetworkDiagram.tsx` (3–5–3 teaching mark), `papers/icarl/web/enhanced/src/components/SharedTrainingHead.tsx` (feature blocks → representation → class responses), `reusable-kit/demo/src/figures.tsx` (`lwfGraph` / `lwfGraphSteps`: common input branches, update belongs to Student), `papers/lwf/web/final/src/v3/LwfVerticalSlice.tsx` (shared stage/scroll composition), and `papers/icarl/web/enhanced/src/shared/animation/useAnimationTimeline.ts` (clock/hold, paper-specific globals excluded).
- G1 contract: one stable 3–5–3 topology; caller selects two edges without moving nodes. Separate Teacher and Student Glyph instances receive the same external input and produce separate outputs. Whole-model identities belong to the outer composition. Sizes are teaching examples, not measured architectures or Fisher values.
- G2 contract: exactly one hook in the main scene. `clipId`, `clipIndex`, `progress`, `status` derive navigation, stable five-object system diagram, explanation, formula/output and controls. Fixed sample `x₁`; feature blocks → z → logits → independent sigmoid responses. Never nearest-mean inference or Softmax. Generic read/transform/validate/write fixture remains test-only.
- Review plan: G1 build and focused browser semantics before G2; G2 controlled clock + browser state checks; G3 pytest, strict build, full browser suite, fresh isolated scaffold and Visual QA (1440×900, 1920×1080 plus 390px). Inspect latest screenshots, preserve only selected review evidence, clean exact owned runner directories. Registry stays P1 `candidate`; human acceptance stays PENDING.

## Stage results

G0: source paths, relationships and state contract verified. No implementation changes in this commit.
