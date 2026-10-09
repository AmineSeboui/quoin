import { reorderIndices } from './reorder-indices';

const ids = ['a', 'b', 'c'];

describe('reorderIndices', () => {
  it('maps a forward move to its from and to indices', () => {
    expect(reorderIndices(ids, 'a', 'c')).toEqual({ from: 0, to: 2 });
  });

  it('maps a backward move to its from and to indices', () => {
    expect(reorderIndices(ids, 'c', 'a')).toEqual({ from: 2, to: 0 });
  });

  it('returns null when there is no drop target', () => {
    expect(reorderIndices(ids, 'a', null)).toBeNull();
  });

  it('returns null when the active and over ids are the same', () => {
    expect(reorderIndices(ids, 'b', 'b')).toBeNull();
  });

  it('returns null when an id is not present in the list', () => {
    expect(reorderIndices(ids, 'a', 'missing')).toBeNull();
    expect(reorderIndices(ids, 'missing', 'a')).toBeNull();
  });
});
