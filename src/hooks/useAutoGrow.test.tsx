import { render, screen } from '@testing-library/react';
import { useAutoGrow } from './useAutoGrow';

function Box({ value }: { value: string }) {
  const ref = useAutoGrow<HTMLTextAreaElement>(value);
  return <textarea ref={ref} aria-label="Box" value={value} onChange={() => {}} />;
}

function stubScrollHeight(get: (el: HTMLTextAreaElement) => number) {
  Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLTextAreaElement) {
      return get(this);
    },
  });
}

describe('useAutoGrow', () => {
  afterEach(() => Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight'));

  it('sizes the box to its content', () => {
    stubScrollHeight(() => 420);
    render(<Box value="hello" />);
    expect((screen.getByLabelText('Box') as HTMLTextAreaElement).style.height).toBe('420px');
  });

  // jsdom has no layout, so the browser behaviour is staged: measuring sets the
  // height to "auto", which really does collapse the box, shrink the page and make
  // the browser clamp the scroll. Restoring the height does not restore the scroll,
  // which on a tall block threw the author back to the top of the document.
  it('leaves the page scrolled where it was, even though measuring collapses the box', () => {
    const scroller = (document.scrollingElement ?? document.documentElement) as HTMLElement;
    stubScrollHeight((el) => {
      if (el.style.height === 'auto') scroller.scrollTop = 137;
      return 2268;
    });

    scroller.scrollTop = 1385;
    render(<Box value={'a'.repeat(500)} />);

    expect(scroller.scrollTop).toBe(1385);
    expect((screen.getByLabelText('Box') as HTMLTextAreaElement).style.height).toBe('2268px');
  });
});
