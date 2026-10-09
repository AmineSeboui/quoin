'use client';

import * as React from 'react';
import type { ChangeEvent } from 'react';
import type { TextCommand } from '../markdown/commands';
import { insertCommand } from '../markdown/insert-command';
import { ShortcutsReference } from '../markdown/ShortcutsReference';
import { SlashPalette } from '../markdown/SlashPalette';
import { useSlashPalette } from '../markdown/useSlashPalette';

const LINE = [
  'w-full resize-none rounded-md border-0 bg-transparent px-2 py-1 outline-none',
  'text-base leading-7 placeholder:text-muted-foreground',
  'transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50',
].join(' ');

export function DocumentStarter({
  autoFocus = false,
  onStart,
  onInsertBlock,
}: {
  autoFocus?: boolean;
  onStart: (markdown: string, selection?: { start: number; end: number }) => void;
  onInsertBlock: (type: string) => void;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const palette = useSlashPalette(ref);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  // The line never keeps what is typed into it: the first character becomes a
  // block instead. Clearing the node directly rather than through state keeps
  // that true even when the handler causes no re-render of this component.
  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    e.target.value = '';
    if (value === '') return;
    // A virtual keyboard, an IME or a paste delivers "/" with no keydown to
    // intercept, so the shortcut is recognised from the value as well.
    if (value === '/') palette.openAtCaret();
    else onStart(value);
  }

  function startWith(command: TextCommand) {
    palette.setOpen(false);
    const edit = insertCommand(command, '', 0);
    onStart(edit.value, { start: edit.selectionStart, end: edit.selectionEnd });
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        aria-label="Write something"
        defaultValue=""
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key !== '/') return;
          e.preventDefault();
          palette.openAtCaret();
        }}
        autoFocus={autoFocus}
        rows={1}
        placeholder="Write, or press / for commands"
        className={LINE}
      />
      <SlashPalette
        open={palette.open}
        caret={palette.caret}
        onOpenChange={palette.setOpen}
        onTextCommand={startWith}
        onBlockCommand={(type) => {
          palette.setOpen(false);
          onInsertBlock(type);
        }}
        onShortcuts={() => {
          palette.setOpen(false);
          setShortcutsOpen(true);
        }}
        onDismiss={() => palette.setOpen(false)}
      />
      <ShortcutsReference open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
