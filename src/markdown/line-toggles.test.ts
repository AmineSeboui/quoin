import { toggleLinePrefix } from './line-toggles';

describe('toggleLinePrefix', () => {
  it('turns a plain line into a subtitle', () => {
    expect(toggleLinePrefix('h2', 'Getting started', 15, 15)).toEqual({
      value: '## Getting started',
      selectionStart: 18,
      selectionEnd: 18,
    });
  });

  it('turns a subtitle back into plain text', () => {
    expect(toggleLinePrefix('h2', '## Getting started', 18, 18)).toEqual({
      value: 'Getting started',
      selectionStart: 15,
      selectionEnd: 15,
    });
  });

  it('replaces one heading level with another', () => {
    expect(toggleLinePrefix('h2', '# a', 3, 3).value).toBe('## a');
    expect(toggleLinePrefix('h3', '## a', 4, 4).value).toBe('### a');
  });

  it('converts a bullet into a heading', () => {
    expect(toggleLinePrefix('h1', '- a', 3, 3).value).toBe('# a');
  });

  it('keeps the indentation of the line', () => {
    expect(toggleLinePrefix('h2', '  a', 3, 3).value).toBe('  ## a');
  });

  it('bullets every line in a selection', () => {
    expect(toggleLinePrefix('bullet', 'apples\noranges', 0, 14)).toEqual({
      value: '- apples\n- oranges',
      selectionStart: 0,
      selectionEnd: 18,
    });
  });

  it('numbers a selection in order', () => {
    expect(toggleLinePrefix('ordered', 'a\nb\nc', 0, 5).value).toBe('1. a\n2. b\n3. c');
  });

  it('toggles a list off when every line already carries the marker', () => {
    expect(toggleLinePrefix('bullet', '- a\n- b', 0, 7)).toEqual({
      value: 'a\nb',
      selectionStart: 0,
      selectionEnd: 3,
    });
  });

  it('turns a task list line into a plain line when bullets are toggled off', () => {
    expect(toggleLinePrefix('bullet', '- [ ] a', 0, 7).value).toBe('a');
  });

  it('leaves lines inside a fenced code block untouched', () => {
    const doc = '```\ncode\n```';
    expect(toggleLinePrefix('h2', doc, 0, doc.length).value).toBe(doc);
  });
});
