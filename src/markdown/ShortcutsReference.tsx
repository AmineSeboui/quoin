'use client';

import { formatShortcut } from './shortcut-label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const ROWS: Array<{ label: string; keys: string }> = [
  { label: 'Open the command palette', keys: '/' },
  { label: 'Bold', keys: formatShortcut('mod+b') },
  { label: 'Italic', keys: formatShortcut('mod+i') },
  { label: 'Inline code', keys: formatShortcut('mod+e') },
  { label: 'Link', keys: formatShortcut('mod+k') },
  { label: 'Heading', keys: formatShortcut('mod+alt+1') },
  { label: 'Subtitle', keys: formatShortcut('mod+alt+2') },
  { label: 'Sub-subtitle', keys: formatShortcut('mod+alt+3') },
  { label: 'Bullet list', keys: formatShortcut('mod+shift+8') },
  { label: 'Numbered list', keys: formatShortcut('mod+shift+7') },
  { label: 'Continue a list, or leave it when the item is empty', keys: 'Enter' },
  { label: 'Indent item', keys: 'Tab' },
  { label: 'Outdent item', keys: formatShortcut('shift') + '+Tab' },
];

export function ShortcutsReference({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Formatting without leaving the keyboard.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          {ROWS.map((row) => (
            <div key={row.label} className="col-span-2 grid grid-cols-subgrid items-baseline">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{row.keys}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
