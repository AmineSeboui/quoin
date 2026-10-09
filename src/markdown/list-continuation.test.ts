import { describe, it, expect, vi } from 'vitest';
import { continueList } from './list-continuation';

const enter = (value: string, caret: number) => continueList(value, caret, 'Enter');
const backspace = (value: string, caret: number) => continueList(value, caret, 'Backspace');

describe('continueList on Enter', () => {
  it('continues a bullet list', () => {
    expect(enter('- first', 7)).toEqual({
      value: '- first\n- ',
      selectionStart: 10,
      selectionEnd: 10,
    });
  });

  it('continues a nested bullet at the same indent', () => {
    expect(enter('  - a', 5)).toEqual({ value: '  - a\n  - ', selectionStart: 10, selectionEnd: 10 });
  });

  it('increments an ordered list and keeps its delimiter', () => {
    expect(enter('1. one', 6)?.value).toBe('1. one\n2. ');
    expect(enter('3) x', 4)?.value).toBe('3) x\n4) ');
  });

  it('never carries a ticked task forward', () => {
    expect(enter('- [x] done', 10)?.value).toBe('- [x] done\n- [ ] ');
  });

  it('continues a quote', () => {
    expect(enter('> a', 3)?.value).toBe('> a\n> ');
  });

  it('keeps the lines that follow the caret', () => {
    expect(enter('- a\n- b', 3)).toEqual({
      value: '- a\n- \n- b',
      selectionStart: 6,
      selectionEnd: 6,
    });
  });

  it('outdents a dead nested item rather than adding a marker', () => {
    expect(enter('- a\n  - ', 8)).toEqual({ value: '- a\n- ', selectionStart: 6, selectionEnd: 6 });
  });

  it('strips a dead top level marker, leaving a blank line', () => {
    expect(enter('- a\n- ', 6)).toEqual({ value: '- a\n\n', selectionStart: 5, selectionEnd: 5 });
  });

  it('returns null on a plain line', () => {
    expect(enter('hello', 5)).toBeNull();
  });

  it('returns null inside a fenced code block', () => {
    const doc = '```\n- a';
    expect(enter(doc, doc.length)).toBeNull();
  });
});

describe('continueList on Backspace', () => {
  it('removes the marker when the caret is at the start of the content', () => {
    expect(backspace('- hello', 2)).toEqual({ value: 'hello', selectionStart: 0, selectionEnd: 0 });
  });

  it('removes a task marker', () => {
    expect(backspace('- [ ] a', 6)?.value).toBe('a');
  });

  it('leaves a blank line when stripping a marker after another list item', () => {
    expect(backspace('- a\n- hello', 6)).toEqual({
      value: '- a\n\nhello',
      selectionStart: 5,
      selectionEnd: 5,
    });
  });

  it('outdents a nested item instead of removing its marker', () => {
    expect(backspace('  - hello', 4)).toEqual({
      value: '- hello',
      selectionStart: 2,
      selectionEnd: 2,
    });
  });

  it('returns null when the caret is inside the content', () => {
    expect(backspace('- hello', 4)).toBeNull();
  });

  it('returns null on a plain line', () => {
    expect(backspace('hello', 0)).toBeNull();
  });
});
