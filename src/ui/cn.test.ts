import { cn } from './cn';

describe('cn', () => {
  it('merges conflicting tailwind utilities, last one winning', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});
