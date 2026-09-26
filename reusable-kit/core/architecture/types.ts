export type ArchitectureNode = { id: string; label: string; group?: string; detail?: string; status?: "normal" | "frozen" | "trainable" | "inactive" };
export type ArchitectureEdge = { id?: string; from: string; to: string; label?: string; branch?: string };
export type ArchitectureSpec = { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };

export function validateArchitectureSpec(spec: ArchitectureSpec): string[] {
  const ids = new Set(spec.nodes.map((node) => node.id));
  const errors: string[] = [];
  if (!spec.nodes.length) errors.push("ArchitectureExplorer requires at least one node.");
  for (const edge of spec.edges) if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`Architecture edge '${edge.from} → ${edge.to}' references an unknown node.`);
  return errors;
}
