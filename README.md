# Quoin

[![CI](https://github.com/AmineSeboui/quoin/actions/workflows/ci.yml/badge.svg)](https://github.com/AmineSeboui/quoin/actions/workflows/ci.yml)

A React block editor: typed blocks, drag to reorder, a markdown surface with a slash palette, and an open block type registry.

Quoin edits markdown. It does not render it. A markdown block is edited in a plain textarea with shortcuts, list continuation and a slash palette, and it is drawn at rest as plain text. There is no remark or rehype pipeline in the package. A host that wants rich rendering registers its own `preview` on a block definition (see [Custom blocks](#custom-blocks)), so Quoin never forces a markdown renderer on you.

Documentation: [amineseboui.github.io/quoin](https://amineseboui.github.io/quoin)

Quoin is published on npm as `quoin-editor`, because npm rejects the bare name `quoin` as too similar to an existing package. Everywhere below, `quoin-editor` is the package you install and import.

## Install

```bash
npm install quoin-editor
```

```bash
yarn add quoin-editor
```

Quoin needs React 18.2 or later (React 19 is supported) and TypeScript 5.4 or later if you use TypeScript. The block registry relies on the built-in `NoInfer` utility type, which arrived in 5.4.

## Quickstart

```tsx
import { useState } from 'react';
import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

export function Editor() {
  const [blocks, setBlocks] = useState<QuoinBlock[]>([]);
  return <BlockCanvas blocks={blocks} onChange={setBlocks} />;
}
```

A document is an array of `QuoinBlock`, each `{ id, type, data }`. Five block types ship by default: `MARKDOWN`, `CALLOUT`, `CODE`, `IMAGE` and `FILE`. The main entry point is marked `'use client'`, so render `BlockCanvas` from a client component.

## The controlled-component contract

`BlockCanvas` behaves like a controlled `<input value onChange>`. Update `blocks` synchronously from `onChange`.

If you apply the edit late, typing reverts. A debounce, a `startTransition`, or an async store all break the contract for the same reason a debounced parent breaks a controlled input: the canvas renders the keystroke, your state has not caught up, and the next render hands the old document back.

```tsx
import { startTransition, useState } from 'react';
import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

export function BrokenEditor() {
  const [blocks, setBlocks] = useState<QuoinBlock[]>([]);
  return (
    <BlockCanvas
      blocks={blocks}
      onChange={(next) => startTransition(() => setBlocks(next))}
    />
  );
}
```

Debounce the side effect, not the state. `useAutosave` does exactly that: it tracks the values you give it, waits for the edits to settle, then calls your `save`, and it retries a failed save with exponential backoff.

```tsx
import { useState } from 'react';
import { BlockCanvas, useAutosave, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

async function saveDocument(blocks: QuoinBlock[]): Promise<void> {
  await fetch('/api/document', { method: 'PUT', body: JSON.stringify(blocks) });
}

export function AutosavingEditor({ initial }: { initial: QuoinBlock[] }) {
  const [blocks, setBlocks] = useState<QuoinBlock[]>(initial);
  const { status } = useAutosave({
    deps: [blocks],
    build: () => blocks,
    save: saveDocument,
    debounceMs: 1000,
  });
  return (
    <>
      <BlockCanvas blocks={blocks} onChange={setBlocks} />
      <p role="status">{status}</p>
    </>
  );
}
```

### Loading, undoing and discarding

You can hand the canvas a new `blocks` array at any time to load, undo or merge a document. A new array replaces what the canvas shows when it differs from the last array you supplied.

When you echo `onChange` back into `blocks`, as every sample above does, the last array you supplied is the edited document, so `setBlocks(saved)` differs from it and resets the canvas with nothing more to do.

The case that needs care is a host that does not echo edits back. There, the last array you supplied is still the original, and an array structurally equal to it is ignored: a "discard changes" button that re-supplies the original document does nothing. To force a reset, remount the canvas with a React `key`. The sample below uses a `key` so it works either way.

```tsx
import { useState } from 'react';
import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

export function EditorWithDiscard({ saved }: { saved: QuoinBlock[] }) {
  const [blocks, setBlocks] = useState<QuoinBlock[]>(saved);
  const [revision, setRevision] = useState(0);

  function discard() {
    setBlocks(saved);
    setRevision((current) => current + 1);
  }

  return (
    <>
      <BlockCanvas key={revision} blocks={blocks} onChange={setBlocks} />
      <button type="button" onClick={discard}>
        Discard changes
      </button>
    </>
  );
}
```

The structural comparison is shallow over each block's `data`. A host whose block `data` contains nested objects rebuilt on every render, and which does not echo `onChange` back into `blocks`, can still lose an edit. All five core block types have flat data, so this only affects custom blocks. Keep `data` flat, or keep it referentially stable.

## Hoist `blockTypes` and your handlers

`BlockCanvas` builds its configuration from `blockTypes`, `upload`, `resolveAssetUrl` and `onError`, and memoises it on their identity. Pass a new array or a new function on every render and the memo is busted, which re-renders every block editor on the page.

```tsx
import { BlockCanvas, coreBlocks, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

export function SlowEditor({ blocks, onChange }: { blocks: QuoinBlock[]; onChange: (next: QuoinBlock[]) => void }) {
  return (
    <BlockCanvas
      blocks={blocks}
      onChange={onChange}
      blockTypes={[...coreBlocks]}
      onError={(error) => console.error(error)}
    />
  );
}
```

Hoist them to module scope instead, or wrap them in `useMemo` and `useCallback` when they depend on props.

```tsx
import { BlockCanvas, coreBlocks, type AnyBlockDefinition, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

const blockTypes: AnyBlockDefinition[] = [...coreBlocks];
const reportError = (error: Error) => console.error(error);

export function FastEditor({ blocks, onChange }: { blocks: QuoinBlock[]; onChange: (next: QuoinBlock[]) => void }) {
  return <BlockCanvas blocks={blocks} onChange={onChange} blockTypes={blockTypes} onError={reportError} />;
}
```

## Custom blocks

A block type is a definition built with `defineBlock`. `blockTypes` defaults to `coreBlocks`, so extend it by spreading them and adding your own. When two definitions share a `type`, the last one wins, which is also how you override a core block.

```tsx
import { Bookmark } from 'lucide-react';
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
}
```

A definition has these fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `type` | yes | The string stored on each block. It is how the registry finds the definition. |
| `label` | yes | The name shown in menus and the slash palette. |
| `icon` | yes | A [lucide](https://lucide.dev) icon component. Quoin depends on `lucide-react@^1`; add that same major to your own dependencies to import icons, so you do not end up with a second copy and mismatched icon types. |
| `editor` | yes | The editing surface. It receives `data` and `onChange`. Call `onChange` with the whole next `data`, not a patch. |
| `preview` | no | What the block shows when it is not being edited. Omit it for an edit-only block. |
| `initialData` | no | Seeds `data` when a block of this type is inserted. It is checked against the editor's data type. |
| `inSlashPalette` | no | Set to `false` to keep the type out of the slash palette and the inserter. Defaults to `true`. |
| `alwaysEditing` | no | Renders the editor permanently instead of a preview you click to edit. |

A definition that sets `alwaysEditing` should also supply a `preview`. A `readOnly` canvas draws the preview and never the editor, so without a preview the block's content is invisible there.

The preview is also how you bring your own markdown renderer. Register a `MARKDOWN` definition last, reuse the core editor, and swap the preview:

```tsx
import { blockByType, coreBlocks, defineBlock, type AnyBlockDefinition, type BlockPreviewProps } from 'quoin-editor';

function RichMarkdownPreview({ data }: BlockPreviewProps) {
  return <article>{String(data.markdown ?? '')}</article>;
}

const core = blockByType(coreBlocks, 'MARKDOWN');

export const blockTypes: AnyBlockDefinition[] = core
  ? [...coreBlocks, defineBlock({ ...core, preview: RichMarkdownPreview })]
  : coreBlocks;
```

Replace the `<article>` with whatever renderer you use.

## Uploads

Quoin never performs a request. You hand it an `upload` function, and the image and file blocks call it with the chosen `File` and a `category` that names what the file is for (the core blocks use `'image'` and `'file'`). It resolves with an `UploadResult`.

```tsx
import { BlockCanvas, type QuoinBlock, type UploadFn } from 'quoin-editor';
import 'quoin-editor/styles.css';

const upload: UploadFn = async (file, category) => {
  let response: Response;
  try {
    response = await fetch(`/api/uploads?category=${encodeURIComponent(category)}`, {
      method: 'POST',
      body: file,
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    throw new Error(response.status === 413 ? 'That file is too large.' : 'The upload was refused.');
  }
  const stored = (await response.json()) as { key: string };
  return { storageKey: stored.key, filename: file.name, size: file.size };
};

const resolveAssetUrl = (storageKey: string) => `/api/files/${encodeURIComponent(storageKey)}`;
const reportError = (error: Error) => console.error(error);

export function Editor({ blocks, onChange }: { blocks: QuoinBlock[]; onChange: (next: QuoinBlock[]) => void }) {
  return (
    <BlockCanvas
      blocks={blocks}
      onChange={onChange}
      upload={upload}
      resolveAssetUrl={resolveAssetUrl}
      onError={reportError}
    />
  );
}
```

- `UploadResult` is `{ storageKey, filename, size, assetId? }`. `storageKey` is an opaque key your storage can find the file by. It is what Quoin stores in the document.
- `resolveAssetUrl` turns a `storageKey` back into a URL for display. It defaults to returning the key unchanged.
- **Reject with an `Error` whose `message` is safe to show.** It is rendered verbatim beside the upload button. A rejection that is not an `Error`, or an `Error` with an empty message, shows a generic "Upload failed." instead.
- **Catch network failures and rethrow with your own wording.** A raw `fetch` rejection such as "Failed to fetch" would otherwise be shown to the user verbatim.
- The upload control is disabled while an upload is in flight.
- With no `upload` function, upload fields render disabled, with a note that uploads are not configured.
- `onError` receives errors Quoin cannot show inline, such as an empty markdown file picked for import. It defaults to `console.error`.

## Read-only

```tsx
import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

const noop = () => {};

export function Reader({ blocks }: { blocks: QuoinBlock[] }) {
  return <BlockCanvas blocks={blocks} onChange={noop} readOnly aria-label="Article" />;
}
```

`readOnly` renders each block's `preview` with no inserters, menus, drag handles or editors. `onChange` is still required by the type, and is never called. `aria-label` names the document for assistive technology, and `className` and `id` go on the root element.

## Theming

`quoin-editor/styles.css` is compiled Tailwind CSS v4 and defines these custom properties:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --radius: 0.625rem;
}
```

Override any of them from your own CSS. They are declared inside `@layer base`, so a plain `:root` rule of yours wins without `!important`:

```css
:root {
  --primary: oklch(0.55 0.2 260);
  --radius: 0.5rem;
}
```

A project that already defines shadcn-style tokens with these names inherits its theme for free, with nothing to configure.

Dark mode keys on a `.dark` class on an ancestor (for example `<html class="dark">`), not on `prefers-color-scheme`. Quoin redefines the same variables under `.dark`, and its `dark:` variants follow the same class, so the two cannot disagree when a visitor's OS theme differs from your app's theme.

Quoin does not reset your page. The stylesheet contains no `html`, `body`, heading, list or other element rules, and no universal `*` reset. Its own reset (box sizing, zero margins, unstyled lists and form controls) applies only inside a `.quoin` element: the canvas root, and the menus, palette, select and dialog that Quoin renders into `document.body`, which carry the class themselves. Your headings, paragraphs, lists and buttons keep whatever styles you gave them, or the browser's.

All of Quoin's own rules are in cascade layers, so an **unlayered** global reset of yours beats them. A host that ships one (Bootstrap's reboot, or a hand-rolled `* { margin: 0; padding: 0; border: 0 }`) will see Quoin's padding and borders vanish. Tailwind 4's preflight is itself layered and is fine. Either declare your reset in a layer that comes before Quoin's, or scope it away from `.quoin`:

```css
@layer reset, theme, base, components, utilities;

@layer reset {
  * { margin: 0; padding: 0; border: 0; }
}
```

```css
*:where(:not(.quoin, .quoin *)) { margin: 0; padding: 0; border: 0; }
```

The layer statement has to come before Quoin's stylesheet is parsed, so put it first in your own CSS or in an inline `<style>` in the document head.

## Headless

`quoin-editor/headless` is the text-editing core with no UI in it: pure transforms over a string and a selection, plus two hooks. It has no component or UI library dependency, and its bundle carries no `'use client'` banner, so the pure functions can be imported from a React Server Component.

| Export | What it does |
| --- | --- |
| `wrapSelection`, `linkPaste` | Bold, italic, inline code and link wrapping, and pasting a URL over a selection. |
| `toggleLinePrefix` | Heading, bullet and ordered list prefixes on the selected lines. |
| `continueList`, `indentList` | List continuation on Enter, climbing out on an empty item, and Tab indentation. |
| `insertCommand` | Inserts a slash-palette command at the caret. |
| `shouldOpenPalette`, `lineAt` | Slash trigger detection and line lookup. |
| `applyEdit` | Writes an `Edit` into a textarea through the native undo stack so Ctrl+Z keeps working. |
| `formatShortcut`, `caretRect` | A platform-aware shortcut label, and the caret's pixel position in a textarea. |
| `useMarkdownKeymap` | The keyboard and paste handlers that wire the above onto a textarea. |
| `useAutoGrow` | A ref that makes a textarea's height follow its content. |

The text transforms return an `Edit`, `{ value, selectionStart, selectionEnd }`, or `null` when they do not apply.

```ts
import { wrapSelection } from 'quoin-editor/headless';

export function bold(text: string, start: number, end: number): string {
  return wrapSelection('bold', text, start, end).value;
}
```

`useMarkdownKeymap` and `useAutoGrow` are hooks, so they can only be called from a client component, even though the module that exports them is safe to import anywhere.

```tsx
'use client';

import { useState } from 'react';
import { useAutoGrow, useMarkdownKeymap } from 'quoin-editor/headless';

export function Notes() {
  const [text, setText] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const ref = useAutoGrow<HTMLTextAreaElement>(text);
  const keymap = useMarkdownKeymap({
    commit: setText,
    onOpenPalette: () => setPaletteOpen(true),
  });

  return (
    <>
      <textarea
        ref={ref}
        value={text}
        onChange={(event) => setText(event.target.value)}
        {...keymap}
      />
      {paletteOpen && <p role="status">Open your own command palette here.</p>}
    </>
  );
}
```

The keymap swallows a `/` typed at the start of a word (at the start of the text, or after a newline, space or tab, outside a code fence) and calls `onOpenPalette` instead, so open a palette of your own there, or insert the slash yourself.

The same functions and hooks are also exported from the main `quoin-editor` entry, alongside `TEXT_COMMANDS`, the built-in slash-palette entries.

## Exports

From `quoin`: `BlockCanvas`, `QuoinProvider`, `useQuoin`, `defineBlock`, `blockByType`, `paletteBlocks`, `coreBlocks`, `TEXT_COMMANDS`, `useBlockList`, `useAutosave`, `useAutoGrow`, and the headless transforms and hooks, with their types (`QuoinBlock`, `UploadFn`, `UploadResult`, `BlockDefinition`, `AnyBlockDefinition`, `BlockEditorProps`, `BlockPreviewProps`, `BlockCanvasProps` and others).

From `quoin-editor/headless`: the transforms and the two hooks listed above, with no UI.

From `quoin-editor/styles.css`: the stylesheet.

## Licence

MIT. Copyright (c) 2026 Amine Sboui. See [LICENSE](LICENSE).
