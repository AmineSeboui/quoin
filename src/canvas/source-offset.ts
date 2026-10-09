/** Rendered markdown does not carry its own source positions, so the caret is
 *  placed by finding the clicked text back in the source. Inline markup means a
 *  paragraph's rendered text often is not a literal substring of it ("**bold**"
 *  renders as "bold"), so progressively shorter leading probes are tried before
 *  giving up on the top of the block. */
const PROBE_LENGTHS = [40, 20, 8];

export function sourceOffsetFor(source: string, clickedText: string): number {
  const text = clickedText.replace(/\s+/g, ' ').trim();
  if (text === '') return 0;

  const whole = source.indexOf(text);
  if (whole !== -1) return whole;

  for (const length of PROBE_LENGTHS) {
    if (text.length < length) continue;
    const at = source.indexOf(text.slice(0, length));
    if (at !== -1) return at;
  }

  return 0;
}
