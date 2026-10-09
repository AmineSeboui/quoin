import type { Edit } from './edit';
import { insideFence, lineAt, type Line } from './line-at';

export const LIST_MARKER = /^(\s*)((?:[-*+] \[[ xX]\] )|(?:[-*+] )|(?:\d+[.)] )|(?:> ))(.*)$/;

const INDENT = '  ';

function nextMarker(marker: string): string {
  const ordered = /^(\d+)([.)] )$/.exec(marker);
  if (ordered) return `${Number(ordered[1]) + 1}${ordered[2]}`;
  const task = /^([-*+]) \[[ xX]\] $/.exec(marker);
  if (task) return `${task[1]} [ ] `;
  return marker;
}

// Both the dead item on Enter and the caret at the content start on Backspace
// mean the same thing: climb out one level, or drop the marker at the top.
function climbOut(value: string, line: Line, indent: string, marker: string, content: string): Edit {
  const outdent = indent.length >= INDENT.length;

  if (outdent) {
    const text = indent.slice(INDENT.length) + marker + content;
    const at = line.start + indent.length - INDENT.length + marker.length;
    return {
      value: value.slice(0, line.start) + text + value.slice(line.end),
      selectionStart: at,
      selectionEnd: at,
    };
  }

  // A stripped marker with only a single newline above it reads to CommonMark
  // as a lazy continuation of the previous list item's paragraph, not a new
  // block, so a blank line is needed whenever that previous line is a list item.
  const leavesList = line.start > 0 && LIST_MARKER.test(lineAt(value, line.start - 1).text);
  const text = leavesList ? `\n${content}` : content;
  const at = leavesList ? line.start + 1 : line.start;

  return {
    value: value.slice(0, line.start) + text + value.slice(line.end),
    selectionStart: at,
    selectionEnd: at,
  };
}

export function continueList(
  value: string,
  caret: number,
  key: 'Enter' | 'Backspace',
): Edit | null {
  if (insideFence(value, caret)) return null;

  const line = lineAt(value, caret);
  const match = LIST_MARKER.exec(line.text);
  if (!match) return null;

  const [, indent, marker, content] = match;

  if (key === 'Backspace') {
    if (caret !== line.start + indent.length + marker.length) return null;
    return climbOut(value, line, indent, marker, content);
  }

  if (content.trim() === '') return climbOut(value, line, indent, marker, content);

  const inserted = `\n${indent}${nextMarker(marker)}`;
  const at = caret + inserted.length;
  return {
    value: value.slice(0, caret) + inserted + value.slice(caret),
    selectionStart: at,
    selectionEnd: at,
  };
}
