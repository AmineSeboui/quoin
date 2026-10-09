import { describe, it, expect } from 'vitest';
import { wrapSelection, continueList, shouldOpenPalette } from './headless';

describe('headless entry', () => {
  it('wraps a selection in bold markers', () => {
    const edit = wrapSelection('bold', 'hello world', 0, 5);
    expect(edit?.value).toBe('**hello** world');
  });

  it('continues a bullet list on Enter', () => {
    const edit = continueList('- one', 5, 'Enter');
    expect(edit?.value).toBe('- one\n- ');
  });

  it('opens the palette only at the start of an empty line', () => {
    expect(shouldOpenPalette('', 0, 0)).toBe(true);
    expect(shouldOpenPalette('text', 4, 4)).toBe(false);
  });
});
