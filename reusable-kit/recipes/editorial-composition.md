# Editorial Composition Recipes

These are copyable layout patterns for narrative relationships. They are not registered React components and do not prescribe a tutorial-wide page template. Keep the paper's objects, order, and claims in its own data.

The Gallery examples are **structural fragments**, not standalone TSX modules. Copy the TSX and its CSS together, import the Kit stylesheet once from the app entry point, and provide the caller data: `steps` (`id`, `title`, `explanation`), `rows` (`id`, `title`, `relation`, `result`), `reference` / `learner` (`title` plus their summary or explanation), or `detail` (`title`, `explanation`, `formula`) for the selected layout. No `overviewFigure` variable is required; the overview example includes its small map markup inline.

## Alternating Narrative Axis

### Use When

Steps have a real order and each step needs room for a short explanation, formula, or state.

### Do Not Use When

The items are unordered examples or readers must compare details on the same row. Use aligned columns for direct comparison.

```tsx
<ol className="story-axis">
  {steps.map((step, index) => (
    <li className={index % 2 ? "story-axis__item is-right" : "story-axis__item"} key={step.id}>
      <span className="story-axis__marker" aria-hidden="true">{index + 1}</span>
      <article className="story-axis__content">
        <h3>{step.title}</h3><p>{step.explanation}</p>
      </article>
    </li>
  ))}
</ol>
```

```css
.story-axis { display: grid; gap: 18px; padding: 0; list-style: none; }
.story-axis__item { display: grid; grid-template-columns: minmax(0,1fr) 36px minmax(0,1fr); align-items: start; }
.story-axis__marker { z-index: 1; grid-column: 2; grid-row: 1; }
.story-axis__content { grid-column: 1; grid-row: 1; justify-self: end; max-width: 40ch; }
.story-axis__item.is-right .story-axis__content { grid-column: 3; justify-self: start; }
@media (max-width: 700px) {
  .story-axis__item { grid-template-columns: 28px minmax(0,1fr); }
  .story-axis__marker { grid-column: 1; }
  .story-axis__content, .story-axis__item.is-right .story-axis__content { grid-column: 2; justify-self: stretch; max-width: none; }
}
```

## Staggered Comparison Rows

### Use When

A small offset helps readers track the order or relative role of comparison rows without breaking their internal alignment.

### Do Not Use When

Fields must align exactly across rows or the offset would detach a label from its explanation.

```tsx
<div className="comparison-rows">
  {rows.map((row, index) => (
    <article className="comparison-row" data-depth={index % 2 ? "offset" : "base"} key={row.id}>
      <h3>{row.title}</h3><p>{row.relation}</p><strong>{row.result}</strong>
    </article>
  ))}
</div>
```

```css
.comparison-rows { display: grid; gap: 14px; }
.comparison-row { display: grid; grid-template-columns: minmax(7rem,.8fr) minmax(0,1fr) minmax(12rem,1.35fr); gap: 8px 16px; align-items: baseline; }
.comparison-row[data-depth="offset"] { margin-inline-start: clamp(24px, 8vw, 88px); }
@media (max-width: 700px) {
  .comparison-row { grid-template-columns: minmax(0,1fr); gap: 6px; }
  .comparison-row[data-depth="offset"] { margin-inline-start: 0; }
}
```

## Asymmetric Reference / Active Subject

### Use When

One side is a compact reference and the other side contains the main explanation or active model.

### Do Not Use When

Both sides have equal status or need row-by-row comparison; then give them equal columns and matched axes.

```tsx
<div className="reference-learner">
  <aside><p>REFERENCE</p><h3>{reference.title}</h3><p>{reference.summary}</p></aside>
  <section><p>ACTIVE MODEL</p><h3>{learner.title}</h3><div>{learner.explanation}</div></section>
</div>
```

