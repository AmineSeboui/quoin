import type { TextCommand } from './commands';
import type { Edit } from './edit';
import { lineAt } from './line-at';

export function insertCommand(command: TextCommand, value: string, caret: number): Edit {
  const line = lineAt(value, caret);
  const before = value.slice(line.start, caret).replace(/[ \t]+$/, '');
  const cut = line.start + before.length;
  const prefix = before.trim() === '' ? '' : command.separate ? '\n\n' : '\n';
  const at = cut + prefix.length + command.caretOffset;

  return {
    value: value.slice(0, cut) + prefix + command.insert + value.slice(caret),
    selectionStart: at,
    selectionEnd: at + (command.selectLength ?? 0),
  };
}
