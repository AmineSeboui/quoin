'use client';

import { Upload } from 'lucide-react';
import { Button } from '../ui/button';

/** Props for `FilePickerButton`. */
export type FilePickerButtonProps = {
  /** Labels the button and the file input behind it. */
  label: string;
  /** An `accept` attribute for the file input, such as `'image/*'` or `'.pdf'`. */
  accept?: string;
  /** Greys the button out and disables the input behind it. */
  disabled?: boolean;
  /** Called with the chosen file, and again if the same file is picked after a failure. */
  onPick: (file: File) => void;
};

/** A button that opens the file picker and hands back the chosen file, performing no upload of its own. */
// The input itself stays focusable and labelled, laid transparently over the
// button, so the keyboard and the pointer both land on the real control. The
// wrapper paints the focus ring the invisible input cannot show.
export function FilePickerButton({ label, accept, disabled, onPick }: FilePickerButtonProps) {
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
