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

If your application has Tailwind of its own, import the stylesheet from your CSS into a layer you have named instead of from JavaScript, so you decide which of the two wins. See [Cascade layers and import order](#cascade-layers-and-import-order).

## The controlled-component contract

`BlockCanvas` behaves like a controlled `<input value onChange>`. Update `blocks` synchronously from `onChange`.

Applying the edit late is tolerated, as long as what you eventually hand back is one of the arrays the canvas gave you. It recognises its own output even when the echo is several keystrokes behind, so `startTransition` and a debounced `setBlocks` both keep typing intact.

```tsx
import { startTransition, useState } from 'react';
import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

export function TransitionEditor() {
  const [blocks, setBlocks] = useState<QuoinBlock[]>([]);
  return (
    <BlockCanvas
      blocks={blocks}
      onChange={(next) => startTransition(() => setBlocks(next))}
    />
  );
}
```

What breaks is a store that rebuilds the document on the way through, so what comes back is a structural copy rather than the array the canvas emitted. Arriving behind the canvas's own state, that copy reads as a foreign document and replaces live text with an older snapshot. The damage is not a clean revert: the characters the snapshot predates are dropped and the ones typed after them are kept, so `ZZTYPED hello world` can land as `ZZYED hello wold`. A Redux or Zustand round trip that clones the document, and a server-synced store, are the usual sources.

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

### Undoing a deletion

`onChange` reports a new array and nothing about what changed, so a host that wants a "Block deleted / Undo" toast would have to diff two arrays to find out. `onDelete` tells it instead: it fires when a block is removed through its actions menu, with the block and the index it held.

It runs just after the `onChange` that reports the document without that block, so by the time your handler runs the new array has already been reported. Restoring is an ordinary document load: splice the block back at its index and supply the result as `blocks`.

```tsx
import { useState } from 'react';
import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import 'quoin-editor/styles.css';

export function EditorWithUndo({ saved }: { saved: QuoinBlock[] }) {
  const [blocks, setBlocks] = useState<QuoinBlock[]>(saved);
  const [removed, setRemoved] = useState<{ block: QuoinBlock; index: number } | null>(null);

  function restore() {
    if (!removed) return;
    const next = [...blocks];
    next.splice(removed.index, 0, removed.block);
    setBlocks(next);
    setRemoved(null);
  }

  return (
    <>
      <BlockCanvas blocks={blocks} onChange={setBlocks} onDelete={(block, index) => setRemoved({ block, index })} />
      {removed && (
        <button type="button" onClick={restore}>
          Undo delete
        </button>
      )}
    </>
  );
}
```

A restored block comes back at rest, even one that was inserted moments before it was deleted, so the undo does not pull the caret out of whatever is being written.

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

### Reaching uploads from a custom block

A block editor receives only `data` and `onChange`, but the canvas configuration reaches it through context, so an upload control inside a custom block needs no wiring from you.

`UploadField` is the control the image and file blocks use, and it is exported for yours. It reads `upload` from the canvas it is rendered in, disables itself while a file is in flight, announces the progress to assistive technology, renders a rejection's message beside the button, and says that uploads are not configured when the host wired none.

```tsx
import { UploadField, type BlockEditorProps } from 'quoin-editor';

type SlidesData = { storageKey: string; filename: string };

export function SlidesEditor({ data, onChange }: BlockEditorProps<SlidesData>) {
  return (
    <div>
      <p>{data.storageKey === '' ? 'No deck yet' : data.filename}</p>
      <UploadField
        category="slides"
        label="Upload slides"
        accept=".pdf"
        onUploaded={(result) => onChange({ storageKey: result.storageKey, filename: result.filename })}
      />
    </div>
  );
}
```

Register that editor with `defineBlock` as above, and the canvas's `upload` function receives `'slides'` as its category. `UploadField` takes `category`, `label`, an optional `accept` and `onUploaded`.

`FilePickerButton` is the picker underneath it: a labelled button laid over a transparent file input, which hands you the chosen `File` and uploads nothing itself. Take that one when you want your own busy and error presentation.

For anything neither control covers, `useQuoin()` returns `blockTypes`, `upload`, `resolveAssetUrl` and `onError`. It throws outside a `QuoinProvider`, so call it from a block the canvas is rendering.

```tsx
import { useQuoin, type BlockEditorProps } from 'quoin-editor';

type AttachmentData = { storageKey: string; filename: string };

export function AttachmentEditor({ data, onChange }: BlockEditorProps<AttachmentData>) {
  const { upload, resolveAssetUrl, onError } = useQuoin();

  async function store(file: File) {
    if (!upload) return;
    try {
      const stored = await upload(file, 'attachment');
      onChange({ storageKey: stored.storageKey, filename: stored.filename });
    } catch (error) {
      onError(error instanceof Error ? error : new Error('The upload failed.'));
    }
  }

  return (
    <div>
      {data.storageKey !== '' && <a href={resolveAssetUrl(data.storageKey)}>{data.filename}</a>}
      <input
        type="file"
        disabled={!upload}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void store(file);
        }}
      />
    </div>
  );
}
```

`upload` is absent when the host wired none, which is why the control above disables itself rather than failing on the pick. `resolveAssetUrl` defaults to returning the key unchanged, and `onError` to `console.error`.

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

`quoin-editor/styles.css` is compiled Tailwind CSS v4. Every colour and every radius it draws with comes from a custom property under a `--quoin-` prefix. It ships a default for all of them, on `:root` for light and on `.dark` for dark:

```css
:root {
  --quoin-background: oklch(1 0 0);
  --quoin-foreground: oklch(0.145 0 0);
  --quoin-muted: oklch(0.97 0 0);
  --quoin-muted-foreground: oklch(0.556 0 0);
  --quoin-secondary: oklch(0.97 0 0);
  --quoin-secondary-foreground: oklch(0.205 0 0);
  --quoin-popover: oklch(1 0 0);
  --quoin-popover-foreground: oklch(0.145 0 0);
  --quoin-border: oklch(0.922 0 0);
  --quoin-input: oklch(0.922 0 0);
  --quoin-ring: oklch(0.708 0 0);
  --quoin-primary: oklch(0.205 0 0);
  --quoin-primary-foreground: oklch(0.985 0 0);
  --quoin-accent: oklch(0.97 0 0);
  --quoin-accent-foreground: oklch(0.205 0 0);
  --quoin-destructive: oklch(0.577 0.245 27.325);
  --quoin-radius: 0.625rem;
}

.dark {
  --quoin-background: oklch(0.145 0 0);
  --quoin-foreground: oklch(0.985 0 0);
  --quoin-muted: oklch(0.269 0 0);
  --quoin-muted-foreground: oklch(0.708 0 0);
  --quoin-secondary: oklch(0.269 0 0);
  --quoin-secondary-foreground: oklch(0.985 0 0);
  --quoin-popover: oklch(0.205 0 0);
  --quoin-popover-foreground: oklch(0.985 0 0);
  --quoin-border: oklch(1 0 0 / 10%);
  --quoin-input: oklch(1 0 0 / 15%);
  --quoin-ring: oklch(0.556 0 0);
  --quoin-primary: oklch(0.922 0 0);
  --quoin-primary-foreground: oklch(0.205 0 0);
  --quoin-accent: oklch(0.269 0 0);
  --quoin-accent-foreground: oklch(0.985 0 0);
  --quoin-destructive: oklch(0.704 0.191 22.216);
  --quoin-radius: 0.625rem;
}
```

Out of the box that is a neutral grey editor that works in both modes with nothing configured.

Those are the only custom properties the stylesheet declares. Apart from them it reads `--tw-*`, which belong to the Tailwind runtime it is compiled with, and the `--radix-*` values Radix writes on its own portalled elements while they are open. Tailwind's theme tokens are imported by reference, so the package resolves `--spacing`, `--text-base`, `--container-md` and the rest at build time and declares none of them on your page.

### The prefix arrived in 0.2.0

Until 0.2.0 these names were unprefixed: `--background`, `--accent`, `--border` and the rest. That was sold as free theme inheritance, and for a shadcn-style host it was. It also meant Quoin read whatever a host happened to keep under those names.

The stock Vite React + TypeScript template is the case that forced the change. It declares `--accent` as a bright purple and `--border` on `:root` with meanings of its own, so a fresh `npm create vite` project that installed Quoin drew the selected slash-palette row on that purple while keeping Quoin's own near-black `--accent-foreground`. The pair measures around 3.2:1, under the 4.5:1 that WCAG AA asks for, with nothing done wrong by the consumer.

A fallback form such as `var(--quoin-accent, var(--accent))` does not fix that, because the colliding value is exactly what gets read when only the unprefixed name is set. So the prefix is unconditional, and the inheritance is no longer free. If your theme stopped reaching Quoin when you upgraded, this is why, and the next section is how to hand it over again.

### Mapping your own tokens

Point the prefixed names at your own in one block on `.quoin`. The canvas root carries that class, and so do the menus, palette, select and dialog Quoin renders into `document.body`, so one rule covers all of them.

```css
.quoin {
  --quoin-background: var(--background);
  --quoin-foreground: var(--foreground);
  --quoin-muted: var(--muted);
  --quoin-muted-foreground: var(--muted-foreground);
  --quoin-secondary: var(--secondary);
  --quoin-secondary-foreground: var(--secondary-foreground);
  --quoin-popover: var(--popover);
  --quoin-popover-foreground: var(--popover-foreground);
  --quoin-border: var(--border);
  --quoin-input: var(--input);
  --quoin-ring: var(--ring);
  --quoin-primary: var(--primary);
  --quoin-primary-foreground: var(--primary-foreground);
  --quoin-accent: var(--accent);
  --quoin-accent-foreground: var(--accent-foreground);
  --quoin-destructive: var(--destructive);
  --quoin-radius: var(--radius);
}
```

That one block covers both modes: the tokens on the right already flip with your own dark class, and each mapping beats Quoin's `:root` and `.dark` defaults alike. Write it unlayered, or in a layer that sorts after `quoin`, so it outranks those defaults.

To change one token rather than adopt a whole theme, declare it on `:root`, and pair it with a `.dark` rule if you theme dark at all. Pinning a token on `:root` alone also beats Quoin's `.dark` value for it, which would freeze that one token in its light form.

```css
:root {
  --quoin-primary: oklch(0.55 0.2 260);
  --quoin-radius: 0.5rem;
}

.dark {
  --quoin-primary: oklch(0.72 0.17 260);
}
```

### Dark mode

Dark mode keys on a `.dark` class on an ancestor (for example `<html class="dark">`), not on `prefers-color-scheme`. Quoin redefines its own tokens under `.dark`, and its `dark:` variants follow the same class, so the two cannot disagree when a visitor's OS theme differs from your app's theme.

### Resets

Quoin does not reset your page. The stylesheet contains no `html`, `body`, heading, list or other element rules, and no universal `*` reset. Its own reset (box sizing, zero margins, unstyled lists and form controls) applies only inside a `.quoin` element: the canvas root, and the menus, palette, select and dialog that Quoin renders into `document.body`, which carry the class themselves. Your headings, paragraphs, lists and buttons keep whatever styles you gave them, or the browser's.

All of Quoin's own rules are in cascade layers, so an **unlayered** global reset of yours beats them. A host that ships one (Bootstrap's reboot, or a hand-rolled `* { margin: 0; padding: 0; border: 0 }`) will see Quoin's padding and borders vanish. Tailwind 4's preflight is itself layered and is fine. Either declare your reset in a layer that comes before Quoin's, or scope it away from `.quoin`:

