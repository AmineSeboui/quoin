'use client';

import * as React from 'react';
import { BlockCard } from './BlockCard';
import type { QuoinBlock } from '../types';

/** Draws the document at rest: every block's preview, with no inserters, menus, drag handles or editors. */
export function ReadOnlyCanvas({
  blocks,
  onUpdate,
  root,
}: {
  blocks: QuoinBlock[];
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  root: React.ComponentPropsWithRef<'div'>;
}) {
  return (
    <div {...root}>
      <ul className="flex flex-col">
        {blocks.map((b, i) => (
          <li key={b.id}>
            <div data-block-index={i} className="rounded-lg px-2 py-1">
              <BlockCard block={b} index={i} editingByDefault={false} readOnly onUpdate={onUpdate} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
