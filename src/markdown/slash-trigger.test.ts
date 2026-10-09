import { describe, it, expect, vi } from 'vitest';
import { shouldOpenPalette } from './slash-trigger';

const at = (value: string, caret: number) => shouldOpenPalette(value, caret, caret);

describe('shouldOpenPalette', () => {
  it('opens in an empty box', () => {
    expect(at('', 0)).toBe(true);
  });

  it('opens at the start of a line', () => {
    expect(at('one\n', 4)).toBe(true);
  });

  it('opens after a space, so a command can start mid line', () => {
    expect(at('hello ', 6)).toBe(true);
  });

  it('opens after a tab', () => {
    expect(at('hello\t', 6)).toBe(true);
  });

  it('stays closed mid word, so and/or types literally', () => {
    expect(at('and', 3)).toBe(false);
  });

  it('stays closed after a non-space character', () => {
    expect(at('km', 2)).toBe(false);
  });

  it('stays closed when text is selected', () => {
    expect(shouldOpenPalette('hello world', 0, 5)).toBe(false);
  });

  it('stays closed inside a fenced code block, where a path is likelier than a command', () => {
    const doc = ['```sh', 'cd '].join('\n');
    expect(at(doc, doc.length)).toBe(false);
  });
});
