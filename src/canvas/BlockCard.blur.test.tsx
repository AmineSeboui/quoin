import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockCard } from './BlockCard';
import { renderCanvas } from './render-canvas';
import { richBlocks } from './rich-blocks';
import type { QuoinBlock } from '../types';

const markdown: QuoinBlock = { id: 'a', type: 'MARKDOWN', data: { markdown: '## Why indexes' } };

function setup(block: QuoinBlock = markdown) {
  renderCanvas(
    <>
      <BlockCard block={block} index={0} editingByDefault onUpdate={vi.fn()} />
      <button type="button">Somewhere else</button>
    </>,
    richBlocks,
  );
  return userEvent.setup();
}

describe('leaving a block that is being edited', () => {
  it('renders the block once focus moves to something else on the page', async () => {
    const user = setup();
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Somewhere else' }));

    await waitFor(() => expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Why indexes' })).toBeInTheDocument();
  });

  it('renders the block when the click lands on nothing focusable', async () => {
    const user = setup();
    await user.click(document.body);
    await waitFor(() => expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument());
  });

  it('renders the block when the author tabs out of it', async () => {
    const user = setup();
    screen.getByLabelText('Markdown').focus();

    await user.tab();

    await waitFor(() => expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument());
  });

  it('does not steal focus back to the edit control when the author clicked elsewhere', async () => {
    const user = setup();
    const elsewhere = screen.getByRole('button', { name: 'Somewhere else' });

    await user.click(elsewhere);

    await waitFor(() => expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument());
    expect(elsewhere).toHaveFocus();
  });

  it('stays open while focus is still inside the block', async () => {
    const user = setup({ id: 'c', type: 'CALLOUT', data: { tone: 'info', body: 'hello' } });

    await user.click(screen.getByLabelText('Callout text'));

    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByLabelText('Callout text')).toBeInTheDocument();
  });

  // A Select inside the block portals its list outside the block's own DOM, so a
  // naive focus check would read that as the author leaving.
  it('stays open while a portalled control inside it has focus', async () => {
    const user = setup({ id: 'c', type: 'CALLOUT', data: { tone: 'info', body: 'hello' } });

    await user.click(screen.getByRole('combobox', { name: 'Callout tone' }));
    await screen.findByRole('option', { name: /tip/i });

    expect(screen.getByLabelText('Callout text')).toBeInTheDocument();
  });

  it('still closes on Escape, returning focus to the edit control', async () => {
    const user = setup();
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Edit block 1' })).toHaveFocus();
  });
});
