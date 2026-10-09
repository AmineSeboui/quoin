import { render, screen } from '@testing-library/react';
import { QuoinProvider, useQuoin } from './context';

function Probe() {
  const { upload, resolveAssetUrl, onError, blockTypes } = useQuoin();
  return (
    <div>
      <span data-testid="upload">{upload ? 'yes' : 'no'}</span>
      <span data-testid="url">{resolveAssetUrl('abc')}</span>
      <span data-testid="types">{blockTypes.length}</span>
      <button onClick={() => onError(new Error('boom'))}>fail</button>
    </div>
  );
}

describe('QuoinProvider', () => {
  it('defaults resolveAssetUrl to the identity function', () => {
    render(<QuoinProvider value={{ blockTypes: [] }}><Probe /></QuoinProvider>);
    expect(screen.getByTestId('url')).toHaveTextContent('abc');
  });

  it('reports no upload function when none is supplied', () => {
    render(<QuoinProvider value={{ blockTypes: [] }}><Probe /></QuoinProvider>);
    expect(screen.getByTestId('upload')).toHaveTextContent('no');
  });

  it('passes the supplied block types through', () => {
    const types = [{ type: 'X', label: 'X', icon: (() => null) as never, editor: () => null }];
    render(<QuoinProvider value={{ blockTypes: types }}><Probe /></QuoinProvider>);
    expect(screen.getByTestId('types')).toHaveTextContent('1');
  });

  it('throws a named error when used outside a provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/QuoinProvider/);
    quiet.mockRestore();
  });
});
