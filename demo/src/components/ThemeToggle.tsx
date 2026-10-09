import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="icon-button" onClick={onToggle} aria-pressed={dark} aria-label="Dark mode">
      {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
