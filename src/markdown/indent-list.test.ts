import { indentList } from './indent-list';

const tab = (value: string, start: number, end = start) => indentList(value, start, end, 1);
const shiftTab = (value: string, start: number, end = start) => indentList(value, start, end, -1);

describe('indentList', () => {
  it('indents a bullet line by one level', () => {
    expect(tab('- a', 3)).toEqual({ value: '  - a', selectionStart: 5, selectionEnd: 5 });
  });

  it('indents an ordered item, a task and a quote too', () => {
    expect(tab('1. a', 4)?.value).toBe('  1. a');
    expect(tab('- [ ] a', 7)?.value).toBe('  - [ ] a');
    expect(tab('> a', 3)?.value).toBe('  > a');
  });

  it('allows one level under the line above', () => {
    expect(tab('- a\n- b', 7)).toEqual({
      value: '- a\n  - b',
      selectionStart: 9,
      selectionEnd: 9,
    });
  });

  it('refuses to indent more than one level past the line above', () => {
    expect(tab('- a\n  - b', 9)).toBeNull();
  });

  it('outdents a nested line', () => {
    expect(shiftTab('  - b', 5)).toEqual({ value: '- b', selectionStart: 3, selectionEnd: 3 });
  });

  it('returns null when there is nothing left to outdent', () => {
    expect(shiftTab('- b', 3)).toBeNull();
  });

  it('returns null on a plain paragraph, so Tab still moves focus', () => {
    expect(tab('hello', 5)).toBeNull();
  });

  it('returns null inside a fenced code block', () => {
    const doc = '```\n- a';
    expect(tab(doc, doc.length)).toBeNull();
  });

  it('indents every line in a selection', () => {
    expect(tab('- a\n- b', 0, 7)).toEqual({
      value: '  - a\n  - b',
      selectionStart: 2,
      selectionEnd: 11,
    });
  });

  it('returns null when any selected line is not a list item', () => {
    expect(tab('- a\nplain', 0, 9)).toBeNull();
  });
});
