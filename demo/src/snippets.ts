export const QUICKSTART = `import { useState } from 'react';
import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

export function Editor() {
  const [blocks, setBlocks] = useState<QuoinBlock[]>([]);
  return <BlockCanvas blocks={blocks} onChange={setBlocks} />;
}`;

export const DEFINE_BLOCK = `import { Bookmark } from 'lucide-react';
import {
  BlockCanvas,
  coreBlocks,
  defineBlock,
  type AnyBlockDefinition,
  type BlockEditorProps,
  type BlockPreviewProps,
  type QuoinBlock,
} from 'quoin-editor';
import 'quoin-editor/styles.css';

type BookmarkData = { url: string; title: string };

function BookmarkEditor({ data, onChange }: BlockEditorProps<BookmarkData>) {
  return (
    <div>
      <input
        aria-label="Title"
        value={data.title}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
      <input
        aria-label="URL"
        value={data.url}
        onChange={(event) => onChange({ ...data, url: event.target.value })}
      />
    </div>
  );
}

function BookmarkPreview({ data }: BlockPreviewProps<BookmarkData>) {
  if (data.url === '') return <p>No bookmark yet</p>;
  return <a href={data.url}>{data.title || data.url}</a>;
}

const bookmark = defineBlock({
  type: 'BOOKMARK',
  label: 'Bookmark',
  icon: Bookmark,
  editor: BookmarkEditor,
  preview: BookmarkPreview,
  initialData: () => ({ url: '', title: '' }),
});

const blockTypes: AnyBlockDefinition[] = [...coreBlocks, bookmark];

export function Editor({ blocks, onChange }: { blocks: QuoinBlock[]; onChange: (next: QuoinBlock[]) => void }) {
  return <BlockCanvas blocks={blocks} onChange={onChange} blockTypes={blockTypes} />;
}`;

export const THEME_CSS = `:root {
  --primary: oklch(0.55 0.2 260);
  --radius: 0.5rem;
}`;

export const DARK_MODE = `<html class="dark">
  <!-- Quoin redefines its variables under .dark -->
</html>`;
