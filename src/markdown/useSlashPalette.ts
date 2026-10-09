import * as React from 'react';
import { caretRect, type CaretRect } from './caret-coordinates';

export function useSlashPalette(ref: React.RefObject<HTMLTextAreaElement | null>) {
  const [open, setOpen] = React.useState(false);
  const [caret, setCaret] = React.useState<CaretRect | null>(null);
  const offsetRef = React.useRef(0);

  const openAtCaret = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    offsetRef.current = el.selectionStart;
    setCaret(caretRect(el));
    setOpen(true);
  }, [ref]);

  return { open, setOpen, caret, offsetRef, openAtCaret };
}