```css
.reference-learner { display: grid; grid-template-columns: minmax(13rem,.8fr) minmax(0,1.6fr); gap: clamp(20px,4vw,52px); align-items: start; }
.reference-learner aside { color: var(--rk-muted); }
.reference-learner section { border-inline-start: 2px solid var(--rk-accent); padding-inline-start: 22px; }
@media (max-width: 760px) {
  .reference-learner { grid-template-columns: minmax(0,1fr); gap: 18px; }
  .reference-learner section { border-inline-start: 0; border-block-start: 2px solid var(--rk-accent); padding: 16px 0 0; }
}
```

## Wide Overview → Local Explanation → Calculation

### Use When

The reader first needs a system map, then a close view of one relationship, and then the calculation that explains it. Preserve object identity and direction across all three views.

### Do Not Use When

The overview is repeated without adding a new reading task or the focused view changes labels, direction, or state semantics.

```tsx
<section className="overview-detail">
  <figure className="overview-detail__map" aria-label="Shared input, reference, and current model relationships">
    <figcaption>OVERVIEW · shared input</figcaption>
    <div className="overview-detail__flow">
      <div className="overview-detail__node"><span>INPUT</span><strong>Sample x</strong></div>
      <i aria-hidden="true">→</i>
      <div className="overview-detail__routes">
        <article><span>REFERENCE · FROZEN</span><strong>Old model f_old</strong><small>Target response y_old</small></article>
        <article className="is-active"><span>LEARNING · ACTIVE</span><strong>Current model f_θ</strong><small>Prediction y_θ</small></article>
      </div>
      <i aria-hidden="true">→</i>
      <div className="overview-detail__node is-focus"><span>LOCAL FOCUS</span><strong>Response alignment</strong><small>Compare the responses</small></div>
    </div>
  </figure>
  <aside className="overview-detail__reading"><span>LOCAL DETAIL</span><h3>{detail.title}</h3><p>{detail.explanation}</p><div className="overview-detail__formula">{detail.formula}</div></aside>
</section>
```

```css
.overview-detail { display: grid; grid-template-columns: minmax(0,1.7fr) minmax(16rem,.8fr); gap: clamp(20px,4vw,48px); align-items: start; }
.overview-detail__map { min-width: 0; margin: 0; padding: 18px; background: var(--rk-figure); }
.overview-detail__flow { display: grid; grid-template-columns: minmax(5.5rem,.65fr) 14px minmax(10rem,1.3fr) 14px minmax(7rem,.8fr); gap: 10px; align-items: center; }
.overview-detail__routes { display: grid; gap: 8px; }
.overview-detail__node, .overview-detail__routes article { display: grid; gap: 5px; padding: 12px; border: 1px solid var(--rk-line-strong); background: var(--rk-surface); }
.overview-detail__routes .is-active, .overview-detail__node.is-focus { border-color: var(--rk-accent); }
.overview-detail__reading { max-width: 42ch; }
@media (max-width: 760px) {
  .overview-detail { grid-template-columns: minmax(0,1fr); }
  .overview-detail__reading { max-width: none; }
}
```

## Shared Constraints

- Keep the reading order in the document order; CSS changes position, not meaning.
- At narrow widths, stack or reflow instead of shrinking text or clipping content.
- Use whitespace, alignment, rules, and relative area to show hierarchy; do not wrap every region in the same card.
- If a composition includes motion, keep the same information available when `prefers-reduced-motion: reduce` is active.

## Sources in This Kit

- Alternating sequence: `demo/src/EditorialStudies.tsx` and `demo/src/editorial-studies.css`.
- Staggered comparison: `demo/src/JourneyArtDirection.tsx` and `demo/src/journey-art-direction.css`.
- Asymmetric reference / active subject: `demo/src/EditorialCCandidates.tsx` and `demo/src/editorial-c-candidates.css`.
- Overview and local transitions: `demo/src/EditorialJourney.tsx` and `demo/src/editorial-journey.css`.
