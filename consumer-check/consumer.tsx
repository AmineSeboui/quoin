import { useState } from 'react';
import { Star } from 'lucide-react';
import {
  BlockCanvas,
  coreBlocks,
  defineBlock,
  useAutosave,
  type AnyBlockDefinition,
  type BlockEditorProps,
  type QuoinBlock,
  type UploadFn,
} from 'quoin-editor';
import { wrapSelection } from 'quoin-editor/headless';
import 'quoin-editor/styles.css';

type RatingData = { stars: number };

function RatingEditor({ data, onChange }: BlockEditorProps<RatingData>) {
  return <button type="button" onClick={() => onChange({ stars: data.stars + 1 })}>{data.stars}</button>;
}

const rating = defineBlock({
  type: 'RATING',
  label: 'Rating',
  icon: Star,
  editor: RatingEditor,
  initialData: () => ({ stars: 0 }),
});

const blockTypes: AnyBlockDefinition[] = [...coreBlocks, rating];

const upload: UploadFn = async (file) => ({ storageKey: file.name, filename: file.name, size: file.size });

export function Consumer() {
  const [blocks, setBlocks] = useState<QuoinBlock[]>([]);
  useAutosave({ deps: [blocks], build: () => blocks, save: () => {} });
  return <BlockCanvas blocks={blocks} onChange={setBlocks} blockTypes={blockTypes} upload={upload} />;
}

export const bolded: string = wrapSelection('bold', 'text', 0, 4).value;
