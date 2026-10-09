'use client';

import { useQuoin } from '../context';
import type { BlockPreviewProps } from '../types';
import { str } from './str';

export function MarkdownPreview({ data }: BlockPreviewProps) {
  const markdown = str(data.markdown);
  if (markdown.trim() === '') {
    return <p className="text-sm text-muted-foreground">Empty markdown block</p>;
  }
  return <div className="whitespace-pre-wrap text-base leading-7">{markdown}</div>;
}

export function CodePreview({ data }: BlockPreviewProps) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
      <code>{str(data.code)}</code>
    </pre>
  );
}

export function ImagePreview({ data }: BlockPreviewProps) {
  const { resolveAssetUrl } = useQuoin();
  const src = resolveAssetUrl(str(data.storageKey));
  if (!src) return <p className="text-sm text-muted-foreground">No image chosen</p>;
  return <img src={src} alt={str(data.alt)} className="max-w-full rounded-md" />;
}

export function FilePreview({ data }: BlockPreviewProps) {
  const name = str(data.filename);
  if (name === '') return <p className="text-sm text-muted-foreground">No file chosen</p>;
  return <p className="text-sm">{name}</p>;
}

export function CalloutPreview({ data }: BlockPreviewProps) {
  return (
    <div className="rounded-md border-l-4 border-border bg-muted/50 p-3 text-sm">
      {str(data.body)}
    </div>
  );
}
