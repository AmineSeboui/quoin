import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useBlockList } from './useBlockList';

const initial = [
  { id: 'a', type: 'MARKDOWN', data: { markdown: 'one' } },
  { id: 'b', type: 'CODE', data: { code: 'two' } },
];

describe('useBlockList', () => {
  it('inserts at an index rather than only appending', () => {
    const { result } = renderHook(() => useBlockList(initial));
    act(() => result.current.insertAt(0, 'CALLOUT'));
    expect(result.current.blocks.map((b) => b.type)).toEqual(['CALLOUT', 'MARKDOWN', 'CODE']);
  });

  it('appends when the index is the list length', () => {
    const { result } = renderHook(() => useBlockList(initial));
    act(() => result.current.insertAt(2, 'CALLOUT'));
    expect(result.current.blocks.map((b) => b.type)).toEqual(['MARKDOWN', 'CODE', 'CALLOUT']);
  });

  it('gives every inserted block a unique id', () => {
    const { result } = renderHook(() => useBlockList(initial));
    act(() => result.current.insertAt(0, 'CALLOUT'));
    act(() => result.current.insertAt(0, 'CALLOUT'));
    const ids = result.current.blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('restores a removed block at its original index', () => {
    const { result } = renderHook(() => useBlockList(initial));
    let token!: number;
    act(() => {
      token = result.current.remove('a');
    });
    expect(result.current.blocks.map((b) => b.id)).toEqual(['b']);
    act(() => result.current.undo(token));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('does nothing on undo when the token does not match a pending removal', () => {
    const { result } = renderHook(() => useBlockList(initial));
    act(() => result.current.undo(1));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('moves a block one slot and refuses to move past the ends', () => {
    const { result } = renderHook(() => useBlockList(initial));
    act(() => result.current.move(0, 1));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['b', 'a']);
    act(() => result.current.move(0, -1));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['b', 'a']);
  });

  it('reorders a block from one index to another', () => {
    const { result } = renderHook(() => useBlockList(initial));
    act(() => result.current.reorder(0, 1));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['b', 'a']);
  });

  it('does nothing on a second undo of the same token after the first already applied', () => {
    const { result } = renderHook(() => useBlockList(initial));
    let token!: number;
    act(() => {
      token = result.current.remove('a');
    });
    expect(result.current.blocks.map((b) => b.id)).toEqual(['b']);
    act(() => result.current.undo(token));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['a', 'b']);
    act(() => result.current.undo(token));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('undoing an earlier removal restores exactly that block and leaves a later removal untouched', () => {
    const threeBlocks = [
      { id: 'a', type: 'MARKDOWN', data: { markdown: 'one' } },
      { id: 'b', type: 'CODE', data: { code: 'two' } },
      { id: 'c', type: 'CALLOUT', data: { body: 'three' } },
    ];
    const { result } = renderHook(() => useBlockList(threeBlocks));
    let tokenA!: number;
    let tokenB!: number;
    act(() => {
      tokenA = result.current.remove('a');
    });
    act(() => {
      tokenB = result.current.remove('b');
    });
    expect(result.current.blocks.map((b) => b.id)).toEqual(['c']);

    act(() => result.current.undo(tokenA));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['a', 'c']);

    act(() => result.current.undo(tokenB));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['b', 'a', 'c']);
  });

  it('undo restores exactly one copy in StrictMode', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.StrictMode, null, children);
    const { result } = renderHook(() => useBlockList(initial), { wrapper });
    let token!: number;
    act(() => {
      token = result.current.remove('a');
    });
    expect(result.current.blocks.map((b) => b.id)).toEqual(['b']);
    act(() => result.current.undo(token));
    const ids = result.current.blocks.map((b) => b.id);
    expect(ids).toEqual(['a', 'b']);
    expect(ids.filter((id) => id === 'a').length).toBe(1);
  });

  it('remove then undo in one act restores exactly once', () => {
    const { result } = renderHook(() => useBlockList(initial));
    let token!: number;
    act(() => {
      token = result.current.remove('a');
      result.current.undo(token);
    });
    const ids = result.current.blocks.map((b) => b.id);
    expect(ids).toEqual(['a', 'b']);
    expect(ids.filter((id) => id === 'a').length).toBe(1);
  });

  it('undo twice in one act does not duplicate', () => {
    const { result } = renderHook(() => useBlockList(initial));
    let token!: number;
    act(() => {
      token = result.current.remove('a');
    });
    act(() => {
      result.current.undo(token);
      result.current.undo(token);
    });
    const ids = result.current.blocks.map((b) => b.id);
    expect(ids).toEqual(['a', 'b']);
    expect(ids.filter((id) => id === 'a').length).toBe(1);
  });

  it('replaces the whole list on reset', () => {
    const { result } = renderHook(() => useBlockList(initial));
    const next = [{ id: 'z', type: 'FILE', data: { filename: 'a.pdf' } }];
    act(() => result.current.reset(next));
    expect(result.current.blocks).toEqual(next);
  });

  it('does not resurrect a block removed from the previous document after a reset', () => {
    const { result } = renderHook(() => useBlockList(initial));
    let token!: number;
    act(() => {
      token = result.current.remove('a');
    });
    const next = [{ id: 'z', type: 'FILE', data: {} }];
    act(() => result.current.reset(next));

    act(() => result.current.undo(token));

    expect(result.current.blocks.map((b) => b.id)).toEqual(['z']);
  });

  it('keeps editing normally after a reset', () => {
    const { result } = renderHook(() => useBlockList(initial));
    act(() => result.current.reset([{ id: 'z', type: 'FILE', data: {} }]));
    let token!: number;
    act(() => {
      token = result.current.remove('z');
    });
    act(() => result.current.undo(token));
    expect(result.current.blocks.map((b) => b.id)).toEqual(['z']);
  });
});
