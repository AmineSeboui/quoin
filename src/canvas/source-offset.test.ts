import { sourceOffsetFor, type ClickProbe } from './source-offset';

const SOURCE = 'The quick brown fox jumps over the lazy dog, twice.';

function probe(partial: Partial<ClickProbe>): ClickProbe {
  return { rendered: SOURCE, clickedText: SOURCE, renderedOffset: null, ...partial };
}

describe('sourceOffsetFor with a preview that draws the source verbatim', () => {
  it('takes the browser caret position as the source offset', () => {
    expect(sourceOffsetFor(SOURCE, probe({ renderedOffset: 27 }))).toBe(27);
  });

  it('keeps a click at the end of the text at the end of the source', () => {
    expect(sourceOffsetFor(SOURCE, probe({ renderedOffset: SOURCE.length }))).toBe(SOURCE.length);
  });

  it('resolves a repeated line by position rather than by the first match', () => {
    const repeated = 'same line\nsame line\nsame line';
    const offset = repeated.lastIndexOf('same line');
    expect(sourceOffsetFor(repeated, probe({ rendered: repeated, clickedText: repeated, renderedOffset: offset })))
      .toBe(offset);
  });

  it('clamps an offset that outruns the source', () => {
    expect(sourceOffsetFor(SOURCE, probe({ renderedOffset: 900 }))).toBe(SOURCE.length);
  });
});

describe('sourceOffsetFor falling back for a preview that renders the source', () => {
  const rendered = 'Long section\nFirst paragraph.\nSecond paragraph.';
  const source = '## Long section\n\nFirst paragraph.\n\nSecond paragraph.';

  it('finds the clicked paragraph even though the browser caret is in rendered text', () => {
    const at = sourceOffsetFor(source, { rendered, clickedText: 'Second paragraph.', renderedOffset: 20 });
    expect(at).toBe(source.indexOf('Second paragraph.'));
  });

  it('finds a heading whose marker is not rendered', () => {
    const at = sourceOffsetFor(source, { rendered, clickedText: 'Long section', renderedOffset: null });
    expect(at).toBe(source.indexOf('Long section'));
  });

  it('finds a multi-line clicked string, which collapsing whitespace would lose', () => {
    const clicked = 'first line\nsecond line';
    const at = sourceOffsetFor(`intro\n\n${clicked}`, {
      rendered: `intro\n${clicked}`,
      clickedText: clicked,
      renderedOffset: null,
    });
    expect(at).toBe(7);
  });

  it('matches a leading probe when the rest of the line is rewritten', () => {
    const long = 'A paragraph long enough to probe with a **bold** tail on the end of it.';
    const at = sourceOffsetFor(long, {
      rendered: 'rendered differently',
      clickedText: 'A paragraph long enough to probe with a bold tail on the end of it.',
      renderedOffset: null,
    });
    expect(at).toBe(0);
  });

  it('puts the caret at the end when the click covers the whole block', () => {
    const at = sourceOffsetFor(source, { rendered, clickedText: rendered, renderedOffset: null });
    expect(at).toBe(source.length);
  });

  it('puts the caret at the end when the clicked text is nowhere in the source', () => {
    const at = sourceOffsetFor(source, { rendered, clickedText: 'nothing like it', renderedOffset: null });
    expect(at).toBe(source.length);
  });

  it('puts the caret at the end for a click that carries no text at all', () => {
    const at = sourceOffsetFor(source, { rendered, clickedText: '   ', renderedOffset: null });
    expect(at).toBe(source.length);
  });
});
