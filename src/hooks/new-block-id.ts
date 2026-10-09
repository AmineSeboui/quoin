/**
 * A fresh block id that cannot collide with one already in a persisted document.
 * It holds no counter, because a counter restarts on every page load and would
 * re-mint ids a host has stored.
 */
export function newBlockId(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID();
  // randomUUID is absent in insecure contexts and older runtimes.
  const random = () => Math.random().toString(36).slice(2, 10);
  return `blk-${Date.now().toString(36)}-${random()}${random()}`;
}
