/** One block in the document. `type` matches a registered BlockDefinition's type. */
export type QuoinBlock = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

/** What a host application returns once it has stored an uploaded file. */
export type UploadResult = {
  storageKey: string;
  filename: string;
  size: number;
  assetId?: string;
};

/**
 * Stores a file and returns its key. Quoin never performs the request itself.
 * Reject with an Error whose message is safe to show the user: it is rendered
 * verbatim beside the upload button.
 */
export type UploadFn = (file: File, category: string) => Promise<UploadResult>;

/** Props every block preview component receives. A preview draws a block at rest. */
export type BlockPreviewProps<D = Record<string, unknown>> = {
  data: D;
  blockId?: string;
};

/** Props every block editor component receives. */
export type BlockEditorProps<D = Record<string, unknown>> = {
  data: D;
  onChange: (data: D) => void;
  onInsertBlock?: (type: string) => void;
  onDone?: () => void;
};
