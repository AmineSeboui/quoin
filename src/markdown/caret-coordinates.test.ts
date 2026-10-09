import { caretRect } from './caret-coordinates';

function textarea(value: string): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  el.value = value;
  document.body.appendChild(el);
  el.setSelectionRange(value.length, value.length);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('caretRect', () => {
  it('returns null where there is no layout, so the caller anchors the box instead', () => {
    expect(caretRect(textarea('hello'))).toBeNull();
  });

  it('never leaves its measuring element behind', () => {
    const el = textarea('hello');
    Object.defineProperty(el, 'offsetWidth', { value: 300, configurable: true });
    Object.defineProperty(el, 'clientWidth', { value: 300, configurable: true });

    caretRect(el);

    expect(document.body.querySelectorAll('div')).toHaveLength(0);
  });
});
