/** A document is an ordered array of these; `type` is looked up in the registered block definitions. */
export type QuoinBlock = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

/** What your upload function resolves with so Quoin can reference the stored file later. */
export type UploadResult = {
  /** Opaque key your storage uses to find the file again. */
  storageKey: string;
  filename: string;
  size: number;
  /** Your own record id for the file, if you track one. */
  assetId?: string;
};

/**
 * Stores a file and returns its key. Quoin never performs the request itself.
 * `category` names what the file is for (for example an image or a recording) so you can route it.
 * Reject with an Error whose message is safe to show the user: it is rendered
 * verbatim beside the upload button. A non-Error rejection or an empty message shows a generic "Upload failed." instead.
 * A raw `fetch` rejection such as "Failed to fetch" would surface verbatim, so catch and rethrow with your own wording.
 * The control is disabled while an upload is in flight.
 */
export type UploadFn = (file: File, category: string) => Promise<UploadResult>;

/** Props for a block's read-only rendering, which is what you see for every block you are not editing. */
export type BlockPreviewProps<D = Record<string, unknown>> = {
  data: D;
  /** Id of the block being drawn, for anchors and keys. */
  blockId?: string;
};

/** Props for a block's editing surface; call `onChange` with the whole next data, not a patch. */
export type BlockEditorProps<D = Record<string, unknown>> = {
  data: D;
  onChange: (data: D) => void;
  /** Inserts a new block of the given type after this one. */
  onInsertBlock?: (type: string) => void;
  /** Leaves edit mode and returns to the preview. */
  onDone?: () => void;
};
