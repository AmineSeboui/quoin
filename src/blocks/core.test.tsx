import { render, screen } from '@testing-library/react';
import { QuoinProvider } from '../context';
import { blockByType } from '../registry';
import { coreBlocks } from './core';

describe('coreBlocks', () => {
  it('registers the five core types', () => {
    expect(coreBlocks.map((b) => b.type)).toEqual(['MARKDOWN', 'CALLOUT', 'CODE', 'IMAGE', 'FILE']);
  });

  it('gives every core type a label, an icon and a preview', () => {
    for (const block of coreBlocks) {
      expect(block.label).toBeTruthy();
      expect(block.icon).toBeTruthy();
      expect(block.preview).toBeTruthy();
    }
  });

  it('starts a markdown block with empty markdown', () => {
    expect(blockByType(coreBlocks, 'MARKDOWN')?.initialData?.()).toEqual({ markdown: '' });
  });

  it('seeds the callout with the body field its editor writes', () => {
    expect(blockByType(coreBlocks, 'CALLOUT')?.initialData?.()).toEqual({ tone: 'info', body: '' });
  });

  it('renders the markdown editor through its definition', () => {
    const definition = blockByType(coreBlocks, 'MARKDOWN');
    const Editor = definition!.editor;
    render(
      <QuoinProvider value={{ blockTypes: coreBlocks }}>
        <Editor data={{ markdown: 'hello' }} onChange={() => {}} />
      </QuoinProvider>,
    );
    expect(screen.getByLabelText('Markdown')).toHaveValue('hello');
  });
});
