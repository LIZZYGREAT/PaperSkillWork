export type CompatibilityResult = "pass" | "fail" | "needs-adapter";
export type CompatibilityCheck = { id: string; requirement: string; capability: string; result: CompatibilityResult; explanation?: string; adapter?: string };

export function CompatibilityChecker({ title = "Compatibility check", checks }: { title?: string; checks: CompatibilityCheck[] }) {
  const summary = checks.reduce((result, check) => ({ ...result, [check.result]: result[check.result] + 1 }), { pass: 0, fail: 0, "needs-adapter": 0 });
  const overall: CompatibilityResult = !checks.length || summary["needs-adapter"] ? "needs-adapter" : summary.fail ? "fail" : "pass";
  const labels: Record<CompatibilityResult, string> = { pass: "PASS", fail: "FAIL", "needs-adapter": "NEEDS ADAPTER" };
  return <section className="rk-compatibility" aria-label={title}><header><h3>{title}</h3><strong className={`rk-compatibility__result rk-compatibility__result--${overall}`}>{labels[overall]}</strong></header><div className="rk-compatibility__summary" aria-label="Check summary"><span>{summary.pass} pass</span><span>{summary.fail} fail</span><span>{summary["needs-adapter"]} need adapter</span></div>{checks.length ? <ul>{checks.map((check) => <li key={check.id} className={`rk-compatibility__check rk-compatibility__check--${check.result}`}><div><span className={`rk-compatibility__result rk-compatibility__result--${check.result}`}>{labels[check.result]}</span><b>{check.requirement}</b></div><p><b>Capability:</b> {check.capability}</p>{check.explanation ? <p>{check.explanation}</p> : null}{check.adapter ? <p><b>Adapter:</b> {check.adapter}</p> : null}</li>)}</ul> : <p>No compatibility requirements have been provided yet.</p>}</section>;
}
