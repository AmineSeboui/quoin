import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoinProvider } from '../context';
import { blockByType } from '../registry';
import { coreBlocks } from './core';

const TYPED = 'distinctive-round-trip-text';

const CASES = [
  { type: 'MARKDOWN', field: 'Markdown' },
  { type: 'CALLOUT', field: 'Callout text' },
  { type: 'CODE', field: 'Code' },
] as const;

describe('editor to preview round trip', () => {
  it.each(CASES)('$type preview shows what its editor wrote', ({ type, field }) => {
    const block = blockByType(coreBlocks, type)!;
    const Editor = block.editor;
    const Preview = block.preview!;
    let captured: Record<string, unknown> = block.initialData?.() ?? {};

    function Canvas() {
      const [data, setData] = React.useState(captured);
      return (
        <Editor
          data={data}
          onChange={(next) => {
            captured = next;
            setData(next);
          }}
        />
      );
    }

    const editing = render(
      <QuoinProvider value={{ blockTypes: coreBlocks }}>
        <Canvas />
      </QuoinProvider>,
    );
    fireEvent.change(screen.getByLabelText(field), { target: { value: TYPED } });
    editing.unmount();

    render(
      <QuoinProvider value={{ blockTypes: coreBlocks }}>
        <Preview data={captured} />
      </QuoinProvider>,
    );
    expect(screen.getByText(TYPED)).toBeInTheDocument();
  });
});
