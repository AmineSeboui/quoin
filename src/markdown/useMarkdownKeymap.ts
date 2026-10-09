import * as React from 'react';
import { applyEdit, type Edit } from './edit';
import { indentList } from './indent-list';
import { toggleLinePrefix, type LinePrefix } from './line-toggles';
import { continueList } from './list-continuation';
import { shouldOpenPalette } from './slash-trigger';
import { linkPaste, wrapSelection, type WrapKind } from './wrap-selection';

const WRAP: Record<string, WrapKind> = { b: 'bold', i: 'italic', e: 'code', k: 'link' };

// Shift turns the 8 key into "*", so the physical code is the only stable match.
const HEADING: Record<string, LinePrefix> = { Digit1: 'h1', Digit2: 'h2', Digit3: 'h3' };
const LIST: Record<string, LinePrefix> = { Digit7: 'ordered', Digit8: 'bullet' };

/** Keyboard and paste handlers that give a plain textarea markdown shortcuts, list continuation, Tab indent and the slash palette trigger. */
export function useMarkdownKeymap({
  commit,
  onOpenPalette,
}: {
  commit: (markdown: string) => void;
  onOpenPalette: () => void;
}) {
  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;
      const { value, selectionStart, selectionEnd } = el;
      const mod = event.metaKey || event.ctrlKey;

      const run = (edit: Edit | null) => {
        if (!edit) return;
        event.preventDefault();
        applyEdit(el, edit, commit);
      };

      if (mod && event.altKey) {
        const kind = HEADING[event.code];
        if (kind) run(toggleLinePrefix(kind, value, selectionStart, selectionEnd));
        return;
      }

      if (mod && event.shiftKey) {
        const kind = LIST[event.code];
        if (kind) run(toggleLinePrefix(kind, value, selectionStart, selectionEnd));
        return;
      }

      if (mod) {
        const kind = WRAP[event.key.toLowerCase()];
        if (kind) run(wrapSelection(kind, value, selectionStart, selectionEnd));
        return;
      }

      if (event.key === '/') {
        if (!shouldOpenPalette(value, selectionStart, selectionEnd)) return;
        event.preventDefault();
        onOpenPalette();
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        run(continueList(value, selectionStart, 'Enter'));
        return;
      }

      if (event.key === 'Backspace' && selectionStart === selectionEnd) {
        run(continueList(value, selectionStart, 'Backspace'));
        return;
      }

      if (event.key === 'Tab') {
        run(indentList(value, selectionStart, selectionEnd, event.shiftKey ? -1 : 1));
      }
    },
    [commit, onOpenPalette],
  );

  const onPaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;
      const edit = linkPaste(
        el.value,
        el.selectionStart,
        el.selectionEnd,
        event.clipboardData.getData('text/plain'),
      );
      if (!edit) return;
      event.preventDefault();
      applyEdit(el, edit, commit);
    },
    [commit],
  );

  return { onKeyDown, onPaste };
}
