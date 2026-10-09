import type { Edit } from './edit';
import { insideFence, isFenceDelimiter, lineAt } from './line-at';

/** A line-level markdown prefix: a heading level, a bullet or a numbered item. */
export type LinePrefix = 'h1' | 'h2' | 'h3' | 'bullet' | 'ordered';

const EXISTING = /^(\s*)(?:#{1,6} |[-*+] \[[ xX]\] |[-*+] |\d+[.)] )?/;

const PREFIX: Record<LinePrefix, (index: number) => string> = {
  h1: () => '# ',
  h2: () => '## ',
  h3: () => '### ',
  bullet: () => '- ',
  ordered: (index) => `${index + 1}. `,
};

const CARRIES: Record<LinePrefix, RegExp> = {
  h1: /^\s*# /,
  h2: /^\s*## /,
  h3: /^\s*### /,
  bullet: /^\s*[-*+] /,
  ordered: /^\s*\d+[.)] /,
};

/** Adds the prefix to every line in the selection, or removes it when every line already carries it; fenced code is left alone. */
export function toggleLinePrefix(
  kind: LinePrefix,
  value: string,
  selectionStart: number,
  selectionEnd: number,
): Edit {
  const first = lineAt(value, selectionStart);
  const last = lineAt(value, selectionEnd);
  const block = value.slice(first.start, last.end);
  const lines = block.split('\n');

  let offset = first.start;
  const eligible = lines.map((text) => {
    const at = offset;
    offset += text.length + 1;
    return !insideFence(value, at) && !isFenceDelimiter(text);
  });

  const carried = lines.every((text, i) => !eligible[i] || CARRIES[kind].test(text));

  const rewritten = lines.map((text, i) => {
    if (!eligible[i]) return text;
    const match = EXISTING.exec(text);
    const indent = match?.[1] ?? '';
    const body = text.slice(match?.[0].length ?? 0);
    return carried ? indent + body : indent + PREFIX[kind](i) + body;
  });

  const joined = rewritten.join('\n');
  const next = value.slice(0, first.start) + joined + value.slice(last.end);

  if (selectionStart !== selectionEnd) {
    return { value: next, selectionStart: first.start, selectionEnd: first.start + joined.length };
  }

  const caret = Math.max(first.start, selectionStart + (rewritten[0].length - lines[0].length));
  return { value: next, selectionStart: caret, selectionEnd: caret };
}
