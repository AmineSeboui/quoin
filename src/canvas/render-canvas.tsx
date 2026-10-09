import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QuoinProvider } from '../context';
import { coreBlocks } from '../blocks/core';
import type { AnyBlockDefinition } from '../registry';

export function renderCanvas(ui: ReactElement, blockTypes: AnyBlockDefinition[] = coreBlocks) {
  return render(<QuoinProvider value={{ blockTypes }}>{ui}</QuoinProvider>);
}
