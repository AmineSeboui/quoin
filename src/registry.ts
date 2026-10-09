import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { BlockEditorProps, BlockPreviewProps } from './types';

/** Describes one block type: how to label it, how to draw it at rest, how to edit it. */
export type BlockDefinition<D extends object = Record<string, unknown>> = {
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
  /**
   * Called when a new block of this type is inserted, to seed its data.
   * `NoInfer` keeps `D` inferred from `editor` and `preview` alone, so the seed is checked
   * against the editor's data type instead of widening it.
   */
  initialData?: () => NoInfer<D>;
  /** Whether the block is offered in the slash palette and inserter; defaults to true. */
  inSlashPalette?: boolean;
  /** Renders this block's editor permanently instead of a preview you click to edit. */
  alwaysEditing?: boolean;
};

/** A definition with its data type erased, so definitions of different shapes compose in one array. */
export type AnyBlockDefinition = BlockDefinition<Record<string, unknown>>;

/**
 * Types `data` inside your editor component, then erases the generic on the way out.
 * The erasure is deliberate: `D` appears in both covariant and contravariant positions
 * on `editor`, so without it an array of differently-shaped definitions will not typecheck.
 * `initialData` is checked against the editor's data type. That relies on `NoInfer`, so
 * TypeScript 5.4 or later is required.
 */
export function defineBlock<D extends object>(definition: BlockDefinition<D>): AnyBlockDefinition {
  return definition as unknown as AnyBlockDefinition;
}

/** The definition for a type, or undefined; the last registration of a type wins, so a host can override a core block. */
export function blockByType(
  definitions: AnyBlockDefinition[],
  type: string,
): AnyBlockDefinition | undefined {
  for (let i = definitions.length - 1; i >= 0; i -= 1) {
    if (definitions[i].type === type) return definitions[i];
  }
  return undefined;
}

/** The definitions offered in the slash palette, in registration order, one per type, with the last registration of a type winning. */
export function paletteBlocks(definitions: AnyBlockDefinition[]): AnyBlockDefinition[] {
  const seen = new Set<string>();
  const out: AnyBlockDefinition[] = [];
  for (let i = definitions.length - 1; i >= 0; i -= 1) {
    const d = definitions[i];
    if (seen.has(d.type)) continue;
    // Claim the type BEFORE honouring the opt-out, so a hidden override suppresses the
    // definition it replaces instead of letting the earlier one reappear. Without this,
    // the palette can offer a block that `blockByType` resolves to a different definition.
    seen.add(d.type);
    if (d.inSlashPalette === false) continue;
    out.push(d);
  }
  return out.reverse();
}
