import React from 'react';

type ParsedNotation = { base: string; subscript?: string; superscript?: string };

function parseSuffix(suffix: string): ParsedNotation['subscript'] | ParsedNotation['superscript'] {
  if (!suffix) return undefined;
  const value = suffix.slice(1);
  if (value.startsWith('{') && value.endsWith('}')) return value.slice(1, -1);
  if (value.startsWith('(') && value.endsWith(')')) return value;
  return value;
}

/** Renders inline scientific notation such as theta_o^T and Y_o^GT with real sub/superscripts. */
export function InlineNotation({ text }: { text: string }) {
  const tokenPattern = /(?<![A-Za-z0-9])([A-Za-zθλπρΔΣΩ∂∇ℓ][\u0300-\u036f\u2032]?)(?:(?:_(?:\{[^}]+\}|[A-Za-z0-9]+))?(?:\^(?:\{[^}]+\}|\([^)]*\)|[A-Za-z0-9]+))?)/g;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenPattern.exec(text)) !== null) {
    const [whole, base] = match;
    const suffix = whole.slice(base.length);
    if (!suffix) continue;

    const start = match.index;
    if (start > cursor) parts.push(text.slice(cursor, start));
    const subMatch = suffix.match(/^_(?:\{[^}]+\}|[A-Za-z0-9]+)/);
    const subscript = subMatch ? parseSuffix(subMatch[0]) : undefined;
    const supMatch = suffix.slice(subMatch?.[0].length ?? 0).match(/^\^(?:\{[^}]+\}|\([^)]*\)|[A-Za-z0-9]+)/);
    const superscript = supMatch ? parseSuffix(supMatch[0]) : undefined;
    const spoken = `${base}${subscript ? ` 下标 ${subscript}` : ''}${superscript ? ` 上标 ${superscript}` : ''}`;

    parts.push(
      <span className="v2-inline-math" role="math" aria-label={spoken} key={`notation-${key++}`}>
        {base}{subscript ? <sub>{subscript}</sub> : null}{superscript ? <sup>{superscript}</sup> : null}
      </span>,
    );
    cursor = start + whole.length;
  }

  if (!parts.length) return <>{text}</>;
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
