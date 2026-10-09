'use client';

import * as React from 'react';
import type { AnyBlockDefinition } from './registry';
import type { UploadFn } from './types';

/** The resolved canvas configuration every block editor reads through `useQuoin`. */
export type QuoinConfig = {
  blockTypes: AnyBlockDefinition[];
  /** Absent when the host has not wired uploads; upload fields then render disabled. */
  upload?: UploadFn;
  resolveAssetUrl: (storageKey: string) => string;
  onError: (error: Error) => void;
};

/** What a host passes to `QuoinProvider`: only the block types are required. */
export type QuoinConfigInput = Partial<QuoinConfig> & {
  blockTypes: AnyBlockDefinition[];
};

const QuoinContext = React.createContext<QuoinConfig | null>(null);

/** Supplies the block registry and the host couplings (upload, asset URLs, error reporting) to every block below it. */
export function QuoinProvider({
  value,
  children,
}: {
  value: QuoinConfigInput;
  children: React.ReactNode;
}) {
  const { blockTypes, upload, resolveAssetUrl, onError } = value;
  const config = React.useMemo<QuoinConfig>(
    () => ({
      blockTypes,
      upload,
      // Identity default: an empty key resolves to an empty string, which stays falsy
      // wherever a resolved URL is tested for "no asset chosen yet".
      resolveAssetUrl: resolveAssetUrl ?? ((key: string) => key),
      onError: onError ?? ((error: Error) => console.error(error)),
    }),
    [blockTypes, upload, resolveAssetUrl, onError],
  );
  return <QuoinContext.Provider value={config}>{children}</QuoinContext.Provider>;
}

/** Reads the canvas configuration. Throws outside a QuoinProvider rather than returning a silent default. */
export function useQuoin(): QuoinConfig {
  const config = React.useContext(QuoinContext);
  if (!config) throw new Error('useQuoin must be used inside a QuoinProvider.');
  return config;
}
