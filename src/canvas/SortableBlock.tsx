'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';
import { cn } from '../ui/cn';

/** The gutter only leaves the text column once the viewport is wide enough to
 *  hold it beside a 68ch measure, which is past `lg`. Below that it stacks above
 *  the block, where it also has to stay visible: hover is not available there. */
const GUTTER = [
  'flex items-center justify-end gap-0.5 pb-1',
  'lg:absolute lg:right-full lg:top-1 lg:justify-start lg:pb-0 lg:pr-1',
  'lg:opacity-0 lg:transition-opacity',
  'lg:group-hover/block:opacity-100 lg:group-focus-within/block:opacity-100',
].join(' ');

export function SortableBlock({
  id,
  index,
  actions,
  children,
}: {
  id: string;
  index: number;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group/block relative', isDragging && 'z-10 opacity-80')}
    >
      <div className={GUTTER}>
        {actions}
        <Button
          type="button"
          ref={setActivatorNodeRef}
          variant="ghost"
          size="icon-sm"
          className="cursor-grab text-muted-foreground active:cursor-grabbing"
          aria-label={`Reorder block ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
        </Button>
      </div>
      <div
        data-block-index={index}
        className={cn(
          'rounded-lg px-2 py-1 transition-colors',
          isDragging ? 'bg-card shadow-[var(--shadow-md)]' : 'group-hover/block:bg-muted/40',
        )}
      >
        {children}
      </div>
    </div>
  );
}
