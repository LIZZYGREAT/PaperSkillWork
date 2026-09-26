export type DatasetCardData = { name: string; task: string; modality?: string; classes?: string; paperRole: string; whyItMatters?: string };

export function DatasetCard({ dataset }: { dataset: DatasetCardData }) {
  return <article className="rk-dataset-card"><header><span>Dataset</span><h3>{dataset.name}</h3></header><dl><dt>Task</dt><dd>{dataset.task}</dd>{dataset.modality ? <><dt>Modality</dt><dd>{dataset.modality}</dd></> : null}{dataset.classes ? <><dt>Classes / labels</dt><dd>{dataset.classes}</dd></> : null}<dt>Role in this paper</dt><dd>{dataset.paperRole}</dd></dl>{dataset.whyItMatters ? <p>{dataset.whyItMatters}</p> : null}</article>;
}
