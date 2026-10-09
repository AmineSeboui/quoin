'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { BlockEditor } from './BlockEditor';
import { renderedOffsetAt, sourceOffsetFor, type ClickProbe } from './source-offset';
import { useQuoin } from '../context';
import { blockByType } from '../registry';
import type { QuoinBlock } from '../types';
import { Button } from '../ui/button';

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"], [tabindex], iframe';

/** Radix renders Select, dropdown and popover content in a portal, so focus moving
 *  into one leaves this block's DOM subtree while the author is still editing it. */
const PORTALLED_OVERLAY = '[data-radix-popper-content-wrapper], [role="dialog"]';

// A drag-select ends in a click on mouseup; bailing here keeps that click from
// flipping the block into edit mode and wiping out the selection it just made.
function hasSelectionWithin(container: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;
  return container.contains(selection.getRangeAt(0).commonAncestorContainer);
}

function BlockCardImpl({
  block,
  index,
  editingByDefault = false,
  readOnly = false,
  initialSelection = null,
  onUpdate,
  onInsertBlock,
}: {
  block: QuoinBlock;
  index: number;
  editingByDefault?: boolean;
  /** Draws the block at rest and never opens an editor, for a canvas that is only being read. */
  readOnly?: boolean;
  initialSelection?: { start: number; end: number } | null;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onInsertBlock?: (index: number, type: string) => void;
}) {
  const { blockTypes } = useQuoin();
  const definition = blockByType(blockTypes, block.type);
  const Preview = definition?.preview;
  const [editing, setEditing] = React.useState(editingByDefault && !readOnly);
  const editButtonRef = React.useRef<HTMLButtonElement>(null);
  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const returnFocusOnClose = React.useRef(false);
  const clickedRef = React.useRef<ClickProbe | null>(null);
  const scrollTopRef = React.useRef<number | null>(null);

  const handleInsertBlock = React.useCallback(
    (type: string) => onInsertBlock?.(index + 1, type),
    [onInsertBlock, index],
  );

  const leaveEditing = React.useCallback(() => {
    returnFocusOnClose.current = true;
    setEditing(false);
  }, []);

  const settleRef = React.useRef<number | null>(null);

  const clearSettle = () => {
    if (settleRef.current === null) return;
    window.clearTimeout(settleRef.current);
    settleRef.current = null;
  };

  React.useEffect(() => clearSettle, []);

  function stillInside(node: Element | null): boolean {
    if (!node) return false;
    return Boolean(editorContainerRef.current?.contains(node)) || Boolean(node.closest(PORTALLED_OVERLAY));
  }

  // Editing ends when the author's attention goes elsewhere, so a block left
  // behind renders instead of stranding them on its markdown source. A pointer
  // event is read directly rather than through focus, which Radix moves around
  // asynchronously while an overlay or a freshly inserted block settles.
  React.useEffect(() => {
    if (!editing) return;
    function onPointerDown(e: PointerEvent) {
      if (stillInside(e.target as Element | null)) return;
      setEditing(false);
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [editing]);

  function closeIfTabbedAway() {
    clearSettle();
    settleRef.current = window.setTimeout(() => {
      settleRef.current = null;
      if (stillInside(document.activeElement)) return;
      setEditing(false);
    }, 0);
  }

  // Focus on the click path must not scroll: the caret is placed after focus, so the
  // browser would otherwise drag the viewport to wherever the box's selection starts
  // out, away from the line the author actually aimed at.
  React.useEffect(() => {
    if (!editing) return;
    const field = editorContainerRef.current?.querySelector<HTMLElement>(
      'textarea, input, [role="combobox"]',
    );
    if (!field) return;

    const clicked = clickedRef.current;
    clickedRef.current = null;

    if (clicked === null || !(field instanceof HTMLTextAreaElement)) {
      field.focus();
      if (field instanceof HTMLTextAreaElement) {
        const at = initialSelection ?? { start: field.value.length, end: field.value.length };
        field.setSelectionRange(at.start, at.end);
      }
      return;
    }

    const offset = sourceOffsetFor(field.value, clicked);
    field.focus({ preventScroll: true });
    field.setSelectionRange(offset, offset);
  }, [editing, initialSelection]);

  // Replacing a tall rendered block with a one-row textarea shrinks the page, so
  // the browser clamps the scroll before the box can grow back. The position is
  // taken at the click and put back here, after the box has been sized.
  React.useLayoutEffect(() => {
    const scrollTop = scrollTopRef.current;
    scrollTopRef.current = null;
    if (!editing || scrollTop === null) return;
    const scroller = document.scrollingElement ?? document.documentElement;
    if (scroller.scrollTop !== scrollTop) scroller.scrollTop = scrollTop;
  }, [editing]);

  React.useEffect(() => {
    if (editing || !returnFocusOnClose.current) return;
    returnFocusOnClose.current = false;
    editButtonRef.current?.focus();
  }, [editing]);

  if (definition?.alwaysEditing && !readOnly) {
    return (
      <BlockEditor
        type={block.type}
        data={block.data}
        onChange={(data) => onUpdate(block.id, data)}
        onInsertBlock={handleInsertBlock}
      />
    );
  }

  if (editing) {
    return (
      <div
        ref={editorContainerRef}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            closeIfTabbedAway();
            return;
          }
          if (e.key !== 'Escape') return;
          // Radix's DismissableLayer (Select, dropdowns, etc.) closes on a document
          // capture listener and never stops propagation, so this handler still
          // sees the Escape that already dismissed a nested overlay. Only collapse
          // when the key genuinely landed inside this editor's own DOM subtree, not
          // in a portalled overlay that merely propagates through the React tree.
          if (!editorContainerRef.current?.contains(e.target as Node)) return;
          returnFocusOnClose.current = true;
          setEditing(false);
        }}
      >
        <BlockEditor
          type={block.type}
          data={block.data}
          onChange={(data) => onUpdate(block.id, data)}
          onInsertBlock={handleInsertBlock}
          onDone={leaveEditing}
        />
      </div>
    );
  }

  const rest = Preview ? (
    <Preview data={block.data} blockId={block.id} />
  ) : definition ? (
    <p className="py-1 text-sm text-muted-foreground">{definition.label}</p>
  ) : null;

  if (readOnly) return <div>{rest}</div>;

  return (
    <div className="group/card relative">
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(INTERACTIVE_SELECTOR)) return;
          if (hasSelectionWithin(e.currentTarget)) return;
          clickedRef.current = {
            rendered: e.currentTarget.textContent ?? '',
            clickedText: target.textContent ?? '',
            renderedOffset: renderedOffsetAt(e.currentTarget, e.clientX, e.clientY),
          };
          scrollTopRef.current = (document.scrollingElement ?? document.documentElement).scrollTop;
          setEditing(true);
        }}
      >
        {rest}
      </div>
      <Button
        ref={editButtonRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit block ${index + 1}`}
        onClick={() => setEditing(true)}
        className="absolute right-0 top-0 bg-background/90 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100"
      >
        <Pencil aria-hidden="true" />
      </Button>
    </div>
  );
}

export const BlockCard = React.memo(BlockCardImpl);
