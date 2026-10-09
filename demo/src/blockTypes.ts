import { coreBlocks, type AnyBlockDefinition } from 'quoin-editor';
import { bookmark } from './bookmark';
import { richMarkdown } from './MarkdownPreview';

export const blockTypes: AnyBlockDefinition[] = [
  ...coreBlocks,
  ...(richMarkdown ? [richMarkdown] : []),
  bookmark,
];
