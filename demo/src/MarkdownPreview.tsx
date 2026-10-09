import type { ReactNode } from 'react';
import { defineBlock, blockByType, coreBlocks, type BlockPreviewProps } from 'quoin-editor';
import { renderInline } from './inlineMarkdown';

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const ORDERED = /^\d+\.\s+(.*)$/;

type Group = { kind: 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'p'; lines: string[] };

function group(markdown: string): Group[] {
  const groups: Group[] = [];
  for (const line of markdown.split('\n')) {
    if (line.trim() === '') {
      groups.push({ kind: 'p', lines: [] });
      continue;
    }
    const heading = line.match(HEADING);
    const bullet = line.match(BULLET);
    const ordered = line.match(ORDERED);
    const kind = heading ? (`h${heading[1].length}` as Group['kind']) : bullet ? 'ul' : ordered ? 'ol' : 'p';
    const text = heading?.[2] ?? bullet?.[1] ?? ordered?.[1] ?? line;
    const tail = groups[groups.length - 1];
    if (tail && tail.kind === kind && (kind === 'ul' || kind === 'ol' || (kind === 'p' && tail.lines.length > 0))) {
      tail.lines.push(text);
    } else {
      groups.push({ kind, lines: [text] });
    }
  }
  return groups.filter((entry) => entry.lines.length > 0);
}

function renderGroup(entry: Group, index: number): ReactNode {
  const inline = entry.lines.map((line, i) => <span key={i}>{renderInline(line)}{i < entry.lines.length - 1 && <br />}</span>);
  if (entry.kind === 'ul' || entry.kind === 'ol') {
    const Tag = entry.kind;
    return <Tag key={index}>{entry.lines.map((line, i) => <li key={i}>{renderInline(line)}</li>)}</Tag>;
  }
  const Tag = entry.kind;
  return <Tag key={index}>{inline}</Tag>;
}

function RichMarkdownPreview({ data }: BlockPreviewProps) {
  const markdown = String(data.markdown ?? '');
  if (markdown.trim() === '') return <p className="md-empty">Empty markdown block</p>;
  return <div className="md-preview">{group(markdown).map(renderGroup)}</div>;
}

const core = blockByType(coreBlocks, 'MARKDOWN');

export const richMarkdown = core ? defineBlock({ ...core, preview: RichMarkdownPreview }) : null;
