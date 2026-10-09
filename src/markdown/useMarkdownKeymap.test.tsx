import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useMarkdownKeymap } from './useMarkdownKeymap';

function Harness({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [markdown, setMarkdown] = React.useState('');
  const keymap = useMarkdownKeymap({ commit: setMarkdown, onOpenPalette });
  return (
    <textarea
      aria-label="Markdown"
      value={markdown}
      onChange={(e) => setMarkdown(e.target.value)}
      {...keymap}
    />
  );
}

function setup(initial = '') {
  const onOpenPalette = vi.fn();
  render(<Harness onOpenPalette={onOpenPalette} />);
  const box = screen.getByLabelText('Markdown') as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: initial } });
  box.setSelectionRange(initial.length, initial.length);
  return { box, onOpenPalette };
}

describe('useMarkdownKeymap', () => {
  it('continues a list on Enter', () => {
    const { box } = setup('- first');
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(box.value).toBe('- first\n- ');
  });

  it('leaves a list on Enter at a dead item', () => {
    const { box } = setup('- a\n- ');
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(box.value).toBe('- a\n\n');
  });

  it('lets Shift+Enter through as a plain newline', () => {
    const { box } = setup('- first');
    expect(fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })).toBe(true);
    expect(box.value).toBe('- first');
  });

  it('removes a marker on Backspace at the content start', () => {
    const { box } = setup('- hello');
    box.setSelectionRange(2, 2);
    fireEvent.keyDown(box, { key: 'Backspace' });
    expect(box.value).toBe('hello');
  });

  it('indents a list item on Tab', () => {
    const { box } = setup('- a\n- b');
    expect(fireEvent.keyDown(box, { key: 'Tab' })).toBe(false);
    expect(box.value).toBe('- a\n  - b');
  });

  it('lets Tab move focus out of a plain paragraph', () => {
    const { box } = setup('hello');
    expect(fireEvent.keyDown(box, { key: 'Tab' })).toBe(true);
    expect(box.value).toBe('hello');
  });

  it('wraps a selection in bold', () => {
    const { box } = setup('important');
    box.setSelectionRange(0, 9);
    fireEvent.keyDown(box, { key: 'b', metaKey: true });
    expect(box.value).toBe('**important**');
  });

  it('makes a link with the modifier and k', () => {
    const { box } = setup('docs');
    box.setSelectionRange(0, 4);
    fireEvent.keyDown(box, { key: 'k', ctrlKey: true });
    expect(box.value).toBe('[docs]()');
  });

  it('toggles a subtitle from the digit code, not the shifted key', () => {
    const { box } = setup('Getting started');
    fireEvent.keyDown(box, { key: '2', code: 'Digit2', metaKey: true, altKey: true });
    expect(box.value).toBe('## Getting started');
  });

  it('toggles bullets even though Shift makes the key an asterisk', () => {
    const { box } = setup('apples');
    fireEvent.keyDown(box, { key: '*', code: 'Digit8', metaKey: true, shiftKey: true });
    expect(box.value).toBe('- apples');
  });

  it('opens the palette on a slash at a trigger position without typing it', () => {
    const { box, onOpenPalette } = setup('hello ');
    expect(fireEvent.keyDown(box, { key: '/' })).toBe(false);
    expect(onOpenPalette).toHaveBeenCalled();
    expect(box.value).toBe('hello ');
  });

  it('leaves a mid word slash to type literally', () => {
    const { box, onOpenPalette } = setup('and');
    expect(fireEvent.keyDown(box, { key: '/' })).toBe(true);
    expect(onOpenPalette).not.toHaveBeenCalled();
  });

  it('does not hijack the save shortcut', () => {
    const { box } = setup('hello');
    expect(fireEvent.keyDown(box, { key: 's', metaKey: true })).toBe(true);
  });

  it('makes a link when a url is pasted over a selection', () => {
    const { box } = setup('see docs');
    box.setSelectionRange(4, 8);
    fireEvent.paste(box, { clipboardData: { getData: () => 'https://x.dev' } });
    expect(box.value).toBe('see [docs](https://x.dev)');
  });

  it('leaves an ordinary paste alone', () => {
    const { box } = setup('see docs');
    box.setSelectionRange(4, 8);
    expect(fireEvent.paste(box, { clipboardData: { getData: () => 'plain' } })).toBe(true);
    expect(box.value).toBe('see docs');
  });
});
