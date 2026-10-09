import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownBlockEditor } from './MarkdownBlockEditor';
import { QuoinProvider } from '../context';
import { coreBlocks } from './core';

function Harness({
  initial = '',
  onInsertBlock,
}: {
  initial?: string;
  onInsertBlock?: (type: string) => void;
}) {
  const [data, setData] = React.useState<Record<string, unknown>>({ markdown: initial });
  return (
    <QuoinProvider value={{ blockTypes: coreBlocks }}>
      <MarkdownBlockEditor data={data} onChange={setData} onInsertBlock={onInsertBlock} />
    </QuoinProvider>
  );
}

function box() {
  return screen.getByLabelText('Markdown') as HTMLTextAreaElement;
}

function openPalette(at = box().value.length) {
  const el = box();
  el.setSelectionRange(at, at);
  fireEvent.keyDown(el, { key: '/' });
}

describe('MarkdownBlockEditor palette', () => {
  it('opens the palette on a slash without typing it', () => {
    render(<Harness />);
    openPalette();
    expect(screen.getByPlaceholderText(/search commands/i)).toBeInTheDocument();
    expect(box()).toHaveValue('');
  });

  it('writes the chosen command at the caret', () => {
    render(<Harness />);
    openPalette();
    fireEvent.click(screen.getByText('Subtitle'));
    expect(box()).toHaveValue('## ');
  });

  it('starts a new line when the caret sits after text', () => {
    render(<Harness initial="hello " />);
    openPalette();
    fireEvent.click(screen.getByText('Bullet list'));
    expect(box()).toHaveValue('hello\n- ');
  });

  it('reports a block command to the caller instead of writing markdown', () => {
    const onInsertBlock = vi.fn();
    render(<Harness onInsertBlock={onInsertBlock} />);
    openPalette();
    fireEvent.click(screen.getByText('Image'));
    expect(onInsertBlock).toHaveBeenCalledWith('IMAGE');
    expect(box()).toHaveValue('');
  });

  it('puts the literal slash back when the palette is dismissed', () => {
    render(<Harness initial="and " />);
    openPalette();
    fireEvent.keyDown(screen.getByPlaceholderText(/search commands/i), { key: 'Escape' });
    expect(box()).toHaveValue('and /');
  });

  it('opens the shortcut reference from the palette', () => {
    render(<Harness />);
    openPalette();
    fireEvent.click(screen.getByText('Keyboard shortcuts'));
    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument();
  });

  it('still continues a list on Enter', () => {
    render(<Harness initial="- first" />);
    const el = box();
    el.setSelectionRange(7, 7);
    fireEvent.keyDown(el, { key: 'Enter' });
    expect(box()).toHaveValue('- first\n- ');
  });

  it('keeps offering the markdown upload while the block is empty', () => {
    render(<Harness />);
    expect(screen.getByText(/upload \.md/i)).toBeInTheDocument();
  });
});
