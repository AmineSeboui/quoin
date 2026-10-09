import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { QuoinProvider } from '../context';
import { coreBlocks } from '../blocks/core';
import { defineBlock } from '../registry';
import { Hash } from 'lucide-react';
import { BlockCard } from './BlockCard';
import { renderCanvas } from './render-canvas';
import { richBlocks } from './rich-blocks';
import type { QuoinBlock } from '../types';

const markdown: QuoinBlock = { id: 'a', type: 'MARKDOWN', data: { markdown: '## Why indexes' } };
const linked: QuoinBlock = { id: 'b', type: 'MARKDOWN', data: { markdown: '[jump](#section)' } };

function setup(block: QuoinBlock = markdown, editingByDefault = false, index = 0) {
  const onUpdate = vi.fn();
  const view = renderCanvas(
    <BlockCard block={block} index={index} editingByDefault={editingByDefault} onUpdate={onUpdate} />,
    richBlocks,
  );
  return { onUpdate, ...view };
}

describe('BlockCard', () => {
  it('renders the block at rest rather than a textarea', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Why indexes' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument();
  });

  it('enters edit mode from the explicit edit control via the keyboard', async () => {
    const user = userEvent.setup();
    setup();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Edit block 1' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();
  });

  it('enters edit mode when clicking the rendered body, as a pointer convenience', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('heading', { name: 'Why indexes' }));
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();
  });

  it('follows a link inside rendered markdown instead of entering edit mode', async () => {
    const user = userEvent.setup();
    setup(linked);

    await user.click(screen.getByRole('link', { name: 'jump' }));
    expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument();
  });

  it('leaves edit mode on Escape and returns focus to the edit control', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Edit block 1' }));
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit block 1' })).toHaveFocus();
  });

  it('names the edit control by position so same-type blocks stay distinguishable', () => {
    renderCanvas(
      <>
        <BlockCard block={markdown} index={0} onUpdate={vi.fn()} />
        <BlockCard block={{ id: 'c', type: 'MARKDOWN', data: { markdown: 'two' } }} index={1} onUpdate={vi.fn()} />
        <BlockCard block={{ id: 'd', type: 'MARKDOWN', data: { markdown: 'three' } }} index={2} onUpdate={vi.fn()} />
      </>,
      richBlocks,
    );
    expect(screen.getByRole('button', { name: 'Edit block 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit block 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit block 3' })).toBeInTheDocument();
  });

  it('opens straight into edit mode for a freshly inserted block', () => {
    setup({ id: 'n', type: 'MARKDOWN', data: {} }, true);
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();
  });

  it('keeps the block editor open when Escape only dismissed a nested Select', async () => {
    const user = userEvent.setup();
    setup({ id: 'c', type: 'CALLOUT', data: { tone: 'info', body: 'hello' } }, true);

    await user.click(screen.getByRole('combobox', { name: 'Callout tone' }));
    await screen.findByRole('option', { name: /tip/i });
    await user.keyboard('{Escape}');

    expect(screen.getByLabelText('Callout text')).toBeInTheDocument();
  });

  it('does not enter edit mode when a click completes a text selection', () => {
    setup();
    const heading = screen.getByRole('heading', { name: 'Why indexes' });

    const range = document.createRange();
    range.selectNodeContents(heading);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent.click(heading);

    expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument();
  });

  it('shows a named placeholder for an empty image block instead of collapsing to zero height', () => {
    setup({ id: 'i', type: 'IMAGE', data: { alt: '' } });
    expect(screen.getByText('No image added yet.')).toBeInTheDocument();
  });

  it('shows a named placeholder for an empty markdown block', () => {
    setup({ id: 'm', type: 'MARKDOWN', data: { markdown: '' } });
    expect(screen.getByText('This markdown block is empty.')).toBeInTheDocument();
  });

  it('re-enters editing from a click on the empty-block placeholder', async () => {
    const user = userEvent.setup();
    setup({ id: 'i', type: 'IMAGE', data: { alt: '' } });

    await user.click(screen.getByText('No image added yet.'));
    expect(screen.getByLabelText('Image alt text')).toBeInTheDocument();
  });

  it('draws a block at rest through the preview its type registers', () => {
    setup({ id: 'c', type: 'CALLOUT', data: { tone: 'info', body: 'Mind the gap' } });
    expect(screen.getByText('Mind the gap')).toBeInTheDocument();
  });

  it('draws a host-registered type through its own preview and ignores clicks on its controls', async () => {
    const user = userEvent.setup();
    const counter = defineBlock<Record<string, unknown>>({
      type: 'COUNTER',
      label: 'Counter',
      icon: Hash,
      editor: () => <textarea aria-label="Counter editor" />,
      preview: ({ data }) => (
        <button type="button">{`Count ${String(data.count)}`}</button>
      ),
    });
    renderCanvas(
      <BlockCard block={{ id: 'k', type: 'COUNTER', data: { count: 3 } }} index={0} onUpdate={vi.fn()} />,
      [...coreBlocks, counter],
    );

    await user.click(screen.getByRole('button', { name: 'Count 3' }));

    expect(screen.queryByLabelText('Counter editor')).not.toBeInTheDocument();
  });

  it('renders an empty card instead of crashing for a type no one registered', () => {
    const { container } = setup({ id: 'x', type: 'REMOVED', data: {} });
    expect(screen.getByRole('button', { name: 'Edit block 1' })).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders nothing while editing a type no one registered', () => {
    setup({ id: 'x', type: 'REMOVED', data: {} }, true);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('resolves an image storage key through the host before deciding the block is empty', () => {
    const resolveAssetUrl = vi.fn((key: string) => (key ? `https://cdn.test/${key}` : ''));
    render(
      <QuoinProvider value={{ blockTypes: coreBlocks, resolveAssetUrl }}>
        <BlockCard
          block={{ id: 'i', type: 'IMAGE', data: { storageKey: 'img/a.png', alt: 'A diagram' } }}
          index={0}
          onUpdate={vi.fn()}
        />
      </QuoinProvider>,
    );

    expect(resolveAssetUrl).toHaveBeenCalledWith('img/a.png');
    expect(screen.queryByText('No image added yet.')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'A diagram' })).toHaveAttribute('src', 'https://cdn.test/img/a.png');
  });

  it('is wrapped in React.memo so unrelated cards can skip re-rendering on every keystroke', () => {
    expect((BlockCard as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('has no accessibility violations at rest or while editing', async () => {
    const atRest = renderCanvas(<BlockCard block={markdown} index={0} onUpdate={vi.fn()} />, richBlocks);
    expect(await axe(atRest.container)).toHaveNoViolations();

    const editing = renderCanvas(
      <BlockCard block={markdown} index={0} editingByDefault onUpdate={vi.fn()} />,
      richBlocks,
    );
    expect(await axe(editing.container)).toHaveNoViolations();
  });
});
