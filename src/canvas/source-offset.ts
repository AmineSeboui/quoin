/** What a click on a block's rendered body says about where the caret belongs. */
export type ClickProbe = {
  /** The whole text the preview drew for the block. */
  rendered: string;
  /** The text of the element the click actually landed on. */
  clickedText: string;
  /** Character offset of the click within `rendered`, or null when the browser places no caret there. */
  renderedOffset: number | null;
};

type CaretPosition = { offsetNode: Node; offset: number };

type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => CaretPosition | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function caretPositionAt(x: number, y: number): CaretPosition | null {
  const doc = document as CaretDocument;
  const position = doc.caretPositionFromPoint?.(x, y);
  if (position) return position;
  const range = doc.caretRangeFromPoint?.(x, y);
  return range ? { offsetNode: range.startContainer, offset: range.startOffset } : null;
}

/** Character offset of the point within `container`'s text, or null when no caret can be placed there. */
export function renderedOffsetAt(container: HTMLElement, x: number, y: number): number | null {
  const position = caretPositionAt(x, y);
  if (!position || position.offsetNode.nodeType !== Node.TEXT_NODE) return null;
  if (!container.contains(position.offsetNode)) return null;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let before = 0;
  while (walker.nextNode()) {
    if (walker.currentNode === position.offsetNode) return before + position.offset;
    before += walker.currentNode.textContent?.length ?? 0;
  }
  return null;
}

const PROBE_LENGTHS = [40, 20, 8];

/** A custom preview draws something other than the source, so the clicked text is looked
 *  back up in it. Collapsing runs of whitespace is what lets a wrapped rendering match a
 *  single source line, but it also makes a multi-line clicked string unfindable, so the
 *  literal text is tried first and the collapsed form only after it. */
function search(source: string, probe: ClickProbe): number {
  const literal = probe.clickedText.trim();
  // Clicking the block rather than a line inside it locates nothing. The end is where an
  // author can carry on writing; the top is the one place they certainly did not aim at.
  if (literal === '' || literal === probe.rendered.trim()) return source.length;

  const candidates = [literal, literal.replace(/\s+/g, ' ')];
  for (const text of candidates) {
    const whole = source.indexOf(text);
    if (whole !== -1) return whole;
  }
  for (const length of PROBE_LENGTHS) {
    for (const text of candidates) {
      if (text.length < length) continue;
      const at = source.indexOf(text.slice(0, length));
      if (at !== -1) return at;
    }
  }
  return source.length;
}

/** Where in `source` the caret belongs for a click the preview reported through `probe`. */
export function sourceOffsetFor(source: string, probe: ClickProbe): number {
  // The stock previews draw the source verbatim, so the browser's own caret position is
  // the answer, with no searching and no ambiguity between repeated lines.
  if (probe.renderedOffset !== null && probe.rendered === source) {
    return Math.max(0, Math.min(probe.renderedOffset, source.length));
  }
  return search(source, probe);
}
