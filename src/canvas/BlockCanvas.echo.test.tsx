import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockCanvas } from './BlockCanvas';
import type { QuoinBlock } from '../types';

const { resetSpy } = vi.hoisted(() => ({ resetSpy: vi.fn() }));

// The canvas resets itself only for a document it did not write, so the spy sits on
// `reset` to tell a tolerated echo apart from the canvas treating its own output as foreign.
vi.mock('../hooks/useBlockList', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useBlockList')>();
  const React = await import('react');
  return {
    ...actual,
    useBlockList: (initial: QuoinBlock[]) => {
      const list = actual.useBlockList(initial);
      const reset = React.useCallback(
        (blocks: QuoinBlock[]) => {
          resetSpy(blocks);
          list.reset(blocks);
        },
        [list.reset],
      );
      return { ...list, reset };
    },
  };
});

const seed: QuoinBlock[] = [{ id: 'a', type: 'MARKDOWN', data: { markdown: '' } }];
const TYPED = 'ZZTYPED hello world';

function LaggingHost() {
  const [blocks, setBlocks] = React.useState<QuoinBlock[]>(seed);
  return <BlockCanvas blocks={blocks} onChange={(next) => setTimeout(() => setBlocks(next), 0)} />;
}

function SyncHost() {
  const [blocks, setBlocks] = React.useState<QuoinBlock[]>(seed);
  return <BlockCanvas blocks={blocks} onChange={setBlocks} />;
}

// A delay between keystrokes yields the event loop, which is what lets a host echoing
// through a timer land its stale documents in the middle of the burst.
async function typeInto(ui: React.ReactElement) {
  const user = userEvent.setup({ delay: 1 });
  render(ui);
  await user.click(screen.getByText('Empty markdown block'));
  const box = await screen.findByLabelText('Markdown');
  await user.type(box, TYPED);
  return box;
}

beforeEach(() => resetSpy.mockClear());

describe('a host that echoes the canvas back late', () => {
  it('keeps every character typed while its echoes are still in flight', async () => {
    const box = await typeInto(<LaggingHost />);

    await waitFor(() => expect(box).toHaveValue(TYPED));
  });

  it('never treats one of its own documents as a foreign one', async () => {
    await typeInto(<LaggingHost />);

    await waitFor(() => expect(resetSpy).not.toHaveBeenCalled());
  });
});

describe('a host that echoes the canvas back synchronously', () => {
  it('types a burst through without a single reset', async () => {
    const box = await typeInto(<SyncHost />);

    expect(box).toHaveValue(TYPED);
    expect(resetSpy).not.toHaveBeenCalled();
  });
});

describe('a host that supplies a document of its own', () => {
  it('still resets for an array the canvas emitted earlier and the host replays', async () => {
    const user = userEvent.setup();
    function UndoHost() {
      const [blocks, setBlocks] = React.useState<QuoinBlock[]>(seed);
      const history = React.useRef<QuoinBlock[][]>([]);
      return (
        <>
          <button onClick={() => setBlocks(history.current[0])}>undo</button>
          <BlockCanvas
            blocks={blocks}
            onChange={(next) => {
              history.current.push(next);
              setBlocks(next);
            }}
          />
        </>
      );
    }
    render(<UndoHost />);
    await user.click(screen.getByText('Empty markdown block'));
    await user.type(await screen.findByLabelText('Markdown'), 'ab');
    expect(screen.getByLabelText('Markdown')).toHaveValue('ab');

    // Clicking outside the block also leaves edit mode, so the undone document is read
    // from the preview rather than from the box.
    await user.click(screen.getByRole('button', { name: 'undo' }));

    expect(await screen.findByText('a')).toBeInTheDocument();
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  it('resets for a document it never emitted', async () => {
    const user = userEvent.setup();
    function LoadingHost() {
      const [blocks, setBlocks] = React.useState<QuoinBlock[]>(seed);
      return (
        <>
          <button onClick={() => setBlocks([{ id: 'x', type: 'MARKDOWN', data: { markdown: 'loaded' } }])}>
            load
          </button>
          <BlockCanvas blocks={blocks} onChange={setBlocks} />
        </>
      );
    }
    render(<LoadingHost />);

    await user.click(screen.getByRole('button', { name: 'load' }));

    expect(await screen.findByText('loaded')).toBeInTheDocument();
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});
