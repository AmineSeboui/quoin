const MAC_LABEL: Record<string, string> = { mod: '⌘', alt: '⌥', shift: '⇧' };
const OTHER_LABEL: Record<string, string> = { mod: 'Ctrl', alt: 'Alt', shift: 'Shift' };

function onMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/.test(navigator.userAgent);
}

/** Renders a "mod+shift+b" style hint as the platform's own label, such as ⌘⇧B on a Mac and Ctrl+Shift+B elsewhere. */
export function formatShortcut(hint: string): string {
  const mac = onMac();
  const labels = mac ? MAC_LABEL : OTHER_LABEL;
  const parts = hint.split('+').map((part) => labels[part] ?? part.toUpperCase());
  return parts.join(mac ? '' : '+');
}
