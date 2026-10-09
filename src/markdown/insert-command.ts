import type { Edit } from './edit';
import { lineAt } from './line-at';

/** The fields `insertCommand` needs. `TextCommand` satisfies this structurally. */
export type InsertableCommand = {
  insert: string;
  caretOffset: number;
  selectLength?: number;
  separate: boolean;
};

/** Inserts a command's markdown at the caret, starting a new line (or a blank line if it asks) when the caret is mid-line. */
export function insertCommand(command: InsertableCommand, value: string, caret: number): Edit {
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
