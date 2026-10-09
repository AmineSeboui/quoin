export type IntrinsicSize = { width: number; height: number };

/** Persisted onto the block so the reader can reserve the box before the bytes
 *  arrive. Resolves null rather than rejecting: a drop without them still renders,
 *  it just reflows. */
export function intrinsicSize(src: string): Promise<IntrinsicSize | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
