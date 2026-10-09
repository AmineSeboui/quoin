import * as React from 'react';

/** Height follows the content, and is recomputed when the box gets narrower or
 *  wider, because a re-wrap changes the line count without changing the value.
 *  Only a width change refits: reacting to the height this hook just set would
 *  feed the observer its own output. */
export function useAutoGrow<T extends HTMLTextAreaElement>(value: string) {
  const ref = React.useRef<T>(null);
  const lastWidth = React.useRef<number | null>(null);

  // Measuring means collapsing to "auto" first, which shrinks the page enough that
  // the browser clamps the scroll position, and growing back does not undo that.
  // Both steps run before paint, so restoring the scroll here is not visible.
  const fit = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const scroller = document.scrollingElement ?? document.documentElement;
    const scrollTop = scroller.scrollTop;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) el.style.height = `${el.scrollHeight}px`;
    if (scroller.scrollTop !== scrollTop) scroller.scrollTop = scrollTop;
  }, []);

  React.useLayoutEffect(fit, [fit, value]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width === lastWidth.current) return;
      lastWidth.current = width;
      fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  return ref;
}
