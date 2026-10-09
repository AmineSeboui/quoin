'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { useQuoin } from '../context';
import { paletteBlocks } from '../registry';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function BlockInserter({
  index,
  onInsert,
  label,
}: {
  index: number;
  onInsert: (index: number, type: string, data?: Record<string, unknown>) => void;
  label: string;
}) {
  const { blockTypes } = useQuoin();
  const options = paletteBlocks(blockTypes);
  const insertedAtRef = React.useRef<number | null>(null);

  function handleSelect(type: string) {
    insertedAtRef.current = index;
    onInsert(index, type);
  }

  function handleCloseAutoFocus(event: Event) {
    const insertedAt = insertedAtRef.current;
    insertedAtRef.current = null;
    if (insertedAt === null) return;

    event.preventDefault();
    const card = document.querySelector<HTMLElement>(`[data-block-index="${insertedAt}"]`);
    if (!card) return;
    if (typeof card.scrollIntoView === 'function') {
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    card.querySelector<HTMLElement>('textarea, input, [role="combobox"]')?.focus();
  }

  return (
    <div className="group/inserter relative flex h-6 items-center justify-center pointer-coarse:h-11">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 h-px bg-border opacity-0 transition-opacity group-hover/inserter:opacity-100 group-focus-within/inserter:opacity-100"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label={label}
            className="relative z-10 rounded-full bg-background opacity-0 transition-opacity group-hover/inserter:opacity-100 group-focus-within/inserter:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
          >
            <Plus aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56" onCloseAutoFocus={handleCloseAutoFocus}>
          {options.map((opt) => (
            <DropdownMenuItem key={opt.type} onSelect={() => handleSelect(opt.type)}>
              <opt.icon aria-hidden="true" />
              <span>{opt.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
