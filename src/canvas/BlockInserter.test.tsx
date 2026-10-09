import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Hash } from 'lucide-react';
import { coreBlocks } from '../blocks/core';
import { defineBlock } from '../registry';
import { BlockInserter } from './BlockInserter';
import { renderCanvas } from '../../test/support/render-canvas';

describe('BlockInserter', () => {
  it('opens the block options and inserts at its own index', async () => {
    const onInsert = vi.fn();
    const user = userEvent.setup();
    renderCanvas(<BlockInserter index={2} onInsert={onInsert} label="Insert a block after block 2" />);

    await user.click(screen.getByRole('button', { name: 'Insert a block after block 2' }));
    await user.click(screen.getByRole('menuitem', { name: 'Callout' }));

    expect(onInsert).toHaveBeenCalledWith(2, 'CALLOUT');
  });

  it('offers every registered block type', async () => {
    const user = userEvent.setup();
    renderCanvas(<BlockInserter index={0} onInsert={vi.fn()} label="Insert a block at the start" />);

    await user.click(screen.getByRole('button', { name: 'Insert a block at the start' }));

    expect(screen.getAllByRole('menuitem')).toHaveLength(5);
    expect(screen.getByRole('menuitem', { name: 'Callout' })).toBeInTheDocument();
  });

  it('offers a host-registered type and inserts it by its own type string', async () => {
    const onInsert = vi.fn();
    const user = userEvent.setup();
    const poll = defineBlock({ type: 'POLL', label: 'Poll', icon: Hash, editor: () => null });
    renderCanvas(<BlockInserter index={1} onInsert={onInsert} label="Insert" />, [...coreBlocks, poll]);

    await user.click(screen.getByRole('button', { name: 'Insert' }));
    await user.click(screen.getByRole('menuitem', { name: 'Poll' }));

    expect(onInsert).toHaveBeenCalledWith(1, 'POLL');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderCanvas(
      <BlockInserter index={0} onInsert={vi.fn()} label="Insert a block at the start" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