```css
@layer reset, theme, base, components, quoin, utilities;

@layer reset {
  * { margin: 0; padding: 0; border: 0; }
}
```

```css
*:where(:not(.quoin, .quoin *)) { margin: 0; padding: 0; border: 0; }
```

The layer statement has to come before Quoin's stylesheet is parsed, so put it first in your own CSS or in an inline `<style>` in the document head.

### Cascade layers and import order

Everything the stylesheet paints is inside one top-level cascade layer called `quoin`, with nested layers for its own theme, base and utilities inside it. Nothing it ships lands in a bare `theme`, `base`, `components` or `utilities` layer.

That changed in 0.2.0, and it had to. Until then the package imported Tailwind's utilities into the bare `utilities` layer, so in a Tailwind host they appended into the host's own `utilities` layer, after the host's rules, and beat them on source order. One bare `.hidden { display: none }` from the package was enough to keep every element carrying `hidden md:block` hidden at every width, across the whole application.

The package cannot settle this on its own, because a browser orders layers by first appearance. A host whose own Tailwind is parsed first registers `theme`, `base`, `components` and `utilities` before `quoin` appears, so `quoin` sorts last and still wins. Name the order yourself, as the first thing in your stylesheet, and import Quoin into it:

```css
@layer theme, base, components, quoin, utilities;
@import "quoin-editor/styles.css" layer(quoin);
```

