'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { BlockEditorProps } from '../types';
import { str } from './str';

const CALLOUT_TONES = ['info', 'tip', 'warning', 'success', 'danger'] as const;

export function CalloutBlockEditor({ data, onChange }: BlockEditorProps) {
  const set = (patch: Record<string, unknown>) => onChange({ ...data, ...patch });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium leading-none">Tone</span>
        <Select value={str(data.tone) || 'info'} onValueChange={(v) => set({ tone: v })}>
          <SelectTrigger aria-label="Callout tone" className="w-40 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALLOUT_TONES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium leading-none">Callout text</span>
        <Textarea value={str(data.body)} onChange={(e) => set({ body: e.target.value })} className="text-sm" />
      </label>
    </div>
  );
}
