import { describe, it, expect, vi } from 'vitest';
import { insideFence, isFenceDelimiter, lineAt } from './line-at';

describe('lineAt', () => {
  it('returns the whole value when there is one line', () => {
    expect(lineAt('hello', 3)).toEqual({ start: 0, end: 5, text: 'hello' });
  });

  it('finds the line an offset sits in', () => {
    expect(lineAt('one\ntwo\nthree', 5)).toEqual({ start: 4, end: 7, text: 'two' });
  });

  it('treats an offset at a line start as that line, not the one before', () => {
    expect(lineAt('one\ntwo', 4)).toEqual({ start: 4, end: 7, text: 'two' });
  });

  it('treats an offset at a line end as that line, not the next one', () => {
    expect(lineAt('one\ntwo', 3)).toEqual({ start: 0, end: 3, text: 'one' });
  });

  it('handles offset zero', () => {
    expect(lineAt('one\ntwo', 0)).toEqual({ start: 0, end: 3, text: 'one' });
  });

  it('handles an empty line between two lines', () => {
    expect(lineAt('one\n\ntwo', 4)).toEqual({ start: 4, end: 4, text: '' });
  });
});

describe('insideFence', () => {
  const doc = ['text', '```ts', 'const x = 1;', '```', 'after'].join('\n');

  it('is false before any fence', () => {
    expect(insideFence(doc, 2)).toBe(false);
  });

  it('is true on the opening delimiter line', () => {
    expect(insideFence(doc, doc.indexOf('```ts') + 5)).toBe(true);
  });

  it('is true inside the fence body', () => {
    expect(insideFence(doc, doc.indexOf('const') + 3)).toBe(true);
  });

  it('is true on the closing delimiter line', () => {
    expect(insideFence(doc, doc.lastIndexOf('```') + 3)).toBe(true);
  });

  it('is false after the fence closes', () => {
    expect(insideFence(doc, doc.indexOf('after') + 2)).toBe(false);
  });

  it('treats an unclosed fence as open to the end', () => {
    const open = ['```', 'still code'].join('\n');
    expect(insideFence(open, open.length)).toBe(true);
  });

  it('recognises a tilde fence and an indented delimiter', () => {
    const tilde = ['  ~~~', 'code'].join('\n');
    expect(insideFence(tilde, tilde.length)).toBe(true);
  });

  it('does not treat inline backticks as a fence', () => {
    const inline = 'a `code` span';
    expect(insideFence(inline, inline.length)).toBe(false);
  });
});

describe('isFenceDelimiter', () => {
  it('recognises a backtick fence', () => {
    expect(isFenceDelimiter('```')).toBe(true);
  });

  it('recognises a tilde fence', () => {
    expect(isFenceDelimiter('~~~')).toBe(true);
  });

  it('accepts up to three leading spaces', () => {
    expect(isFenceDelimiter('   ```')).toBe(true);
    expect(isFenceDelimiter('  ~~~')).toBe(true);
  });

  it('rejects four or more leading spaces', () => {
    expect(isFenceDelimiter('    ```')).toBe(false);
  });

  it('does not treat inline backticks as a delimiter', () => {
    expect(isFenceDelimiter('a `code` span')).toBe(false);
  });

  it('rejects ordinary lines', () => {
    expect(isFenceDelimiter('plain text')).toBe(false);
  });
});
