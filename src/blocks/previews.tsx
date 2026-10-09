'use client';

import { useQuoin } from '../context';
import type { BlockPreviewProps } from '../types';
import { str } from './str';

const HINT = 'text-sm text-muted-foreground';

const TONE_BORDER: Record<string, string> = {
  info: 'border-primary',
  tip: 'border-accent-foreground',
  warning: 'border-muted-foreground',
  success: 'border-secondary-foreground',
  danger: 'border-destructive',
};

export function MarkdownPreview({ data }: BlockPreviewProps) {
  const markdown = str(data.markdown);
  if (markdown.trim() === '') return <p className={HINT}>Empty markdown block</p>;
  return <div className="whitespace-pre-wrap text-base leading-7">{markdown}</div>;
}

export function CodePreview({ data }: BlockPreviewProps) {
  const code = str(data.code);
  if (code.trim() === '') return <p className={HINT}>Empty code block</p>;
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
      <code>{code}</code>
    </pre>
  );
}

export function ImagePreview({ data }: BlockPreviewProps) {
  const { resolveAssetUrl } = useQuoin();
  const key = str(data.storageKey);
  // Guard on the key, not the resolved URL: a prefixing resolver turns an empty key into a truthy, dead address.
  if (key === '') return <p className={HINT}>No image chosen</p>;
  return <img src={resolveAssetUrl(key)} alt={str(data.alt)} className="max-w-full rounded-md" />;
}

export function FilePreview({ data }: BlockPreviewProps) {
  const name = str(data.filename);
  if (name === '') return <p className={HINT}>No file chosen</p>;
  return <p className="text-sm">{name}</p>;
}

export function CalloutPreview({ data }: BlockPreviewProps) {
  const body = str(data.body);
  if (body.trim() === '') return <p className={HINT}>Empty callout</p>;
  const tone = str(data.tone) || 'info';
  const border = TONE_BORDER[tone] ?? 'border-border';
  return (
    <div data-tone={tone} className={`rounded-md border-l-4 ${border} bg-muted/50 p-3 text-sm`}>
      {body}
    </div>
  );
}
