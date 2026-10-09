import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { BlockEditorProps, BlockPreviewProps } from './types';

/** Describes one block type: how to label it, how to draw it at rest, how to edit it. */
export type BlockDefinition<D = Record<string, unknown>> = {
  type: string;
  label: string;
  icon: LucideIcon;
  editor: ComponentType<BlockEditorProps<D>>;
  /**
   * What the block shows when it is not being edited. Optional so a host can register an
   * edit-only block type, and overridable so a host can supply rich rendering (a full
   * markdown pipeline, a chart) without Quoin depending on one.
   */
  preview?: ComponentType<BlockPreviewProps<D>>;
  initialData?: () => D;
  inSlashPalette?: boolean;
};

/** A definition with its data type erased, so definitions of different shapes compose in one array. */
export type AnyBlockDefinition = BlockDefinition<Record<string, unknown>>;

/**
 * Types `data` inside your editor component, then erases the generic on the way out.
 * The erasure is deliberate: `D` appears in both covariant and contravariant positions
 * on `editor`, so without it an array of differently-shaped definitions will not typecheck.
 */
export function defineBlock<D extends Record<string, unknown>>(
  definition: BlockDefinition<D>,
): AnyBlockDefinition {
  return definition as unknown as AnyBlockDefinition;
}

/** The definition for a type, or undefined. Later entries win, so a host can override a core block. */
export function blockByType(
  definitions: AnyBlockDefinition[],
  type: string,
): AnyBlockDefinition | undefined {
  for (let i = definitions.length - 1; i >= 0; i -= 1) {
    if (definitions[i].type === type) return definitions[i];
  }
  return undefined;
}

/** The definitions offered in the slash palette and the block inserter. */
export function paletteBlocks(definitions: AnyBlockDefinition[]): AnyBlockDefinition[] {
  const seen = new Set<string>();
  const out: AnyBlockDefinition[] = [];
  for (let i = definitions.length - 1; i >= 0; i -= 1) {
    const d = definitions[i];
    if (seen.has(d.type) || d.inSlashPalette === false) continue;
    seen.add(d.type);
    out.unshift(d);
  }
  return out;
}
