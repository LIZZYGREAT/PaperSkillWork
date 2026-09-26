import { useMemo, useState } from "react";
import { SegmentedControl } from "../../foundation/controls/SegmentedControl";

export type BenchmarkRecord = { id: string; benchmark: string; protocol: string; metric: string; condition: string; result: string; interpretation: string; limitation: string };

export function BenchmarkExplorer({ records }: { records: BenchmarkRecord[] }) {
  const benchmarks = Array.from(new Set(records.map((record) => record.benchmark)));
  const [benchmark, setBenchmark] = useState(benchmarks[0] ?? "");
  const visible = useMemo(() => records.filter((record) => record.benchmark === benchmark), [records, benchmark]);
  return <section className="rk-benchmark" aria-label="Benchmark results"><header><span>Protocol first, numbers second</span><h3>Benchmark evidence</h3></header>{benchmarks.length > 1 ? <SegmentedControl label="Benchmark" value={benchmark} options={benchmarks.map((value) => ({ value, label: value }))} onChange={setBenchmark} /> : null}<div className="rk-benchmark__records">{visible.map((record) => <article key={record.id}><h4>{record.benchmark}</h4><dl><dt>Protocol</dt><dd>{record.protocol}</dd><dt>Metric</dt><dd>{record.metric}</dd><dt>Condition</dt><dd>{record.condition}</dd><dt>Result</dt><dd className="rk-benchmark__result">{record.result}</dd></dl><p><b>Interpretation:</b> {record.interpretation}</p><p><b>Limitation:</b> {record.limitation}</p></article>)}</div>{!records.length ? <p>No benchmark records are available.</p> : null}</section>;
}
