import { describe, it, expect } from 'vitest';
import { VERSION } from './index';

describe('package entry', () => {
  it('exposes a version string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
