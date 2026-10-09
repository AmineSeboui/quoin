import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';

function renderBlock(index = 0) {
  render(
    <DndContext>
      <SortableContext items={['a']}>
        <SortableBlock id="a" index={index} actions={<button type="button">Options</button>}>
          <p>Block body</p>
        </SortableBlock>
      </SortableContext>
    </DndContext>,
  );
  return screen.getByRole('button', { name: `Reorder block ${index + 1}` }).parentElement!;
}

describe('SortableBlock', () => {
  it('names the drag handle by the block it moves', () => {
    renderBlock(2);
    expect(screen.getByRole('button', { name: 'Reorder block 3' })).toBeInTheDocument();
  });

  it('keeps the actions slot and the drag handle together in the gutter', () => {
    const gutter = renderBlock();
    expect(gutter).toContainElement(screen.getByRole('button', { name: 'Options' }));
    expect(gutter).toContainElement(screen.getByRole('button', { name: 'Reorder block 1' }));
  });

  // jsdom cannot measure this, so the breakpoint is pinned instead. The gutter is
  // ~70px and sits outside a 68ch column, so it only clears the window edge past
  // `lg`; at `sm` it rendered off-canvas on every window narrower than ~874px.
  it('moves the gutter out of the text column no earlier than lg', () => {
    const gutter = renderBlock();
    expect(gutter.className).toContain('lg:absolute');
    expect(gutter.className).not.toContain('sm:absolute');
    expect(gutter.className).not.toContain('md:absolute');
  });

  it('leaves the gutter visible at the widths where it stacks, since hover is not available there', () => {
    const gutter = renderBlock();
    expect(gutter.className).toContain('lg:opacity-0');
    expect(gutter.className).not.toMatch(/(?<!lg:)\bopacity-0\b/);
  });
});
