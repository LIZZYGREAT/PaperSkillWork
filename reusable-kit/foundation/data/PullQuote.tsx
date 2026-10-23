import type { ReactNode } from "react";

/**
 * A stated conclusion, set larger than body text with a rule that ties it to the
 * section. Use it for the one sentence a reader should leave the section with —
 * not for decoration and not for a sentence the prose already says verbatim.
 */
export function PullQuote({ children, attribution, className = "" }: { children: ReactNode; attribution?: string; className?: string }) {
  return <figure className={`rk-pullquote${className ? ` ${className}` : ""}`}>
    <blockquote className="rk-pullquote__text">{children}</blockquote>
    {attribution ? <figcaption className="rk-pullquote__source">{attribution}</figcaption> : null}
  </figure>;
}
