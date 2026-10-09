import { newBlockId } from './new-block-id';

describe('newBlockId', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns a different id on every call', () => {
    const ids = Array.from({ length: 500 }, () => newBlockId());
    expect(new Set(ids).size).toBe(500);
  });

  it('still returns distinct ids where crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {});
    const ids = Array.from({ length: 500 }, () => newBlockId());
    expect(new Set(ids).size).toBe(500);
  });

  it('still returns an id where there is no crypto at all', () => {
    vi.stubGlobal('crypto', undefined);
    expect(newBlockId()).toMatch(/^\S+$/);
  });
});
