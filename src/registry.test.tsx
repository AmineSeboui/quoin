import { FileText } from 'lucide-react';
import { defineBlock, blockByType, paletteBlocks } from './registry';

const note = defineBlock({
  type: 'NOTE',
  label: 'Note',
  icon: FileText,
  editor: () => null,
  initialData: () => ({ text: '' }),
});

const hidden = defineBlock({
  type: 'HIDDEN',
  label: 'Hidden',
  icon: FileText,
  editor: () => null,
  inSlashPalette: false,
});

describe('registry', () => {
  it('returns the definition registered for a type', () => {
    expect(blockByType([note], 'NOTE')).toBe(note);
  });

  it('returns undefined for an unregistered type rather than throwing', () => {
    expect(blockByType([note], 'NOPE')).toBeUndefined();
  });

  it('defaults initialData to an empty object', () => {
    expect(hidden.initialData?.() ?? {}).toEqual({});
  });

  it('includes a block in the palette by default', () => {
    expect(paletteBlocks([note])).toEqual([note]);
  });

  it('excludes a block that opts out of the palette', () => {
    expect(paletteBlocks([note, hidden])).toEqual([note]);
  });

  it('leaves preview undefined when a definition omits it', () => {
    expect(note.preview).toBeUndefined();
  });

  it('lets a later definition override an earlier one of the same type', () => {
    const override = defineBlock({ type: 'NOTE', label: 'Replaced', icon: FileText, editor: () => null });
    expect(blockByType([note, override], 'NOTE')?.label).toBe('Replaced');
  });
});
