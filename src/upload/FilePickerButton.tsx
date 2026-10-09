'use client';

import { Upload } from 'lucide-react';
import { Button } from '../ui/button';

/** The input itself stays focusable and labelled, laid transparently over the
 *  button, so the keyboard and the pointer both land on the real control. The
 *  wrapper paints the focus ring the invisible input cannot show. */
export function FilePickerButton({
  label,
  accept,
  disabled,
  onPick,
}: {
  label: string;
  accept?: string;
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <span className="relative inline-flex rounded-md has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
      <Button asChild variant="outline" size="sm">
        <span aria-hidden="true" className={disabled ? 'pointer-events-none opacity-50' : undefined}>
          <Upload aria-hidden="true" />
          {label}
        </span>
      </Button>
      <input
        type="file"
        accept={accept}
        aria-label={label}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear so picking the same file again still fires `change`, which is what makes retry after a failed upload work.
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
    </span>
  );
}
