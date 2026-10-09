import { insideFence } from './line-at';

/** Whether typing "/" here should open the command palette: only at a word start, with no selection and outside a code fence. */
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
