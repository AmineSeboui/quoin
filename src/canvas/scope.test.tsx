import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockCanvas } from './BlockCanvas';
import { ShortcutsReference } from '../markdown/ShortcutsReference';
import type { QuoinBlock } from '../types';

const blocks: QuoinBlock[] = [
  { id: 'a', type: 'MARKDOWN', data: { markdown: 'hello' } },
  { id: 'b', type: 'CALLOUT', data: { tone: 'info', body: 'note' } },
];

function carriesScope(element: Element | null) {
  expect(element).not.toBeNull();
  expect(element).toHaveClass('quoin');
}

describe('the quoin scope class', () => {
  it('is on the canvas root, alongside the host class', () => {
    const { container } = render(<BlockCanvas blocks={blocks} onChange={() => {}} className="host" />);
    expect(container.firstElementChild).toHaveClass('quoin', 'host');
  });

  it('is on the read-only canvas root', () => {
    const { container } = render(<BlockCanvas blocks={blocks} onChange={() => {}} readOnly />);
    expect(container.firstElementChild).toHaveClass('quoin');
  });

  it('is on the block actions menu, which renders outside the canvas root', async () => {
    const user = userEvent.setup();
    const { container } = render(<BlockCanvas blocks={blocks} onChange={() => {}} />);
    await user.click(screen.getAllByRole('button', { name: /block 1 options/i })[0]);
    const menu = await screen.findByRole('menu');
    expect(container.contains(menu)).toBe(false);
    carriesScope(menu);
  });

  it('is on the inserter menu', async () => {
    const user = userEvent.setup();
    render(<BlockCanvas blocks={blocks} onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: /insert a block at the start/i }));
    carriesScope(await screen.findByRole('menu'));
  });

  it('is on the slash palette', async () => {
    const user = userEvent.setup();
    render(<BlockCanvas blocks={blocks} onChange={() => {}} />);
    await user.click(screen.getByText('hello'));
    const box = screen.getByLabelText('Markdown') as HTMLTextAreaElement;
    box.setSelectionRange(0, 0);
    fireEvent.keyDown(box, { key: '/' });
    await screen.findByPlaceholderText(/search commands/i);
    carriesScope(document.body.querySelector('[data-slot="popover-content"]'));
  });

  it('is on the callout tone select', async () => {
    const user = userEvent.setup();
    render(<BlockCanvas blocks={blocks} onChange={() => {}} />);
    await user.click(screen.getByText('note'));
    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    carriesScope(document.body.querySelector('[data-slot="select-content"]'));
  });

  it('is on the dialog overlay and content', () => {
    render(<ShortcutsReference open onOpenChange={() => {}} />);
    carriesScope(document.body.querySelector('[data-slot="dialog-overlay"]'));
    carriesScope(document.body.querySelector('[data-slot="dialog-content"]'));
  });
});
