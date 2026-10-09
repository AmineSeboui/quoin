import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ShortcutsReference } from './ShortcutsReference';

describe('ShortcutsReference', () => {
  it('lists the formatting shortcuts', () => {
    render(<ShortcutsReference open onOpenChange={vi.fn()} />);
    for (const label of ['Bold', 'Italic', 'Inline code', 'Link', 'Heading', 'Bullet list', 'Indent item']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('explains the palette and the list behaviour', () => {
    render(<ShortcutsReference open onOpenChange={vi.fn()} />);
    expect(screen.getByText(/open the command palette/i)).toBeInTheDocument();
    expect(screen.getByText(/continue a list/i)).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(<ShortcutsReference open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText('Bold')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    render(<ShortcutsReference open onOpenChange={vi.fn()} />);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
