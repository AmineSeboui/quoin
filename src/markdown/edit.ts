export type Edit = { value: string; selectionStart: number; selectionEnd: number };

function changedSpan(before: string, after: string) {
  let start = 0;
  const shortest = Math.min(before.length, after.length);
  while (start < shortest && before[start] === after[start]) start += 1;

  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore -= 1;
    endAfter -= 1;
  }

  return { start, endBefore, replacement: after.slice(start, endAfter) };
}

// Writing through execCommand keeps the transform as one entry on the browser's
// own undo stack. Either path commits el.value rather than the edit's intended
// value: a browser is trusted to write what it was asked, and if it ever
// wrote something else, committing our own intent instead would silently
// diverge React's state from the DOM.
function writeNatively(el: HTMLTextAreaElement, replacement: string): boolean {
  if (typeof document.execCommand !== 'function') return false;
  try {
    return replacement === ''
      ? document.execCommand('delete')
      : document.execCommand('insertText', false, replacement);
  } catch {
    return false;
  }
}

export function applyEdit(
  el: HTMLTextAreaElement,
  edit: Edit,
  commit: (value: string) => void,
): void {
  if (el.value !== edit.value) {
    const { start, endBefore, replacement } = changedSpan(el.value, edit.value);
    el.setSelectionRange(start, endBefore);
    if (!writeNatively(el, replacement)) {
      el.value = edit.value;
    }
    commit(el.value);
  }
  el.setSelectionRange(edit.selectionStart, edit.selectionEnd);
}
