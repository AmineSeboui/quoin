import { render, screen } from '@testing-library/react';
import { QuoinProvider } from '../context';
import { MarkdownPreview, CodePreview, ImagePreview, FilePreview, CalloutPreview } from './previews';

const wrap = (ui: React.ReactElement) =>
  render(<QuoinProvider value={{ blockTypes: [] }}>{ui}</QuoinProvider>);

describe('previews', () => {
  it('shows markdown as readable text', () => {
    wrap(<MarkdownPreview data={{ markdown: '# Hello' }} />);
    expect(screen.getByText('# Hello')).toBeInTheDocument();
  });

  it('shows a placeholder for an empty markdown block', () => {
    wrap(<MarkdownPreview data={{ markdown: '' }} />);
    expect(screen.getByText(/empty/i)).toBeInTheDocument();
  });

  it('shows code inside a pre element', () => {
    const { container } = wrap(<CodePreview data={{ code: 'x = 1', language: 'py' }} />);
    expect(container.querySelector('pre')).toHaveTextContent('x = 1');
  });

  it('resolves an image through the configured resolver', () => {
    render(
      <QuoinProvider value={{ blockTypes: [], resolveAssetUrl: (k) => `/cdn/${k}` }}>
        <ImagePreview data={{ storageKey: 'a.png', alt: 'A cat' }} />
      </QuoinProvider>,
    );
    expect(screen.getByAltText('A cat')).toHaveAttribute('src', '/cdn/a.png');
  });

  it('shows a hint instead of a broken image when no key is set', () => {
    wrap(<ImagePreview data={{ storageKey: '', alt: '' }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('No image chosen')).toBeInTheDocument();
  });

  it('names the attached file', () => {
    wrap(<FilePreview data={{ storageKey: 'k', filename: 'notes.pdf' }} />);
    expect(screen.getByText('notes.pdf')).toBeInTheDocument();
  });

  it('shows callout text from the body field the editor writes', () => {
    wrap(<CalloutPreview data={{ tone: 'info', body: 'Heads up' }} />);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });
});
