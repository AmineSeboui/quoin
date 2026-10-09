import { coreBlocks } from '../blocks/core';
import type { QuoinBlock } from '../types';
import { buildAnnouncements } from './announcements';

const blocks: QuoinBlock[] = [
  { id: 'a', type: 'MARKDOWN', data: {} },
  { id: 'b', type: 'GONE', data: {} },
];

const announce = buildAnnouncements(blocks, coreBlocks);
const at = (id: string) => ({ id }) as never;

describe('buildAnnouncements', () => {
  it('names a block by its registered label and position', () => {
    expect(announce.onDragStart?.({ active: at('a') })).toBe('Picked up Markdown block, position 1 of 2.');
  });

  it('falls back to the raw type for an unregistered block', () => {
    expect(announce.onDragStart?.({ active: at('b') })).toBe('Picked up GONE block, position 2 of 2.');
  });

  it('says where a block was dropped, or that it was dropped over nothing', () => {
    expect(announce.onDragEnd?.({ active: at('a'), over: at('b') })).toBe(
      'Markdown block, position 1 of 2 was dropped over GONE block, position 2 of 2.',
    );
    expect(announce.onDragEnd?.({ active: at('a'), over: null })).toBe(
      'Markdown block, position 1 of 2 was dropped.',
    );
  });
});
