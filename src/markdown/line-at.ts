const FENCE = /^ {0,3}(```|~~~)/;

export type Line = { start: number; end: number; text: string };

/** The line containing the offset, with its start and end offsets and its text (no trailing newline). */
export function lineAt(value: string, offset: number): Line {
  const start = value.lastIndexOf('\n', offset - 1) + 1;
  const next = value.indexOf('\n', offset);
  const end = next === -1 ? value.length : next;
  return { start, end, text: value.slice(start, end) };
}

export function isFenceDelimiter(text: string): boolean {
  return FENCE.test(text);
}

export function insideFence(value: string, offset: number): boolean {
  const lines = value.slice(0, offset).split('\n');
  if (isFenceDelimiter(lines[lines.length - 1])) return true;

  let open = false;
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (isFenceDelimiter(lines[i])) open = !open;
  }
  return open;
}
