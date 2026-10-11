import type { ReactNode } from "react";

export type ReferenceKind = "term" | "symbol" | "formula" | "dataset" | "method" | "evidence" | "implementation" | "advanced";

export type TermDefinition = {
  id: string;
  label: string;
  fullName?: string;
  definition: string;
  paperRole?: string;
  confusion?: string;
  sourceKind?: string;
};

export type TermRefLabels = {
  definition: string;
  paperRole: string;
  easyToConfuse: string;
  sourceKind: string;
  openReference: string;
};

export type ReferenceHubLabels = {
  description: string;
  search: string;
  searchPlaceholder: string;
  category: string;
  allCategories: string;
  itemCount: string;
  noMatches: string;
  selectPrompt: string;
  jumpToSection: string;
  categoryNames?: Partial<Record<ReferenceKind, string>>;
};

export type ReferenceItem = {
  id: string;
  title: string;
  kind: ReferenceKind;
  summary: string;
  content?: ReactNode;
  relatedSection?: string;
  tags?: string[];
};
