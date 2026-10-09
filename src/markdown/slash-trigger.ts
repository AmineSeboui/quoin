import { insideFence } from './line-at';

export function shouldOpenPalette(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): boolean {
  if (selectionStart !== selectionEnd) return false;
  if (insideFence(value, selectionStart)) return false;
  if (selectionStart === 0) return true;

  const previous = value[selectionStart - 1];
  return previous === '\n' || previous === ' ' || previous === '\t';
}
