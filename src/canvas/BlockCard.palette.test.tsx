import { screen, fireEvent } from '@testing-library/react';
import { BlockCard } from './BlockCard';
import { renderCanvas } from '../../test/support/render-canvas';

function setup() {
  const onInsertBlock = vi.fn();
  renderCanvas(
    <BlockCard
      block={{ id: 'b1', type: 'MARKDOWN', data: { markdown: 'hello' } }}
      index={0}
      editingByDefault
      onUpdate={vi.fn()}
      onInsertBlock={onInsertBlock}
    />,
  );
  return { onInsertBlock };
}

function openPalette() {
  const el = screen.getByLabelText('Markdown') as HTMLTextAreaElement;
  el.setSelectionRange(0, 0);
  fireEvent.keyDown(el, { key: '/' });
  return screen.getByPlaceholderText(/search commands/i);
}

describe('BlockCard with the palette open', () => {
  it('stays in edit mode while the palette has focus', () => {
    setup();
    const input = openPalette();
    fireEvent.pointerDown(input);
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();
  });

  it('does not collapse the block when the palette is dismissed with Escape', () => {
    setup();
    const input = openPalette();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByLabelText('Markdown')).toBeInTheDocument();
  });

  it('asks the list to insert a block after this one', () => {
    const { onInsertBlock } = setup();
    openPalette();
    fireEvent.click(screen.getByText('Image'));
    expect(onInsertBlock).toHaveBeenCalledWith(1, 'IMAGE');
  });
});
