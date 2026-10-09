type CopiedProperty =
  | 'boxSizing'
  | 'fontFamily'
  | 'fontSize'
  | 'fontStyle'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingTop'
  | 'textIndent'
  | 'textTransform'
  | 'wordBreak'
  | 'wordSpacing'
  | 'borderBottomWidth'
  | 'borderLeftWidth'
  | 'borderRightWidth'
  | 'borderTopWidth';

const COPIED: CopiedProperty[] = [
  'boxSizing',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'textIndent',
  'textTransform',
  'wordBreak',
  'wordSpacing',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
];

/** The caret's position and line height, in pixels relative to the textarea's top left corner. */
export type CaretRect = { top: number; left: number; height: number };

/** A textarea exposes no caret geometry, so the text before the caret is laid
 *  out again in a hidden div that copies the box's own metrics, and a marker at
 *  the end of it is measured. Returns null when the textarea is not laid out
 *  (hidden or detached), because there is nothing to measure. */
export function caretRect(el: HTMLTextAreaElement): CaretRect | null {
  if (el.offsetWidth === 0) return null;

  const style = window.getComputedStyle(el);
  const mirror = document.createElement('div');
  for (const property of COPIED) mirror.style[property] = style[property];
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  mirror.style.width = `${el.clientWidth}px`;
  mirror.textContent = el.value.slice(0, el.selectionStart);

  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const top = marker.offsetTop;
  const left = marker.offsetLeft;
  const height = marker.offsetHeight || Number.parseFloat(style.lineHeight) || 0;
  mirror.remove();

  if (height === 0) return null;
  return { top: top - el.scrollTop, left, height };
}