With `quoin` named before `utilities`, your own utilities outrank Quoin's, including the responsive ones, while Quoin still outranks your `components`.

Naming it first instead puts every layer of yours above the package:

```css
@layer quoin, theme, base, components, utilities;
@import "quoin-editor/styles.css" layer(quoin);
```

Layer position settles more than which utility wins. It also settles who owns a custom property both of you declare on `:root`, which is why it is worth deciding rather than inheriting. Quoin no longer declares any name Tailwind owns, because it imports Tailwind's theme by reference, but a package that does, including Quoin before 0.2.0, resizes every `p-4` on the page from whichever layer sorts last.

**Upgrading alone does not fix this.** Import 0.2.0 the way 0.1.1 was imported, with no layer statement of your own, and a host's `hidden md:block` still computes to `display: none`, exactly as before. The layer the package ships is what makes the fix available to you; the two lines above are what apply it.

Importing the stylesheet from a root layout, or with a plain `import 'quoin-editor/styles.css'` in JavaScript, gives you no say in where the layer lands. The bundler decides, and in a Tailwind host that usually means Quoin's layer sorts last. That is fine for an application with no Tailwind of its own, and it is what the samples in this README do for brevity. A Tailwind host should use the two lines above and drop the JavaScript import.

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

`useMarkdownKeymap` and `useAutoGrow` are importable from a React Server Component, because the module that exports them carries no `'use client'` banner. Being hooks, they are callable only from a client component.

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

