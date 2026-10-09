import { TEXT_COMMANDS } from './commands';
import { insertCommand } from './insert-command';

function command(id: string) {
  const found = TEXT_COMMANDS.find((c) => c.id === id);
  if (!found) throw new Error(`no command ${id}`);
  return found;
}

describe('TEXT_COMMANDS', () => {
  it('offers every documented text command', () => {
    expect(TEXT_COMMANDS.map((c) => c.id)).toEqual([
      'heading',
      'subtitle',
      'subsubtitle',
      'bullet',
      'numbered',
      'task',
      'quote',
      'code',
      'divider',
      'table',
    ]);
  });

  it('gives every command a label, an icon and searchable keywords', () => {
    for (const c of TEXT_COMMANDS) {
      expect(c.label).not.toBe('');
      expect(c.icon).toBeTruthy();
      expect(c.keywords.length).toBeGreaterThan(0);
    }
  });

  it('keeps every caret offset inside its own inserted text', () => {
    for (const c of TEXT_COMMANDS) {
      expect(c.caretOffset).toBeLessThanOrEqual(c.insert.length);
    }
  });
});

describe('insertCommand', () => {
  it('writes a subtitle on an empty line with the caret after the prefix', () => {
    expect(insertCommand(command('subtitle'), '', 0)).toEqual({
      value: '## ',
      selectionStart: 3,
      selectionEnd: 3,
    });
  });

  it('starts a new line when the line already has content, swallowing the typed space', () => {
    expect(insertCommand(command('subtitle'), 'hello ', 6)).toEqual({
      value: 'hello\n## ',
      selectionStart: 9,
      selectionEnd: 9,
    });
  });

  it('inserts before text that is already on the line', () => {
    expect(insertCommand(command('subtitle'), 'tail', 0)).toEqual({
      value: '## tail',
      selectionStart: 3,
      selectionEnd: 3,
    });
  });

  it('keeps a blank line before a divider so the line above stays a paragraph', () => {
    expect(insertCommand(command('divider'), 'hello ', 6)).toEqual({
      value: 'hello\n\n---\n',
      selectionStart: 11,
      selectionEnd: 11,
    });
  });

  it('keeps a blank line before a table, which cannot interrupt a paragraph', () => {
    const result = insertCommand(command('table'), 'hello ', 6);
    expect(result.value.startsWith('hello\n\n|')).toBe(true);
  });

  it('puts the caret in the language slot of a code fence', () => {
    expect(insertCommand(command('code'), '', 0)).toEqual({
      value: '```\n\n```',
      selectionStart: 3,
      selectionEnd: 3,
    });
  });

  it('selects the first header cell of a table so typing replaces it', () => {
    const result = insertCommand(command('table'), '', 0);
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe('Column');
  });

  it('swallows indentation on an otherwise blank line', () => {
    expect(insertCommand(command('bullet'), '   ', 3)).toEqual({
      value: '- ',
      selectionStart: 2,
      selectionEnd: 2,
    });
  });

  it('leaves earlier lines untouched', () => {
    expect(insertCommand(command('quote'), 'first\n', 6).value).toBe('first\n> ');
  });

  it('puts the caret where each command says, for every command', () => {
    for (const c of TEXT_COMMANDS) {
      const result = insertCommand(c, '', 0);
      expect({ id: c.id, start: result.selectionStart, end: result.selectionEnd }).toEqual({
        id: c.id,
        start: c.caretOffset,
        end: c.caretOffset + (c.selectLength ?? 0),
      });
    }
  });
});
