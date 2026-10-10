import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockCanvas } from './BlockCanvas';
import type { QuoinBlock } from '../types';

type User = ReturnType<typeof userEvent.setup>;

const blocks: QuoinBlock[] = [
  { id: 'a', type: 'MARKDOWN', data: { markdown: 'first' } },
  { id: 'b', type: 'MARKDOWN', data: { markdown: 'second' } },
];

async function deleteBlock(user: User, position: number) {
  await user.click(screen.getAllByRole('button', { name: new RegExp(`block ${position} options`, 'i') })[0]);
  await user.click(await screen.findByRole('menuitem', { name: `Delete block ${position}` }));
}

function Host({
  initial = blocks,
  onDelete,
}: {
  initial?: QuoinBlock[];
  onDelete?: (block: QuoinBlock, index: number) => void;
}) {
  const [current, setCurrent] = React.useState<QuoinBlock[]>(initial);
  const [removed, setRemoved] = React.useState<{ block: QuoinBlock; index: number } | null>(null);
  return (
    <>
      <button
        onClick={() => {
          if (!removed) return;
          const next = [...current];
          next.splice(removed.index, 0, removed.block);
          setCurrent(next);
          setRemoved(null);
        }}
      >
        restore
      </button>
      <BlockCanvas
        blocks={current}
        onChange={setCurrent}
        onDelete={(block, index) => {
          onDelete?.(block, index);
          setRemoved({ block, index });
        }}
      />
    </>
  );
}

describe('BlockCanvas onDelete', () => {
  it('hands the host the removed block and the index it occupied', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<BlockCanvas blocks={blocks} onChange={() => {}} onDelete={onDelete} />);
    await deleteBlock(user, 2);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(blocks[1], 1);
  });

  it('reports the new document through onChange before it reports the deletion', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(
      <BlockCanvas
        blocks={blocks}
        onChange={(next) => calls.push(`change:${next.length}`)}
        onDelete={(block) => calls.push(`delete:${block.id}`)}
      />,
    );
    await deleteBlock(user, 1);
    expect(calls).toEqual(['change:1', 'delete:a']);
  });

  it('is not called for an edit, a move or a mount', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<BlockCanvas blocks={blocks} onChange={() => {}} onDelete={onDelete} />);
    await user.click(screen.getByText('first'));
    await user.type(screen.getByLabelText('Markdown'), '!');
    await user.click(screen.getAllByRole('button', { name: /block 1 options/i })[0]);
    await user.click(await screen.findByRole('menuitem', { name: 'Move block 1 down' }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('is optional', async () => {
    const user = userEvent.setup();
    render(<BlockCanvas blocks={blocks} onChange={() => {}} />);
    await deleteBlock(user, 1);
    expect(screen.queryByText('first')).not.toBeInTheDocument();
  });

  it('restores the document when the host splices the block back at its index', async () => {
    const user = userEvent.setup();
    render(<Host />);
    await deleteBlock(user, 1);
    expect(screen.queryByText('first')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'restore' }));
    const texts = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(texts[0]).toContain('first');
    expect(texts[1]).toContain('second');
  });

  it('brings a freshly inserted block back at rest when the host restores it', async () => {
    const user = userEvent.setup();
    render(<Host initial={[]} />);
    await user.click(screen.getByRole('button', { name: /insert a block at the start/i }));
    await user.click(await screen.findByRole('menuitem', { name: 'Markdown' }));
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();
    await deleteBlock(user, 1);
    await user.click(screen.getByRole('button', { name: 'restore' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument();
  });
});
