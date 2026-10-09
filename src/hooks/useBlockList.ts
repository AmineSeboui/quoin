import * as React from 'react';
import type { QuoinBlock } from '../types';
import { newBlockId } from './new-block-id';

/** Handed back by `remove` and accepted by `undo` to restore that one block. */
export type UndoToken = number;

type Removed = { block: QuoinBlock; index: number };

type State = {
  blocks: QuoinBlock[];
  removals: Map<UndoToken, Removed>;
};

type Action =
  | { type: 'insertAt'; index: number; block: QuoinBlock }
  | { type: 'update'; id: string; data: Record<string, unknown> }
  | { type: 'remove'; id: string; token: UndoToken }
  | { type: 'undo'; token: UndoToken }
  | { type: 'move'; index: number; dir: -1 | 1 }
  | { type: 'reorder'; from: number; to: number }
  | { type: 'reset'; blocks: QuoinBlock[] };

let removalSeq = 0;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'insertAt': {
      const next = [...state.blocks];
      next.splice(Math.max(0, Math.min(action.index, state.blocks.length)), 0, action.block);
      return { ...state, blocks: next };
    }
    case 'update': {
      return {
        ...state,
        blocks: state.blocks.map((b) => (b.id === action.id ? { ...b, data: action.data } : b)),
      };
    }
    case 'remove': {
      const index = state.blocks.findIndex((b) => b.id === action.id);
      if (index === -1) return state;
      const removals = new Map(state.removals);
      removals.set(action.token, { block: state.blocks[index], index });
      return { blocks: state.blocks.filter((b) => b.id !== action.id), removals };
    }
    case 'undo': {
      const removal = state.removals.get(action.token);
      if (!removal) return state;
      const next = [...state.blocks];
      next.splice(Math.min(removal.index, state.blocks.length), 0, removal.block);
      const removals = new Map(state.removals);
      removals.delete(action.token);
      return { blocks: next, removals };
    }
    case 'move': {
      const j = action.index + action.dir;
      if (j < 0 || j >= state.blocks.length) return state;
      const next = [...state.blocks];
      [next[action.index], next[j]] = [next[j], next[action.index]];
      return { ...state, blocks: next };
    }
    case 'reorder': {
      const { from, to } = action;
      if (from < 0 || to < 0 || from >= state.blocks.length || to >= state.blocks.length) return state;
      const next = [...state.blocks];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...state, blocks: next };
    }
    case 'reset':
      return { blocks: action.blocks, removals: new Map() };
  }
}

/** The document plus every way to change it; `reset` replaces the whole document and voids outstanding undo tokens. */
export type BlockList = {
  blocks: QuoinBlock[];
  insertAt: (index: number, type: string, data?: Record<string, unknown>) => string;
  update: (id: string, data: Record<string, unknown>) => void;
  remove: (id: string) => UndoToken;
  undo: (token: UndoToken) => void;
  move: (index: number, dir: -1 | 1) => void;
  reorder: (from: number, to: number) => void;
  reset: (blocks: QuoinBlock[]) => void;
};

/** Holds a document in a reducer and returns its blocks with insert, update, remove, undo, move, reorder and reset. Reads `initial` once. */
export function useBlockList(initial: QuoinBlock[]): BlockList {
  const [state, dispatch] = React.useReducer(reducer, { blocks: initial, removals: new Map() });

  const insertAt = React.useCallback(
    (index: number, type: string, data: Record<string, unknown> = {}): string => {
      const id = newBlockId();
      dispatch({ type: 'insertAt', index, block: { id, type, data } });
      return id;
    },
    [],
  );

  const update = React.useCallback((id: string, data: Record<string, unknown>) => {
    dispatch({ type: 'update', id, data });
  }, []);

  const remove = React.useCallback((id: string): UndoToken => {
    removalSeq += 1;
    const token = removalSeq;
    dispatch({ type: 'remove', id, token });
    return token;
  }, []);

  const undo = React.useCallback((token: UndoToken) => {
    dispatch({ type: 'undo', token });
  }, []);

  const move = React.useCallback((index: number, dir: -1 | 1) => {
    dispatch({ type: 'move', index, dir });
  }, []);

  const reorder = React.useCallback((from: number, to: number) => {
    dispatch({ type: 'reorder', from, to });
  }, []);

  const reset = React.useCallback((blocks: QuoinBlock[]) => {
    dispatch({ type: 'reset', blocks });
  }, []);

  return { blocks: state.blocks, insertAt, update, remove, undo, move, reorder, reset };
}
