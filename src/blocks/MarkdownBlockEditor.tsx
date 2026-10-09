'use client';

import * as React from 'react';
import { useQuoin } from '../context';
import { FilePickerButton } from '../upload/FilePickerButton';
import { applyEdit } from '../markdown/edit';
import { insertCommand } from '../markdown/insert-command';
import { ShortcutsReference } from '../markdown/ShortcutsReference';
import { SlashPalette } from '../markdown/SlashPalette';
import { useMarkdownKeymap } from '../markdown/useMarkdownKeymap';
import { useSlashPalette } from '../markdown/useSlashPalette';
import type { TextCommand } from '../markdown/commands';
import { useAutoGrow } from '../hooks/useAutoGrow';
import type { BlockEditorProps } from '../types';
import { str } from './str';

const BOX = [
  '-mx-2 min-h-7 w-[calc(100%+1rem)] resize-none rounded-md border-0 bg-transparent px-2 py-0',
  'text-base leading-7 outline-none placeholder:text-muted-foreground',
  'transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50',
].join(' ');

export function MarkdownBlockEditor({ data, onChange, onInsertBlock, onDone }: BlockEditorProps) {
  const { onError } = useQuoin();
  const markdown = str(data.markdown);
  const ref = useAutoGrow<HTMLTextAreaElement>(markdown);
  const palette = useSlashPalette(ref);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const set = (patch: Record<string, unknown>) => onChange({ ...data, ...patch });
  // The keymap memoises its handlers on this, so a fresh closure every render would
  // rebuild them on every render too, including the ones a palette or dialog causes.
  const commit = React.useCallback(
    (next: string) => onChange({ ...data, markdown: next }),
    [data, onChange],
  );

  const keymap = useMarkdownKeymap({ commit, onOpenPalette: palette.openAtCaret });

  function reopenBox(): HTMLTextAreaElement | null {
    const el = ref.current;
    el?.focus({ preventScroll: true });
    return el ?? null;
  }

  function runTextCommand(command: TextCommand) {
    palette.setOpen(false);
    const el = reopenBox();
    if (!el) return;
    applyEdit(el, insertCommand(command, el.value, palette.offsetRef.current), commit);
  }

  function writeLiteralSlash() {
    palette.setOpen(false);
    const el = reopenBox();
    if (!el) return;
    const at = palette.offsetRef.current;
    applyEdit(
      el,
      { value: `${el.value.slice(0, at)}/${el.value.slice(at)}`, selectionStart: at + 1, selectionEnd: at + 1 },
      commit,
    );
  }

  function readMarkdownFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (text.trim() === '') {
        onError(new Error(`${file.name} is empty.`));
        return;
      }
      set({ markdown: text });
      onDone?.();
    };
    reader.onerror = () => onError(new Error(`Could not read ${file.name}.`));
    reader.readAsText(file);
  }

  return (
    <div className="relative flex flex-col gap-3">
      <textarea
        ref={ref}
        aria-label="Markdown"
        value={markdown}
        rows={1}
        placeholder="Write, or press / for commands"
        onChange={(e) => set({ markdown: e.target.value })}
        onKeyDown={keymap.onKeyDown}
        onPaste={keymap.onPaste}
        className={BOX}
      />
      <SlashPalette
        open={palette.open}
        caret={palette.caret}
        onOpenChange={palette.setOpen}
        onTextCommand={runTextCommand}
        onBlockCommand={(type) => {
          palette.setOpen(false);
          onInsertBlock?.(type);
        }}
        onShortcuts={() => {
          palette.setOpen(false);
          setShortcutsOpen(true);
        }}
        onDismiss={writeLiteralSlash}
      />
      <ShortcutsReference open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      {markdown.trim() === '' && (
        <FilePickerButton
          label="Upload .md"
          accept=".md,text/markdown,text/plain"
          onPick={readMarkdownFile}
        />
      )}
    </div>
  );
}
