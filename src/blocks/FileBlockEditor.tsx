'use client';

import { UploadField } from '../upload/UploadField';
import type { BlockEditorProps } from '../types';
import { str } from './str';

export function FileBlockEditor({ data, onChange }: BlockEditorProps) {
  const set = (patch: Record<string, unknown>) => onChange({ ...data, ...patch });

  return (
    <div className="flex flex-col gap-2">
      <UploadField
        category="file"
        label="Upload file"
        onUploaded={(r) => set({ storageKey: r.storageKey, filename: r.filename, size: r.size })}
      />
      {str(data.filename) && <span className="text-xs text-muted-foreground">{str(data.filename)} ✓</span>}
    </div>
  );
}
