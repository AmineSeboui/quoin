import type { Edit } from './edit';
import { insideFence, lineAt } from './line-at';
import { LIST_MARKER } from './list-continuation';

const INDENT = '  ';

function indentOf(text: string): number {
  return /^\s*/.exec(text)?.[0].length ?? 0;
}

// Indenting more than one level past the line above turns a list item into an
// indented code block, so the first line of the range is capped against it.
function shift(text: string, direction: 1 | -1, cap: number | undefined): string {
  const current = indentOf(text);
  if (direction === -1) return text.slice(Math.min(current, INDENT.length));
  if (cap !== undefined && current >= cap + INDENT.length) return text;
  return INDENT + text;
}

/** Indents or outdents the selected list items; returns null when the selection is not entirely list items, is inside a code fence, or cannot move further, so Tab keeps its default behaviour. */
export function indentList(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  direction: 1 | -1,
): Edit | null {
  if (insideFence(value, selectionStart)) return null;

  const first = lineAt(value, selectionStart);
  const last = lineAt(value, selectionEnd);
  const block = value.slice(first.start, last.end);
  const lines = block.split('\n');
  if (!lines.every((text) => LIST_MARKER.test(text))) return null;

  const cap = first.start === 0 ? 0 : indentOf(lineAt(value, first.start - 1).text);
  const shifted = lines.map((text, i) => shift(text, direction, i === 0 ? cap : undefined));
  if (shifted.every((text, i) => text === lines[i])) return null;

  const joined = shifted.join('\n');
  return {
    value: value.slice(0, first.start) + joined + value.slice(last.end),
    selectionStart: selectionStart + (shifted[0].length - lines[0].length),
    selectionEnd: selectionEnd + (joined.length - block.length),
  };
}
