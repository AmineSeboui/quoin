import { render, screen, fireEvent } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { axe } from 'vitest-axe';
import { QuoinProvider } from '../context';
import { defineBlock } from '../registry';
import { SlashPalette } from './SlashPalette';

const testBlocks = [
  defineBlock({ type: 'MARKDOWN', label: 'Markdown', icon: FileText, editor: () => null }),
  defineBlock({ type: 'CODE', label: 'Code', icon: FileText, editor: () => null }),
];

function renderPalette(ui: React.ReactElement, blockTypes = testBlocks) {
  return render(<QuoinProvider value={{ blockTypes }}>{ui}</QuoinProvider>);
}

function setup(overrides: Partial<Parameters<typeof SlashPalette>[0]> = {}) {
  const props = {
    open: true,
    caret: null,
    onOpenChange: vi.fn(),
    onTextCommand: vi.fn(),
    onBlockCommand: vi.fn(),
    onShortcuts: vi.fn(),
    onDismiss: vi.fn(),
    ...overrides,
  };
  renderPalette(<SlashPalette {...props} />);
  return props;
}

function search(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/search commands/i), { target: { value: text } });
}

describe('SlashPalette', () => {
  it('lists text commands and block commands in separate groups', () => {
    setup();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Code block')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Blocks')).toBeInTheDocument();
  });

  it('shows the shortcut for a command that has one', () => {
    setup();
    expect(screen.getByText('Subtitle').closest('[data-slot="command-item"]')).toHaveTextContent(/2$/);
  });

  it('filters by a keyword rather than only the label', () => {
    setup();
    search('todo');
    expect(screen.getByText('Task list')).toBeInTheDocument();
    expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
  });

  it('filters down to a block command', () => {
    setup();
    search('markdown');
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.queryByText('Heading')).not.toBeInTheDocument();
  });

  it('reports the chosen text command', () => {
    const props = setup();
    search('subtitle');
    fireEvent.click(screen.getByText('Subtitle'));
    expect(props.onTextCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'subtitle' }));
  });

  it('reports the chosen block type', () => {
    const props = setup();
    search('markdown');
    fireEvent.click(screen.getByText('Markdown'));
    expect(props.onBlockCommand).toHaveBeenCalledWith('MARKDOWN');
  });

  it('opens the shortcut reference from its own item', () => {
    const props = setup();
    search('keyboard');
    fireEvent.click(screen.getByText('Keyboard shortcuts'));
    expect(props.onShortcuts).toHaveBeenCalled();
  });

  it('says so when nothing matches', () => {
    setup();
    search('zzzz');
    expect(screen.getByText(/no command/i)).toBeInTheDocument();
  });

  it('dismisses on Escape', () => {
    const props = setup();
    fireEvent.keyDown(screen.getByPlaceholderText(/search commands/i), { key: 'Escape' });
    expect(props.onDismiss).toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    setup({ open: false });
    expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    setup();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('offers a host-registered block type', async () => {
    const custom = defineBlock({ type: 'CHART', label: 'Chart', icon: FileText, editor: () => null });
    renderPalette(
      <SlashPalette
        open
        caret={{ top: 0, left: 0, height: 16 }}
        onOpenChange={() => {}}
        onTextCommand={() => {}}
        onBlockCommand={() => {}}
        onShortcuts={() => {}}
        onDismiss={() => {}}
      />,
      [...testBlocks, custom],
    );
    expect(await screen.findByText('Chart')).toBeInTheDocument();
  });
});
