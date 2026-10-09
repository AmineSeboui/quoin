import type { ReactNode } from 'react';

export function Section({ id, title, lede, children }: { id: string; title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </section>
  );
}
