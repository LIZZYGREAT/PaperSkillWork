import type { ReactNode } from "react";

/**
 * A chapter or section opening: a numbered eyebrow on a hairline, the heading, and
 * one lead paragraph. Using one header component for every section is what keeps a
 * long tutorial from becoming a stack of unrelated cards.
 */
export function SectionHeader({ index, eyebrow, title, lead, aside, headingLevel = 3, headingId }: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  headingLevel?: 2 | 3;
  headingId?: string;
}) {
  const Heading = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";
  return <header className="rk-section-head">
    <p className="rk-section-head__meta">
      {index ? <span className="rk-section-head__index">{index}</span> : null}
      <span className="rk-section-head__eyebrow">{eyebrow}</span>
      <i className="rk-section-head__rule" aria-hidden="true" />
    </p>
    <Heading className="rk-section-head__title" id={headingId}>{title}</Heading>
    {lead ? <p className="rk-section-head__lead">{lead}</p> : null}
    {aside}
  </header>;
}
