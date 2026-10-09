import { useState } from 'react';

const ACCENTS = [
  { name: 'Default', primary: null },
  { name: 'Violet', primary: 'oklch(0.55 0.22 290)' },
  { name: 'Teal', primary: 'oklch(0.55 0.12 190)' },
  { name: 'Rose', primary: 'oklch(0.58 0.22 10)' },
];

function applyAccent(primary: string | null) {
  const style = document.documentElement.style;
  for (const name of ['--primary', '--primary-foreground', '--ring']) {
    if (primary) style.setProperty(name, name === '--primary-foreground' ? 'oklch(0.985 0 0)' : primary);
    else style.removeProperty(name);
  }
}

export function AccentPicker() {
  const [active, setActive] = useState('Default');

  function choose(name: string, primary: string | null) {
    setActive(name);
    applyAccent(primary);
  }

  return (
    <div className="accent-picker" role="group" aria-label="Accent colour">
      {ACCENTS.map(({ name, primary }) => (
        <button
          key={name}
          type="button"
          className="swatch"
          aria-pressed={active === name}
          onClick={() => choose(name, primary)}
        >
          <span className="swatch-dot" style={{ background: primary ?? 'var(--foreground)' }} />
          {name}
        </button>
      ))}
    </div>
  );
}
