'use client';

import { Keyboard } from 'lucide-react';
import { useQuoin } from '../context';
import { paletteBlocks } from '../registry';
import type { CaretRect } from './caret-coordinates';
import { TEXT_COMMANDS, type TextCommand } from './commands';
import { formatShortcut } from './shortcut-label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '../ui/command';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';

export function SlashPalette({
  open,
  caret,
  onOpenChange,
  onTextCommand,
  onBlockCommand,
  onShortcuts,
  onDismiss,
}: {
  open: boolean;
  caret: CaretRect | null;
  onOpenChange: (open: boolean) => void;
  onTextCommand: (command: TextCommand) => void;
  onBlockCommand: (type: string) => void;
  onShortcuts: () => void;
  onDismiss: () => void;
}) {
  const { blockTypes } = useQuoin();
  const blockOptions = paletteBlocks(blockTypes);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={caret ? { top: caret.top, left: caret.left, height: caret.height } : { top: 0, left: 0 }}
        />
      </PopoverAnchor>
      <PopoverContent
        aria-label="Command palette"
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-72 p-0"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          onDismiss();
        }}
        // Radix restores focus to the trigger on close, and this palette has an
        // aria-hidden anchor that cannot hold it, so the restore would drop focus
        // to the body. Both callers refocus the textarea before applying the edit.
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <Command label="Search commands">
          <CommandInput placeholder="Search commands" />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            <CommandGroup heading="Text">
              {TEXT_COMMANDS.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.label} ${command.keywords.join(' ')}`}
                  onSelect={() => onTextCommand(command)}
                >
                  <command.icon aria-hidden="true" />
                  <span>{command.label}</span>
                  {command.hint ? <CommandShortcut>{formatShortcut(command.hint)}</CommandShortcut> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Blocks">
              {blockOptions.map((option) => (
                <CommandItem key={option.type} value={option.label} onSelect={() => onBlockCommand(option.type)}>
                  <option.icon aria-hidden="true" />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem value="keyboard shortcuts help" onSelect={onShortcuts}>
                <Keyboard aria-hidden="true" />
                <span>Keyboard shortcuts</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
