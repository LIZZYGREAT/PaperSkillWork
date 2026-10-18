type TutorialRoutePreviewProps = {
  input: string;
  reason: string;
  steps: readonly string[];
  output: string;
  boundary?: string;
};

export function TutorialRoutePreview({ input, reason, steps, output, boundary }: TutorialRoutePreviewProps) {
  return (
    <section className="tutorial-route" aria-label="本页路线">
      <header>
        <span className="eyebrow">BEFORE PLAYING · 本页路线</span>
        <p><b>已有：</b>{input}</p>
        <p><b>为什么：</b>{reason}</p>
      </header>
      <ol aria-label="处理顺序">
        {steps.map((step, index) => (
          <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b></li>
        ))}
      </ol>
      <footer>
        <p><b>最终产物：</b>{output}</p>
        {boundary ? <small>{boundary}</small> : null}
      </footer>
    </section>
  );
}
