import type { Edit } from './edit';

export type WrapKind = 'bold' | 'italic' | 'code' | 'link';

const DELIMITER: Record<Exclude<WrapKind, 'link'>, string> = {
  bold: '**',
  italic: '_',
  code: '`',
};

const WHOLE_LINK = /^\[([^\]]*)\]\(([^)]*)\)$/;
const BARE_URL = /^https?:\/\/[^\s]+$/;

function unwrap(value: string, start: number, end: number, delimiter: string): Edit | null {
  const selected = value.slice(start, end);
  const width = delimiter.length;

  if (selected.length >= 2 * width && selected.startsWith(delimiter) && selected.endsWith(delimiter)) {
    const inner = selected.slice(width, selected.length - width);
    return {
      value: value.slice(0, start) + inner + value.slice(end),
      selectionStart: start,
      selectionEnd: start + inner.length,
    };
  }

  const outside =
    start >= width &&
    value.slice(start - width, start) === delimiter &&
    value.slice(end, end + width) === delimiter;

  if (!outside) return null;

  return {
    value: value.slice(0, start - width) + selected + value.slice(end + width),
    selectionStart: start - width,
    selectionEnd: start - width + selected.length,
  };
}

function link(value: string, start: number, end: number): Edit {
  const selected = value.slice(start, end);
  const whole = WHOLE_LINK.exec(selected);

  if (whole) {
    const text = whole[1];
    return {
      value: value.slice(0, start) + text + value.slice(end),
      selectionStart: start,
      selectionEnd: start + text.length,
    };
  }

  const opened = `[${selected}](`;
  const at = selected === '' ? start + 1 : start + opened.length;
  return {
    value: value.slice(0, start) + opened + ')' + value.slice(end),
    selectionStart: at,
    selectionEnd: at,
  };
}

export function wrapSelection(
  kind: WrapKind,
  value: string,
  selectionStart: number,
  selectionEnd: number,
): Edit {
  if (kind === 'link') return link(value, selectionStart, selectionEnd);

  const delimiter = DELIMITER[kind];
  const stripped = unwrap(value, selectionStart, selectionEnd, delimiter);
  if (stripped) return stripped;

  const selected = value.slice(selectionStart, selectionEnd);

  if (kind === 'code' && selected.includes('\n')) {
    const at = selectionStart + 4;
    return {
      value: value.slice(0, selectionStart) + '```\n' + selected + '\n```' + value.slice(selectionEnd),
      selectionStart: at,
      selectionEnd: at + selected.length,
    };
  }

  const at = selectionStart + delimiter.length;
  return {
    value: value.slice(0, selectionStart) + delimiter + selected + delimiter + value.slice(selectionEnd),
    selectionStart: at,
    selectionEnd: at + selected.length,
  };
}

export function linkPaste(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  pasted: string,
): Edit | null {
  if (selectionStart === selectionEnd) return null;

  const url = pasted.trim();
  if (!BARE_URL.test(url)) return null;

  const inserted = `[${value.slice(selectionStart, selectionEnd)}](${url})`;
  const at = selectionStart + inserted.length;
  return {
    value: value.slice(0, selectionStart) + inserted + value.slice(selectionEnd),
    selectionStart: at,
    selectionEnd: at,
  };
}
