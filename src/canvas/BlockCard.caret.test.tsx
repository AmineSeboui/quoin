import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockCard } from './BlockCard';
import { renderCanvas } from '../../test/support/render-canvas';
import { richBlocks } from '../../test/support/rich-blocks';

const SOURCE = ['## Long section', '', 'First paragraph.', '', 'Second paragraph.', '', 'Third paragraph.'].join('\n');

function setup() {
  renderCanvas(
    <BlockCard
      block={{ id: 'a', type: 'MARKDOWN', data: { markdown: SOURCE } }}
      index={0}
      onUpdate={vi.fn()}
    />,
    richBlocks,
  );
  return userEvent.setup();
}

describe('entering a markdown block by clicking its rendered body', () => {
  it('puts the caret at the paragraph that was clicked, not at the top of the block', async () => {
    const user = setup();

    await user.click(screen.getByText('Third paragraph.'));

    const box = (await screen.findByLabelText('Markdown')) as HTMLTextAreaElement;
    await waitFor(() => expect(box.selectionStart).toBe(SOURCE.indexOf('Third paragraph.')));
  });

  it('finds the source position of a heading even though its marker is not rendered', async () => {
    const user = setup();

    await user.click(screen.getByRole('heading', { name: 'Long section' }));

    const box = (await screen.findByLabelText('Markdown')) as HTMLTextAreaElement;
    await waitFor(() => expect(box.selectionStart).toBe(SOURCE.indexOf('Long section')));
  });

  // The caret sitting at offset 0 is what drags the viewport to the top of the
  // block: the browser scrolls whatever the caret lands on into view.
  it('does not let focus scroll the page away from the click', async () => {
    const user = setup();
    const scrolls: (boolean | undefined)[] = [];
    const realFocus = HTMLTextAreaElement.prototype.focus;
    vi.spyOn(HTMLTextAreaElement.prototype, 'focus')
      .mockImplementation(function (this: HTMLTextAreaElement, options?: FocusOptions) {
        scrolls.push(options?.preventScroll);
        return realFocus.call(this, options);
      });

    await user.click(screen.getByText('Second paragraph.'));

    await screen.findByLabelText('Markdown');
    await waitFor(() => expect(scrolls).toContain(true));
    vi.restoreAllMocks();
  });

  it('still focuses a block opened without a click, the way a fresh insert is', async () => {
    renderCanvas(
      <BlockCard
        block={{ id: 'b', type: 'MARKDOWN', data: { markdown: '' } }}
        index={1}
        editingByDefault
        onUpdate={vi.fn()}
      />,
      richBlocks,
    );
    await waitFor(() => expect(screen.getByLabelText('Markdown')).toHaveFocus());
  });

  it('puts the caret after the seeded syntax of a block opened without a click', () => {
    renderCanvas(
      <BlockCard
        block={{ id: 'b1', type: 'MARKDOWN', data: { markdown: '## ' } }}
        index={0}
        editingByDefault
        onUpdate={vi.fn()}
      />,
      richBlocks,
    );

    const box = screen.getByLabelText('Markdown') as HTMLTextAreaElement;
    expect(box.selectionStart).toBe(3);
  });

  it('puts the caret where a seeded selection says, not at the end of the value', () => {
    renderCanvas(
      <BlockCard
        block={{ id: 'b1', type: 'MARKDOWN', data: { markdown: '```\n\n```' } }}
        index={0}
        editingByDefault
        initialSelection={{ start: 3, end: 3 }}
        onUpdate={vi.fn()}
      />,
      richBlocks,
    );

    const box = screen.getByLabelText('Markdown') as HTMLTextAreaElement;
    expect(box.selectionStart).toBe(3);
  });
});

describe('the page position when a block opens for editing', () => {
  // jsdom has no layout, so it cannot reproduce the clamp that a real browser
  // applies when the page shrinks mid-swap; this guards the contract rather than
  // the mechanism, and the mechanism was verified in a browser.
  it('keeps the page where it was when the click happened', async () => {
    const user = userEvent.setup();
    const scroller = (document.scrollingElement ?? document.documentElement) as HTMLElement;

    renderCanvas(
      <BlockCard
        block={{ id: 'tall', type: 'MARKDOWN', data: { markdown: SOURCE } }}
        index={0}
        onUpdate={vi.fn()}
      />,
      richBlocks,
    );

    scroller.scrollTop = 1385;
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        scroller.scrollTop = 137;
        return 2268;
      },
    });

    await user.click(screen.getByText('Second paragraph.'));
    await screen.findByLabelText('Markdown');

    await waitFor(() => expect(scroller.scrollTop).toBe(1385));
    Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight');
  });
});

const PLAIN = 'The quick brown fox jumps over the lazy dog, and then twice more.';

// jsdom has no layout, so the browser's own hit testing is stood in for: the caret is
// pinned to a known text node and offset, which is what a real click would resolve to.
function placeCaretIn(text: string, offset: number) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null = null;
  while (walker.nextNode()) {
    if (walker.currentNode.textContent === text) {
      node = walker.currentNode;
      break;
    }
  }
  Object.assign(document, { caretPositionFromPoint: () => (node ? { offsetNode: node, offset } : null) });
  return node;
}

function renderPlain(markdown: string) {
  return renderCanvas(
    <BlockCard block={{ id: 'p', type: 'MARKDOWN', data: { markdown } }} index={0} onUpdate={vi.fn()} />,
  );
}

async function clickBody(container: HTMLElement) {
  const body = container.querySelector('.whitespace-pre-wrap');
  await userEvent.setup().click(body as HTMLElement);
  return (await screen.findByLabelText('Markdown')) as HTMLTextAreaElement;
}

describe('entering a block drawn by the stock preview, where the text is the source', () => {
  afterEach(() => Reflect.deleteProperty(document, 'caretPositionFromPoint'));

  it('lands the caret in the middle of the line the click fell on', async () => {
    const { container } = renderPlain(PLAIN);
    expect(placeCaretIn(PLAIN, 27)).not.toBeNull();

    const box = await clickBody(container);

    await waitFor(() => expect(box.selectionStart).toBe(27));
  });

  it('lands the caret at the end when the click falls at the end', async () => {
    const { container } = renderPlain(PLAIN);
    placeCaretIn(PLAIN, PLAIN.length);

    const box = await clickBody(container);

    await waitFor(() => expect(box.selectionStart).toBe(PLAIN.length));
  });

  it('counts the newlines of a multi-line block rather than stopping at the first', async () => {
    const { container } = renderPlain(SOURCE);
    const offset = SOURCE.indexOf('Third paragraph.') + 6;
    placeCaretIn(SOURCE, offset);

    const box = await clickBody(container);

    await waitFor(() => expect(box.selectionStart).toBe(offset));
  });

  it('falls back to searching the source when a rich preview renders something else', async () => {
    renderCanvas(
      <BlockCard
        block={{ id: 'r', type: 'MARKDOWN', data: { markdown: SOURCE } }}
        index={0}
        onUpdate={vi.fn()}
      />,
      richBlocks,
    );
    placeCaretIn('Third paragraph.', 4);

    await userEvent.setup().click(screen.getByText('Third paragraph.'));

    const box = (await screen.findByLabelText('Markdown')) as HTMLTextAreaElement;
    await waitFor(() => expect(box.selectionStart).toBe(SOURCE.indexOf('Third paragraph.')));
  });
});
