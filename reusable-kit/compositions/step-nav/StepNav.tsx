export type StepNavItem = {
  id: string;
  /** Full step name. It wraps; it is never shortened with an ellipsis. */
  label: string;
  hint?: string;
};

/**
 * Synchronised step navigation. The grid wraps to as many rows as the available
 * width needs, so every step name stays fully readable instead of being clipped.
 * The component owns no state: pass the current step and handle the selection.
 */
export function StepNav({ items, activeId, onSelect, label = "Steps", compact = false, className = "" }: {
  items: StepNavItem[];
  activeId: string;
  onSelect: (itemId: string) => void;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return <ol className={`rk-step-nav${compact ? " rk-step-nav--compact" : ""}${className ? ` ${className}` : ""}`} aria-label={label}>
    {items.map((item, index) => <li key={item.id}>
      <button
        type="button"
        className="rk-step-nav__button"
        aria-current={item.id === activeId ? "step" : undefined}
        data-step-id={item.id}
        onClick={() => onSelect(item.id)}
      >
        <span className="rk-step-nav__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span className="rk-step-nav__label">{item.label}{item.hint ? <small className="rk-step-nav__hint">{item.hint}</small> : null}</span>
      </button>
    </li>)}
  </ol>;
}
