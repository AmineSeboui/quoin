'use client';

import * as React from 'react';
import { useQuoin } from '../context';
import type { UploadResult } from '../types';
import { FilePickerButton } from './FilePickerButton';

/** Disables itself both while an upload is in flight and when the host configured no `upload` function. */
export function UploadField({
  category,
  label,
  accept,
  onUploaded,
}: {
  category: string;
  label: string;
  accept?: string;
  onUploaded: (result: UploadResult) => void;
}) {
  const { upload, onError } = useQuoin();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function run(file: File) {
    if (!upload) return;
    setBusy(true);
    setError(null);
    let result: UploadResult;
    try {
      result = await upload(file, category);
    } catch (cause) {
      setError((cause instanceof Error && cause.message) || 'Upload failed.');
      setBusy(false);
      return;
    }
    setBusy(false);
    try {
      onUploaded(result);
    } catch (cause) {
      onError(cause instanceof Error ? cause : new Error(String(cause)));
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <FilePickerButton
        label={label}
        accept={accept}
        disabled={busy || !upload}
        onPick={(file) => void run(file)}
      />
      {!upload && (
        <span role="note" className="text-xs text-muted-foreground">
          Uploads are not configured for this editor.
        </span>
      )}
      {busy && <span role="status" className="text-xs text-muted-foreground">Uploading...</span>}
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
