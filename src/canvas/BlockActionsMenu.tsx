'use client';

import { ArrowDown, ArrowUp, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function BlockActionsMenu({
  index,
  count,
  label,
  onMove,
  onDelete,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (index: number, dir: 1 | -1) => void;
  onDelete: () => void;
}) {
  const position = index + 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label} block ${position} options`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          aria-label={`Move block ${position} up`}
          disabled={index === 0}
          onSelect={() => onMove(index, -1)}
        >
          <ArrowUp aria-hidden="true" />
          <span>Move up</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-label={`Move block ${position} down`}
          disabled={index === count - 1}
          onSelect={() => onMove(index, 1)}
        >
          <ArrowDown aria-hidden="true" />
          <span>Move down</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          aria-label={`Delete block ${position}`}
          className="text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          <Trash2 aria-hidden="true" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
