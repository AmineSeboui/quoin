import { describe, it, expect, vi } from 'vitest';
import { formatShortcut } from './shortcut-label';

function userAgent(value: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value, configurable: true });
}

const ORIGINAL = window.navigator.userAgent;

afterEach(() => userAgent(ORIGINAL));

describe('formatShortcut', () => {
  it('uses the mac symbols with no separator', () => {
    userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    expect(formatShortcut('mod+alt+2')).toBe('⌘⌥2');
    expect(formatShortcut('mod+shift+8')).toBe('⌘⇧8');
  });

  it('uses spelled out modifiers elsewhere', () => {
    userAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(formatShortcut('mod+alt+2')).toBe('Ctrl+Alt+2');
  });

  it('upper cases a letter key', () => {
    userAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(formatShortcut('mod+b')).toBe('Ctrl+B');
  });
});