Everything in the table is re-exported from the main `quoin-editor` entry too, alongside `TEXT_COMMANDS`, the built-in slash-palette entries. Import from `quoin-editor/headless` when you want the transforms without the components behind them, and from `quoin-editor` when you are already importing `BlockCanvas`.

```ts
import { toggleLinePrefix } from 'quoin-editor';

export function heading(text: string, start: number, end: number): string {
  return toggleLinePrefix('h2', text, start, end).value;
}
```

The main entry carries a `'use client'` banner, so a React Server Component has to import from `quoin-editor/headless` rather than from `quoin-editor`.

## Exports

From `quoin-editor`: `BlockCanvas`, `QuoinProvider`, `useQuoin`, `defineBlock`, `blockByType`, `paletteBlocks`, `coreBlocks`, `UploadField`, `FilePickerButton`, `TEXT_COMMANDS`, `useBlockList`, `useAutosave`, `useAutoGrow`, and the headless transforms and hooks, with their types (`QuoinBlock`, `UploadFn`, `UploadResult`, `BlockDefinition`, `AnyBlockDefinition`, `BlockEditorProps`, `BlockPreviewProps`, `BlockCanvasProps`, `UploadFieldProps`, `FilePickerButtonProps` and others).

From `quoin-editor/headless`: the transforms and the two hooks listed above, with no UI.

From `quoin-editor/styles.css`: the stylesheet.

## Licence

MIT. Copyright (c) 2026 Amine Sboui. See [LICENSE](LICENSE).
