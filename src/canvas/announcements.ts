import type { Announcements } from '@dnd-kit/core';
import { blockByType, type AnyBlockDefinition } from '../registry';
import type { QuoinBlock } from '../types';

function describeBlock(blocks: QuoinBlock[], blockTypes: AnyBlockDefinition[], id: string): string {
  const index = blocks.findIndex((b) => b.id === id);
  if (index === -1) return 'block';
  const { type } = blocks[index];
  const label = blockByType(blockTypes, type)?.label ?? type;
  return `${label} block, position ${index + 1} of ${blocks.length}`;
}

/** The screen reader sentences a drag speaks, naming each block by its registered label and position. */
export function buildAnnouncements(blocks: QuoinBlock[], blockTypes: AnyBlockDefinition[]): Announcements {
  const describe = (id: string | number) => describeBlock(blocks, blockTypes, String(id));
  return {
    onDragStart({ active }) {
      return `Picked up ${describe(active.id)}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return `${describe(active.id)} is no longer over a drop position.`;
      return `${describe(active.id)} was moved over ${describe(over.id)}.`;
    },
    onDragEnd({ active, over }) {
      if (!over) return `${describe(active.id)} was dropped.`;
      return `${describe(active.id)} was dropped over ${describe(over.id)}.`;
    },
    onDragCancel({ active }) {
      return `Dragging was cancelled. ${describe(active.id)} was dropped.`;
    },
  };
}
