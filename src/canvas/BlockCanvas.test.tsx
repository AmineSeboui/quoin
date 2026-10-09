import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { BlockCanvas } from './BlockCanvas';
import { coreBlocks } from '../blocks/core';
import type { QuoinBlock } from '../types';

const blocks: QuoinBlock[] = [{ id: 'a', type: 'MARKDOWN', data: { markdown: '# Title' } }];

describe('BlockCanvas', () => {
  it('renders each block in order', () => {
    const two: QuoinBlock[] = [...blocks, { id: 'b', type: 'CODE', data: { code: 'x = 1' } }];
    render(<BlockCanvas blocks={two} onChange={() => {}} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('reports an edited block back through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BlockCanvas blocks={blocks} onChange={onChange} />);
    await user.click(screen.getByText('# Title'));
    await user.type(screen.getByLabelText('Markdown'), '!');
    expect(onChange).toHaveBeenCalled();
  });

  it('does not report a change on mount', () => {
    const onChange = vi.fn();
    render(<BlockCanvas blocks={blocks} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('defaults to the core block types', async () => {
    const user = userEvent.setup();
    render(<BlockCanvas blocks={[]} onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: /insert a block at the start/i }));
    expect(await screen.findByText('Markdown')).toBeInTheDocument();
  });

  it('seeds a new block from its definition', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const seeded = {
      type: 'SEEDED',
      label: 'Seeded',
      icon: (() => null) as never,
      editor: () => <div>seeded editor</div>,
      initialData: () => ({ count: 3 }),
    };
    render(<BlockCanvas blocks={[]} onChange={onChange} blockTypes={[seeded]} />);
    await user.click(screen.getByRole('button', { name: /insert a block at the start/i }));
    await user.click(await screen.findByText('Seeded'));
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ type: 'SEEDED', data: { count: 3 } })]);
  });

  it('renders a host-registered block type', () => {
    const chart = {
      type: 'CHART',
      label: 'Chart',
      icon: (() => null) as never,
      editor: () => <div>chart editor</div>,
    };
    render(
      <BlockCanvas
        blocks={[{ id: 'c', type: 'CHART', data: {} }]}
        onChange={() => {}}
        blockTypes={[...coreBlocks, chart]}
      />,
    );
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('renders nothing for an unregistered block type instead of crashing', () => {
    render(<BlockCanvas blocks={[{ id: 'z', type: 'GONE', data: {} }]} onChange={() => {}} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('accepts a blocks array supplied from outside after mount', async () => {
    function Host() {
      const [current, setBlocks] = React.useState<QuoinBlock[]>([]);
      return (
        <>
          <button onClick={() => setBlocks([{ id: 'x', type: 'MARKDOWN', data: { markdown: 'loaded' } }])}>
            load
          </button>
          <BlockCanvas blocks={current} onChange={setBlocks} />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Host />);
    expect(screen.queryByText('loaded')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'load' }));
    expect(await screen.findByText('loaded')).toBeInTheDocument();
  });

  it('does not loop when the host echoes its own onChange back', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Host() {
      const [current, setBlocks] = React.useState<QuoinBlock[]>(blocks);
      return (
        <BlockCanvas
          blocks={current}
          onChange={(next) => {
            onChange(next);
            setBlocks(next);
          }}
        />
      );
    }
    render(<Host />);
    await user.click(screen.getByText('# Title'));
    await user.type(screen.getByLabelText('Markdown'), '!');
    expect(onChange.mock.calls.length).toBeLessThan(20);
  });

  it('keeps editing after the host echoes an edit back', async () => {
    const user = userEvent.setup();
    function Host() {
      const [current, setBlocks] = React.useState<QuoinBlock[]>(blocks);
      return <BlockCanvas blocks={current} onChange={setBlocks} />;
    }
    render(<Host />);
    await user.click(screen.getByText('# Title'));
    await user.type(screen.getByLabelText('Markdown'), '!?');
    expect(screen.getByLabelText('Markdown')).toHaveValue('# Title!?');
  });

  it('renders no editing affordances in read-only mode', () => {
    render(<BlockCanvas blocks={blocks} onChange={() => {}} readOnly />);
    expect(screen.queryByRole('button', { name: /insert a block/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /block actions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reorder block/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit block/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Write something')).not.toBeInTheDocument();
  });

  it('does not open an editor on click in read-only mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BlockCanvas blocks={blocks} onChange={onChange} readOnly />);
    await user.click(screen.getByText('# Title'));
    expect(screen.queryByLabelText('Markdown')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BlockCanvas blocks={blocks} onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations in read-only mode', async () => {
    const { container } = render(<BlockCanvas blocks={blocks} onChange={() => {}} readOnly />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
