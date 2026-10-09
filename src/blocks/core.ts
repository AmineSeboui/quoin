import { Code, FileText, MessageSquare, Image, Paperclip } from 'lucide-react';
import { defineBlock, type AnyBlockDefinition } from '../registry';
import { MarkdownBlockEditor } from './MarkdownBlockEditor';
import { CalloutBlockEditor } from './CalloutBlockEditor';
import { CodeBlockEditor } from './CodeBlockEditor';
import { ImageBlockEditor } from './ImageBlockEditor';
import { FileBlockEditor } from './FileBlockEditor';
import {
  MarkdownPreview,
  CalloutPreview,
  CodePreview,
  ImagePreview,
  FilePreview,
} from './previews';

/** The block types Quoin ships with. Spread them alongside your own definitions. */
export const coreBlocks: AnyBlockDefinition[] = [
  defineBlock({
    type: 'MARKDOWN',
    label: 'Markdown',
    icon: FileText,
    editor: MarkdownBlockEditor,
    preview: MarkdownPreview,
    initialData: () => ({ markdown: '' }),
  }),
  defineBlock({
    type: 'CALLOUT',
    label: 'Callout',
    icon: MessageSquare,
    editor: CalloutBlockEditor,
    preview: CalloutPreview,
    initialData: () => ({ tone: 'info', body: '' }),
  }),
  defineBlock({
    type: 'CODE',
    label: 'Code',
    icon: Code,
    editor: CodeBlockEditor,
    preview: CodePreview,
    initialData: () => ({ language: '', code: '' }),
  }),
  defineBlock({
    type: 'IMAGE',
    label: 'Image',
    icon: Image,
    editor: ImageBlockEditor,
    preview: ImagePreview,
    initialData: () => ({ storageKey: '', alt: '' }),
  }),
  defineBlock({
    type: 'FILE',
    label: 'File',
    icon: Paperclip,
    editor: FileBlockEditor,
    preview: FilePreview,
    initialData: () => ({ storageKey: '', filename: '' }),
  }),
];
