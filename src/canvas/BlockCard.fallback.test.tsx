import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Hash } from 'lucide-react';
import { coreBlocks } from '../blocks/core';
import { defineBlock } from '../registry';
import { BlockCard } from './BlockCard';
import { QuoinProvider } from '../context';
import { renderCanvas } from '../../test/support/render-canvas';
import type { QuoinBlock } from '../types';

const chart = defineBlock({
  type: 'CHART',
  label: 'Chart',
  icon: Hash,
  editor: () => <div>chart editor</div>,
});
const alwaysOn = defineBlock({
  type: 'LIVE',
  label: 'Live',
  icon: Hash,
  editor: () => <div>live editor</div>,
  alwaysEditing: true,
});
const types = [...coreBlocks, chart, alwaysOn];
const block = { id: 'c', type: 'CHART', data: {} };

describe('BlockCard for a definition with no preview', () => {
  it('shows the definition label so there is something to see and click', () => {
    renderCanvas(<BlockCard block={block} index={0} onUpdate={vi.fn()} />, types);
    expect(screen.getByText('Chart')).toBeInTheDocument();
  });

  it('opens the editor when the label is clicked', async () => {
    const user = userEvent.setup();
    renderCanvas(<BlockCard block={block} index={0} onUpdate={vi.fn()} />, types);
    await user.click(screen.getByText('Chart'));
    expect(screen.getByText('chart editor')).toBeInTheDocument();
  });

  it('shows no placeholder while the block is editing', () => {
    renderCanvas(<BlockCard block={block} index={0} editingByDefault onUpdate={vi.fn()} />, types);
    expect(screen.queryByText('Chart')).not.toBeInTheDocument();
  });

  it('shows no placeholder for an always-editing block', () => {
    renderCanvas(
      <BlockCard block={{ id: 'l', type: 'LIVE', data: {} }} index={0} onUpdate={vi.fn()} />,
      types,
    );
    expect(screen.getByText('live editor')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderCanvas(<BlockCard block={block} index={0} onUpdate={vi.fn()} />, types);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('BlockCard for a type no definition claims', () => {
  const orphan: QuoinBlock = { id: 'o', type: 'BOOKMARK', data: { url: 'https://example.com' } };

  const onError = vi.fn();
  const card = (shown: QuoinBlock, index: number, readOnly = false) => (
    <QuoinProvider value={{ blockTypes: types, onError }}>
      <BlockCard block={shown} index={index} readOnly={readOnly} onUpdate={vi.fn()} />
    </QuoinProvider>
  );

  beforeEach(() => onError.mockClear());

  it('draws the raw type so the row is not silently empty', () => {
    render(card(orphan, 0));
    expect(screen.getByText('BOOKMARK')).toBeInTheDocument();
  });

  it('draws it in read-only mode too', () => {
    render(card(orphan, 0, true));
    expect(screen.getByText('BOOKMARK')).toBeInTheDocument();
  });

  it('tells the host once, naming the type', () => {
    const { rerender } = render(card(orphan, 0));
    rerender(card(orphan, 1));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toContain('BOOKMARK');
  });

  it('says nothing about a type that is registered', () => {
    render(card(block, 0));
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('BlockCard readOnly', () => {
  it('never opens an editor and offers no edit control', async () => {
    const user = userEvent.setup();
    renderCanvas(<BlockCard block={block} index={0} readOnly onUpdate={vi.fn()} />, types);
    await user.click(screen.getByText('Chart'));
    expect(screen.queryByText('chart editor')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit block/i })).not.toBeInTheDocument();
  });

  it('draws an always-editing block at rest instead of its editor', () => {
    renderCanvas(
      <BlockCard block={{ id: 'l', type: 'LIVE', data: {} }} index={0} readOnly onUpdate={vi.fn()} />,
      types,
    );
    expect(screen.queryByText('live editor')).not.toBeInTheDocument();
  });

  it('ignores editingByDefault', () => {
    renderCanvas(<BlockCard block={block} index={0} readOnly editingByDefault onUpdate={vi.fn()} />, types);
    expect(screen.queryByText('chart editor')).not.toBeInTheDocument();
  });
});
