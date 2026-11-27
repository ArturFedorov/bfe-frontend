import { minAddToMakeValid } from './min_add_to_make_valid';

describe('minAddToMakeValid', () => {
  it('example: one extra closer', () => {
    expect(minAddToMakeValid('())')).toBe(1);
  });

  it('example: three unclosed openers', () => {
    expect(minAddToMakeValid('(((')).toBe(3);
  });

  it('returns 0 for a valid string', () => {
    expect(minAddToMakeValid('()')).toBe(0);
    expect(minAddToMakeValid('(()())')).toBe(0);
  });

  it('returns 0 for an empty string', () => {
    expect(minAddToMakeValid('')).toBe(0);
  });

  it('handles single characters', () => {
    expect(minAddToMakeValid('(')).toBe(1);
    expect(minAddToMakeValid(')')).toBe(1);
  });

  it('handles a reversed pair (cannot cancel each other)', () => {
    expect(minAddToMakeValid(')(')).toBe(2);
  });

  it('counts both unmatched closers and openers', () => {
    expect(minAddToMakeValid('()))((')).toBe(4);
  });

  it('handles only closers', () => {
    expect(minAddToMakeValid(')))))')).toBe(5);
  });

  it('handles nested mixed input', () => {
    expect(minAddToMakeValid('(()))(()')).toBe(2);
  });

  it('runs in linear time on a large input', () => {
    const n = 100_000;
    expect(minAddToMakeValid(')('.repeat(n / 2))).toBe(2);
    expect(minAddToMakeValid('('.repeat(n) + ')'.repeat(n / 2))).toBe(n / 2);
    expect(minAddToMakeValid('()'.repeat(n / 2))).toBe(0);
  });
});
