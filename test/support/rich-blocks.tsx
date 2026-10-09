import type { ReactElement } from 'react';
import { coreBlocks } from '../../src/blocks/core';
import { defineBlock, type AnyBlockDefinition } from '../../src/registry';
import { MarkdownBlockEditor } from '../../src/blocks/MarkdownBlockEditor';
import { FileText } from 'lucide-react';
import type { BlockPreviewProps } from '../../src/types';

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

function withLinks(text: string) {
  const parts: (string | ReactElement)[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    parts.push(text.slice(last, match.index));
    parts.push(
      <a key={match.index} href={match[2]}>
        {match[1]}
      </a>,
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

// Stands in for the host's own markdown pipeline: headings, paragraphs and links are
// enough to exercise how a card behaves around a rich preview.
function RichMarkdownPreview({ data }: BlockPreviewProps) {
  const source = typeof data.markdown === 'string' ? data.markdown : '';
  return (
    <>
      {source.split('\n\n').map((chunk, i) =>
        chunk.startsWith('## ') ? (
          <h2 key={i}>{chunk.slice(3)}</h2>
        ) : (
          <p key={i}>{withLinks(chunk)}</p>
        ),
      )}
    </>
  );
}

/** The core blocks with MARKDOWN drawn by a small rich preview, as a host with its own renderer would register it. */
export const richBlocks: AnyBlockDefinition[] = [
  ...coreBlocks,
  defineBlock({
    type: 'MARKDOWN',
    label: 'Markdown',
    icon: FileText,
    editor: MarkdownBlockEditor,
    preview: RichMarkdownPreview,
    initialData: () => ({ markdown: '' }),
  }),
];
