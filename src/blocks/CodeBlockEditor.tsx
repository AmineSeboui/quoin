'use client';

import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import type { BlockEditorProps } from '../types';
import { str } from './str';

export function CodeBlockEditor({ data, onChange }: BlockEditorProps) {
  const set = (patch: Record<string, unknown>) => onChange({ ...data, ...patch });

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium leading-none">Language</span>
        <Input
          aria-label="Language"
          value={str(data.language)}
          onChange={(e) => set({ language: e.target.value })}
          className="text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium leading-none">Code</span>
        <Textarea
          aria-label="Code"
          value={str(data.code)}
          onChange={(e) => set({ code: e.target.value })}
          className="min-h-32 font-mono text-sm"
        />
      </label>
    </div>
  );
}
