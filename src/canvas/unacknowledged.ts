import type { QuoinBlock } from '../types';

/** A host may coalesce or drop echoes, so the outstanding set is capped instead of trusted to drain. */
const UNACKNOWLEDGED_LIMIT = 64;

/** Records an emitted document as awaiting its echo, dropping the oldest once the cap is reached. */
export function remember(outstanding: Set<QuoinBlock[]>, blocks: QuoinBlock[]) {
  outstanding.add(blocks);
  while (outstanding.size > UNACKNOWLEDGED_LIMIT) {
    const oldest = outstanding.values().next();
    if (oldest.done) return;
    outstanding.delete(oldest.value);
  }
}
