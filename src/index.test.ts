import * as headless from './headless';
import * as main from './index';

describe('the main entry', () => {
  it('re-exports every headless name, as the documentation promises', () => {
    const missing = Object.keys(headless).filter((name) => !(name in main));
    expect(missing).toEqual([]);
  });

  it('re-exports them as the same implementations, not copies', () => {
    expect(main.wrapSelection).toBe(headless.wrapSelection);
    expect(main.toggleLinePrefix).toBe(headless.toggleLinePrefix);
    expect(main.useMarkdownKeymap).toBe(headless.useMarkdownKeymap);
    expect(main.useAutoGrow).toBe(headless.useAutoGrow);
  });

  it('still exports the editor surface alongside them', () => {
    expect(main.BlockCanvas).toBeTypeOf('function');
    expect(main.coreBlocks.length).toBeGreaterThan(0);
  });
});
