'use client';

import * as React from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { QuoinProvider } from '../context';
import { blockByType, type AnyBlockDefinition } from '../registry';
import { coreBlocks } from '../blocks/core';
import type { QuoinBlock, UploadFn } from '../types';
import { useBlockList } from '../hooks/useBlockList';
import { cn } from '../ui/cn';
import { buildAnnouncements } from './announcements';
import { BlockActionsMenu } from './BlockActionsMenu';
import { BlockCard } from './BlockCard';
import { BlockInserter } from './BlockInserter';
import { DocumentStarter } from './DocumentStarter';
import { ReadOnlyCanvas } from './ReadOnlyCanvas';
import { reorderIndices } from './reorder-indices';
import { sameBlocks } from './same-blocks';
import { SortableBlock } from './SortableBlock';
import { remember } from './unacknowledged';

/** Props for `BlockCanvas`; `blocks` and `onChange` are the whole document contract. */
export type BlockCanvasProps = {
  /**
   * The document. Update it synchronously from `onChange`, as with a controlled `<input value onChange>`.
   * Applying the edit late is tolerated as long as what comes back is one of the arrays the canvas emitted:
   * it recognises its own output even several keystrokes behind, so a transition or a debounced setter is safe.
   * A store that rebuilds the document on the way through hands back a structural copy instead, which arrives
   * behind the canvas's own state and reads as a foreign document. That does not revert the edit cleanly: the
   * characters the copy predates are dropped and the ones typed after them are kept.
   * A new array that differs from the last one you supplied replaces what the canvas shows, which is how a host
   * loads, undoes or merges. An array structurally equal to the last one you supplied is ignored, so a "discard
   * changes" button that hands back the original document does nothing; remount the canvas with a React `key` to
   * force a reset. The comparison is shallow over each block's `data`: a host whose block `data` holds nested
   * objects rebuilt on every render, and which does not echo `onChange` back, can still lose an edit. The core
   * block types all have flat data, so this only affects custom blocks.
   */
  blocks: QuoinBlock[];
  onChange: (blocks: QuoinBlock[]) => void;
  /**
   * Called when a block is removed through its actions menu, with the block and the index it held.
   * It runs just after the `onChange` that reports the document without it, so a host acting on the
   * deletion is already looking at the new array. Restore the block by supplying a `blocks` array
   * with it spliced back at that index, the same way any other document arrives.
   *
   * Restore it on a later tick or a later interaction, such as the click of an Undo toast. A
   * restore applied synchronously inside this callback batches with the echo of the deletion, so
   * what arrives is structurally equal to the document last supplied and is ignored.
   */
  onDelete?: (block: QuoinBlock, index: number) => void;
  /** Defaults to the five core block types. Pass `[...coreBlocks, yours]` to extend them. */
  blockTypes?: AnyBlockDefinition[];
  upload?: UploadFn;
  resolveAssetUrl?: (storageKey: string) => string;
  onError?: (error: Error) => void;
  /** Renders the document with no inserters, menus, drag handles or editors. */
  readOnly?: boolean;
  /** Added to the root element's own classes rather than replacing them. */
  className?: string;
  id?: string;
  /** Names the document for assistive technology; the root then becomes a labelled group. */
  'aria-label'?: string;
};

type Selection = { start: number; end: number };

