import type { ReactNode } from 'react';
import { safeHref } from './safeUrl';

const TOKEN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;

export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const start = match.index;
    if (start > last) nodes.push(text.slice(last, start));
    const token = match[0];
    const key = start;
    if (match[1]) nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    else if (match[2]) nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (match[3]) nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    else {
      const [, label, target] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/) ?? [];
      const href = safeHref(target ?? '');
      nodes.push(href ? <a key={key} href={href} target="_blank" rel="noreferrer">{label}</a> : token);
    }
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
