import type { QuoinBlock } from '../types';
import { sameBlocks } from './same-blocks';

const doc = (): QuoinBlock[] => [
  { id: 'a', type: 'MARKDOWN', data: { markdown: 'one' } },
  { id: 'b', type: 'CODE', data: { code: 'x', language: 'ts' } },
];

describe('sameBlocks', () => {
  it('treats a structurally equal copy as the same', () => {
    expect(sameBlocks(doc(), doc())).toBe(true);
  });

  it('tells apart a changed id, type, data value, data key or order', () => {
    const changedId = doc();
    changedId[0].id = 'z';
    const changedType = doc();
    changedType[0].type = 'CODE';
    const changedValue = doc();
    changedValue[0].data = { markdown: 'two' };
    const extraKey = doc();
    extraKey[0].data = { markdown: 'one', extra: 1 };
    const swappedKey = doc();
    swappedKey[0].data = { other: 'one' };
    const reordered = doc().reverse();
    for (const next of [changedId, changedType, changedValue, extraKey, swappedKey, reordered]) {
      expect(sameBlocks(doc(), next)).toBe(false);
    }
  });

  it('tells apart documents of different length', () => {
    expect(sameBlocks(doc(), doc().slice(1))).toBe(false);
  });
});