function Canvas({
  blocks,
  onChange,
  onDelete,
  blockTypes,
  readOnly,
  className,
  id,
  'aria-label': ariaLabel,
}: Pick<
  BlockCanvasProps,
  'blocks' | 'onChange' | 'onDelete' | 'readOnly' | 'className' | 'id' | 'aria-label'
> & {
  blockTypes: AnyBlockDefinition[];
}) {
  const list = useBlockList(blocks);
  const { insertAt, update, remove, move, reorder, reset } = list;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dndId = React.useId();
  const [newBlockId, setNewBlockId] = React.useState<string | null>(null);
  const [seedSelection, setSeedSelection] = React.useState<Selection | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const pendingDeleteIndexRef = React.useRef<number | null>(null);
  const removedRef = React.useRef<{ block: QuoinBlock; index: number } | null>(null);
  const announcements = React.useMemo(
    () => buildAnnouncements(list.blocks, blockTypes),
    [list.blocks, blockTypes],
  );

  // The reducer reads `blocks` once, so the two effects below carry the document
  // across the boundary in both directions. An array this canvas emitted is
  // recognised when the host hands it back and is not reset; an array the host
  // supplies is foreign and is. Seeding the refs with the first `blocks` keeps
  // mounting from reporting a change nobody made.
  const lastEmitted = React.useRef<QuoinBlock[]>(blocks);
  const lastSupplied = React.useRef<QuoinBlock[]>(blocks);
  // Every emission still waiting to come back, not just the newest: a host that applies
  // edits late hands back an array from several keystrokes ago, and recognising only the
  // newest would read that as a foreign document and overwrite live text with it.
  const unacknowledged = React.useRef<Set<QuoinBlock[]>>(new Set());

  React.useEffect(() => {
    if (list.blocks === lastEmitted.current) return;
    lastEmitted.current = list.blocks;
    remember(unacknowledged.current, list.blocks);
    onChange(list.blocks);
    const removed = removedRef.current;
    removedRef.current = null;
    if (removed) onDelete?.(removed.block, removed.index);
  }, [list.blocks, onChange, onDelete]);

  React.useEffect(() => {
    const previous = lastSupplied.current;
    lastSupplied.current = blocks;
    if (unacknowledged.current.has(blocks)) {
      // Caught up: anything older than this emission has been echoed or coalesced away.
      // Everything before then is forgotten, so a host replaying one of these arrays from
      // its own undo stack later is a document the canvas accepts rather than ignores.
      if (blocks === lastEmitted.current) unacknowledged.current.clear();
      return;
    }
    // A host that builds a fresh array on every render, without echoing edits, would
    // otherwise wipe them on any unrelated re-render. An undo replays a different array.
    // The cost of the `previous` half is that a restore applied synchronously inside
    // `onDelete` batches with the echo, arrives structurally equal to the last document
    // supplied, and is read as one of those re-renders. That is why `onDelete` documents
    // restoring on a later tick. Dropping this comparison to accept the synchronous case
    // would hand back the edit-wiping bug, which is the worse of the two.
    if (sameBlocks(blocks, previous) || sameBlocks(blocks, list.blocks)) return;
    unacknowledged.current.clear();
    lastEmitted.current = blocks;
    reset(blocks);
  }, [blocks, reset]);

  const insertPlain = React.useCallback(
    (index: number, type: string, data?: Record<string, unknown>) => {
      setSeedSelection(null);
      const seed = data ?? blockByType(blockTypes, type)?.initialData?.() ?? {};
      setNewBlockId(insertAt(index, type, seed));
    },
    [insertAt, blockTypes],
  );

  function handleDelete(index: number, id: string) {
    const block = list.blocks[index];
    pendingDeleteIndexRef.current = index;
    if (block) removedRef.current = { block, index };
    // Otherwise a block inserted, deleted and then restored by the host would come
    // back in edit mode and take the focus from whatever the person is doing.
    setNewBlockId((current) => (current === id ? null : current));
    remove(id);
  }

  React.useEffect(() => {
    const index = pendingDeleteIndexRef.current;
    pendingDeleteIndexRef.current = null;
    if (index === null || !listRef.current) return;
    const landingIndex = Math.min(index, list.blocks.length - 1);
    const card =
      landingIndex >= 0 ? listRef.current.querySelector<HTMLElement>(`[data-block-index="${landingIndex}"]`) : null;
    (card?.querySelector<HTMLElement>('button') ?? listRef.current.querySelector<HTMLElement>('button'))?.focus();
  }, [list.blocks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const result = reorderIndices(
      list.blocks.map((b) => b.id),
      String(active.id),
      over ? String(over.id) : null,
    );
    if (result) reorder(result.from, result.to);
  }

  const rootProps = {
    ref: listRef,
    id,
    className: cn('quoin flex flex-col', className),
    role: ariaLabel ? 'group' : undefined,
    'aria-label': ariaLabel,
  };

  if (readOnly) return <ReadOnlyCanvas blocks={list.blocks} onUpdate={update} root={rootProps} />;

  return (
    <div {...rootProps}>
      <BlockInserter index={0} onInsert={insertPlain} label="Insert a block at the start" />
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        accessibility={{ announcements }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={list.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col">
            {list.blocks.map((b, i) => (
              <li key={b.id}>
                <SortableBlock
                  id={b.id}
                  index={i}
                  actions={
                    <BlockActionsMenu
                      index={i}
                      count={list.blocks.length}
                      label={blockByType(blockTypes, b.type)?.label ?? b.type}
                      onMove={move}
                      onDelete={() => handleDelete(i, b.id)}
                    />
                  }
                >
                  <BlockCard
                    block={b}
                    index={i}
                    editingByDefault={b.id === newBlockId}
                    initialSelection={b.id === newBlockId ? seedSelection : null}
                    onUpdate={update}
                    onInsertBlock={insertPlain}
                  />
                </SortableBlock>
                <BlockInserter
                  index={i + 1}
                  onInsert={insertPlain}
                  label={`Insert a block after block ${i + 1}`}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <DocumentStarter
        autoFocus={list.blocks.length === 0}
        onStart={(markdown, selection) => {
          setSeedSelection(selection ?? null);
          setNewBlockId(insertAt(list.blocks.length, 'MARKDOWN', { markdown }));
        }}
        onInsertBlock={(type) => insertPlain(list.blocks.length, type)}
      />
    </div>
  );
}

/** The editor: renders `blocks`, reports every edit through `onChange`, and accepts a new `blocks` array from outside at any time. */
export function BlockCanvas({
  blocks,
  onChange,
  onDelete,
  blockTypes = coreBlocks,
  upload,
  resolveAssetUrl,
  onError,
  readOnly = false,
  className,
  id,
  'aria-label': ariaLabel,
}: BlockCanvasProps) {
  const config = React.useMemo(
    () => ({ blockTypes, upload, resolveAssetUrl, onError }),
    [blockTypes, upload, resolveAssetUrl, onError],
  );
  return (
    <QuoinProvider value={config}>
      <Canvas
        blocks={blocks}
        onChange={onChange}
        onDelete={onDelete}
        blockTypes={blockTypes}
        readOnly={readOnly}
        className={className}
        id={id}
        aria-label={ariaLabel}
      />
    </QuoinProvider>
  );
}
