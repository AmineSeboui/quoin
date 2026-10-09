import type { QuoinBlock } from '../types';

function sameData(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  if (a === b) return true;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.hasOwn(b, key) && Object.is(a[key], b[key]));
}

/** Whether two documents hold the same blocks in the same order, comparing each block's data one level deep. */
export function sameBlocks(a: QuoinBlock[], b: QuoinBlock[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((block, i) => {
    const other = b[i];
    return block.id === other.id && block.type === other.type && sameData(block.data, other.data);
  });
}
