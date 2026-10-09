import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QuoinProvider } from '../../src/context';
import { coreBlocks } from '../../src/blocks/core';
import type { AnyBlockDefinition } from '../../src/registry';

export function renderCanvas(ui: ReactElement, blockTypes: AnyBlockDefinition[] = coreBlocks) {
  return render(<QuoinProvider value={{ blockTypes }}>{ui}</QuoinProvider>);
}
