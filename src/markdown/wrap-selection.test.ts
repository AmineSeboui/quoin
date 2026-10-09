import { describe, it, expect, vi } from 'vitest';
import { linkPaste, wrapSelection } from './wrap-selection';

describe('wrapSelection', () => {
  it('wraps a selection in bold', () => {
    expect(wrapSelection('bold', 'important', 0, 9)).toEqual({
      value: '**important**',
      selectionStart: 2,
      selectionEnd: 11,
    });
  });

  it('unwraps when the delimiters are inside the selection', () => {
    expect(wrapSelection('bold', '**x**', 0, 5)).toEqual({
      value: 'x',
      selectionStart: 0,
      selectionEnd: 1,
    });
  });

  it('unwraps when the delimiters sit just outside the selection', () => {
    expect(wrapSelection('bold', '**x**', 2, 3)).toEqual({
      value: 'x',
      selectionStart: 0,
      selectionEnd: 1,
    });
  });

  it('uses an underscore for italic so it reads next to bold', () => {
    expect(wrapSelection('italic', 'x', 0, 1).value).toBe('_x_');
  });

  it('wraps inline code in backticks', () => {
    expect(wrapSelection('code', 'npm test', 0, 8).value).toBe('`npm test`');
  });

  it('uses a fence when a code selection spans lines', () => {
    expect(wrapSelection('code', 'a\nb', 0, 3)).toEqual({
      value: '```\na\nb\n```',
      selectionStart: 4,
      selectionEnd: 7,
    });
  });

  it('inserts the pair with the caret between it when nothing is selected', () => {
    expect(wrapSelection('bold', '', 0, 0)).toEqual({
      value: '****',
      selectionStart: 2,
      selectionEnd: 2,
    });
  });

  it('puts the caret in the url slot for a link over a selection', () => {
    expect(wrapSelection('link', 'the docs', 0, 8)).toEqual({
      value: '[the docs]()',
      selectionStart: 11,
      selectionEnd: 11,
    });
  });

  it('puts the caret in the text slot for a link with nothing selected', () => {
    expect(wrapSelection('link', '', 0, 0)).toEqual({
      value: '[]()',
      selectionStart: 1,
      selectionEnd: 1,
    });
  });

  it('unwraps a whole selected link back to its text', () => {
    expect(wrapSelection('link', '[a](b)', 0, 6)).toEqual({
      value: 'a',
      selectionStart: 0,
      selectionEnd: 1,
    });
  });

  it('leaves the surrounding text alone', () => {
    expect(wrapSelection('bold', 'a b c', 2, 3).value).toBe('a **b** c');
  });
});

describe('linkPaste', () => {
  it('turns a pasted url over a selection into a link', () => {
    expect(linkPaste('see docs', 4, 8, 'https://x.dev')).toEqual({
      value: 'see [docs](https://x.dev)',
      selectionStart: 25,
      selectionEnd: 25,
    });
  });

  it('trims whitespace around the pasted url', () => {
    expect(linkPaste('docs', 0, 4, '  https://x.dev\n')?.value).toBe('[docs](https://x.dev)');
  });

  it('returns null when nothing is selected', () => {
    expect(linkPaste('docs', 4, 4, 'https://x.dev')).toBeNull();
  });

  it('returns null when the clipboard is not a bare url', () => {
    expect(linkPaste('docs', 0, 4, 'see https://x.dev')).toBeNull();
    expect(linkPaste('docs', 0, 4, 'plain text')).toBeNull();
  });

  it('returns null for a multi line clipboard', () => {
    expect(linkPaste('docs', 0, 4, 'https://x.dev\nhttps://y.dev')).toBeNull();
  });
});
