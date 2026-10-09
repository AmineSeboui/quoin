'use client';

import { useQuoin } from '../context';
import { blockByType } from '../registry';
import type { BlockEditorProps } from '../types';

export function BlockEditor({
  type,
  data,
  onChange,
  onInsertBlock,
  onDone,
}: BlockEditorProps & { type: string }) {
  const { blockTypes } = useQuoin();
  const definition = blockByType(blockTypes, type);
  if (!definition) return null;
  const Editor = definition.editor;
  return <Editor data={data} onChange={onChange} onInsertBlock={onInsertBlock} onDone={onDone} />;
}
