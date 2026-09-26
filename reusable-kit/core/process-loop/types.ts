export type ProcessNode = {
  id: string;
  label: string;
  kind?: "input" | "module" | "parameter" | "output" | "loss" | "memory" | "state";
  group?: string;
  description?: string;
};

export type ProcessEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind?: "data" | "gradient" | "control" | "memory";
};

export type ProcessStep = {
  id: string;
  title: string;
  summary: string;
  activeNodes?: string[];
  activeEdges?: string[];
  dimNodes?: string[];
  annotations?: { target: string; text: string }[];
  detail?: { title: string; bullets: string[] };
};

export type ProcessLoopSpec = { nodes: ProcessNode[]; edges: ProcessEdge[]; steps: ProcessStep[] };

export function validateProcessLoopSpec(spec: ProcessLoopSpec): string[] {
  const nodeIds = new Set(spec.nodes.map((node) => node.id));
  const stepIds = new Set<string>();
  const problems: string[] = [];
  if (!spec.nodes.length) problems.push("ProcessLoopExplorer requires at least one node.");
  if (!spec.steps.length) problems.push("ProcessLoopExplorer requires at least one step.");
  for (const edge of spec.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) problems.push(`Edge '${edge.id}' references an unknown node ('${edge.from}' → '${edge.to}').`);
  }
  for (const step of spec.steps) {
    if (stepIds.has(step.id)) problems.push(`Duplicate process step id '${step.id}'.`);
    stepIds.add(step.id);
    for (const id of [...(step.activeNodes ?? []), ...(step.dimNodes ?? []), ...(step.annotations ?? []).map((item) => item.target)]) {
      if (!nodeIds.has(id)) problems.push(`Step '${step.id}' references unknown node '${id}'.`);
    }
    for (const id of step.activeEdges ?? []) {
      if (!spec.edges.some((edge) => edge.id === id)) problems.push(`Step '${step.id}' references unknown edge '${id}'.`);
    }
  }
  return problems;
}
