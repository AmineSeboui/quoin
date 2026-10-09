import { describe, it, expect, vi } from 'vitest';
import { applyEdit, type Edit } from './edit';

function textarea(value: string, selectionStart = value.length): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  el.value = value;
  document.body.appendChild(el);
  el.setSelectionRange(selectionStart, selectionStart);
  return el;
}

const edit = (value: string, caret: number): Edit => ({
  value,
  selectionStart: caret,
  selectionEnd: caret,
});

// jsdom does not implement execCommand, which is the branch two of these tests
// need. A stub installed by one test survives into the next (clearMocks clears
// calls, not implementations), so the property is restored after every test.
afterEach(() => {
  document.body.innerHTML = '';
  Reflect.deleteProperty(document, 'execCommand');
});

function stubExecCommand(fn: () => boolean) {
  Object.defineProperty(document, 'execCommand', { value: fn, configurable: true });
  return fn;
}

describe('applyEdit', () => {
  it('commits the new value and places the caret when execCommand is unavailable', () => {
    const el = textarea('hello');
    const commit = vi.fn();

    applyEdit(el, edit('hello world', 11), commit);

    expect(commit).toHaveBeenCalledWith('hello world');
    expect(el.value).toBe('hello world');
    expect(el.selectionStart).toBe(11);
    expect(el.selectionEnd).toBe(11);
  });

  it('writes through execCommand and commits the value it actually wrote', () => {
    const el = textarea('hello');
    const commit = vi.fn();
    const execCommand = stubExecCommand(
      vi.fn(() => {
        el.value = 'hello world';
        return true;
      }),
    );

    applyEdit(el, edit('hello world', 11), commit);

    expect(execCommand).toHaveBeenCalledWith('insertText', false, ' world');
    expect(commit).toHaveBeenCalledWith('hello world');
    expect(el.selectionStart).toBe(11);
  });

  it('selects only the minimal changed span so undo stays granular', () => {
    const el = textarea('# title\nbody');
    const selections: Array<[number, number]> = [];
    stubExecCommand(
      vi.fn(() => {
        selections.push([el.selectionStart, el.selectionEnd]);
        return true;
      }),
    );

    applyEdit(el, edit('## title\nbody', 3), vi.fn());

    expect(selections).toEqual([[1, 1]]);
  });

  it('deletes rather than inserting an empty string when the span shrinks', () => {
    const el = textarea('- ');
    const execCommand = stubExecCommand(vi.fn(() => true));

    applyEdit(el, edit('', 0), vi.fn());

    expect(execCommand).toHaveBeenCalledWith('delete');
  });

  it('places the caret without writing anything when the value is unchanged', () => {
    const el = textarea('hello', 0);
    const commit = vi.fn();
    const execCommand = stubExecCommand(vi.fn(() => true));

    applyEdit(el, edit('hello', 5), commit);

    expect(execCommand).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(el.selectionStart).toBe(5);
  });

  it('restores a selection range, not just a caret, on the fallback path', () => {
    const el = textarea('hello');
    applyEdit(el, { value: '**hello**', selectionStart: 2, selectionEnd: 7 }, vi.fn());
    expect(el.value).toBe('**hello**');
    expect(el.selectionStart).toBe(2);
    expect(el.selectionEnd).toBe(7);
  });
});
