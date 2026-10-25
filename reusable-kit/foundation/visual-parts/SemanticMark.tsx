import './visual-parts.css';

export function SemanticMark({ state, children }: { state: 'frozen' | 'trainable' | 'reference'; children: string }) {
  return <span className="rk-semantic-mark" data-state={state}>{children}</span>;
}
