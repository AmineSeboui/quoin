import { FileText } from 'lucide-react';
import { defineBlock, blockByType, paletteBlocks, type AnyBlockDefinition } from './registry';

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

  it('returns an empty palette for no definitions', () => {
    expect(paletteBlocks([])).toEqual([]);
  });

  it('includes a block that opts in explicitly', () => {
    const shown = defineBlock({ type: 'SHOWN', label: 'Shown', icon: FileText, editor: () => null, inSlashPalette: true });
    expect(paletteBlocks([shown])).toEqual([shown]);
  });

  it('keeps registration order and one entry per type', () => {
    const a = defineBlock({ type: 'A', label: 'A', icon: FileText, editor: () => null });
    const b = defineBlock({ type: 'B', label: 'B', icon: FileText, editor: () => null });
    const a2 = defineBlock({ type: 'A', label: 'A2', icon: FileText, editor: () => null });
    expect(paletteBlocks([a, b, a2])).toEqual([b, a2]);
  });

  it('does not resurrect an overridden block when the override opts out of the palette', () => {
    const a = defineBlock({ type: 'A', label: 'A', icon: FileText, editor: () => null });
    const b = defineBlock({ type: 'B', label: 'B', icon: FileText, editor: () => null });
    const a2 = defineBlock({ type: 'A', label: 'A2', icon: FileText, editor: () => null, inSlashPalette: false });
    const defs = [a, b, a2];
    const palette = paletteBlocks(defs);
    expect(palette).toEqual([b]);
    expect(palette.some((d) => d.type === 'A')).toBe(false);
    expect(blockByType(defs, 'A')).toBe(a2);
  });

  it('composes differently-shaped definitions in one array while typing data inside each editor', () => {
    const text = defineBlock<{ text: string }>({
      type: 'TEXT',
      label: 'Text',
      icon: FileText,
      editor: ({ data }) => <p>{data.text.toUpperCase()}</p>,
    });
    const image = defineBlock<{ url: string; width: number }>({
      type: 'IMAGE',
      label: 'Image',
      icon: FileText,
      editor: ({ data }) => <img src={data.url} width={data.width.toFixed(0)} alt="" />,
    });
    const all: AnyBlockDefinition[] = [text, image];
    expect(all.map((d) => d.type)).toEqual(['TEXT', 'IMAGE']);
  });

  it('rejects reading a field the declared shape does not have', () => {
    defineBlock<{ text: string }>({
      type: 'BAD',
      label: 'Bad',
      icon: FileText,
      // @ts-expect-error data has no `missing` field
      editor: ({ data }) => <p>{data.missing}</p>,
    });
  });

  it('accepts an interface as the data shape', () => {
    interface ChartData {
      points: number[];
    }
    const chart = defineBlock<ChartData>({
      type: 'CHART',
      label: 'Chart',
      icon: FileText,
      editor: ({ data }) => <p>{data.points.length}</p>,
    });
    expect(chart.type).toBe('CHART');
  });
});
