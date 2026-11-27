import { maximumSwap } from './maximum_swap';

describe('maximumSwap', () => {
  it('example: swaps the first digit with the max', () => {
    expect(maximumSwap(2736)).toBe(7236);
  });

  it('example: already maximal', () => {
    expect(maximumSwap(9973)).toBe(9973);
  });

  it('example: swaps with the LAST occurrence of the larger digit', () => {
    expect(maximumSwap(1993)).toBe(9913);
  });

  it('handles zero', () => {
    expect(maximumSwap(0)).toBe(0);
  });

  it('handles a single digit', () => {
    expect(maximumSwap(7)).toBe(7);
  });

  it('handles all identical digits', () => {
    expect(maximumSwap(1111)).toBe(1111);
  });

  it('handles non-increasing digits (no swap)', () => {
    expect(maximumSwap(98765)).toBe(98765);
    expect(maximumSwap(10)).toBe(10);
  });

  it('handles strictly increasing digits', () => {
    expect(maximumSwap(12345)).toBe(52341);
  });

  it('skips a prefix that is already optimal', () => {
    expect(maximumSwap(98368)).toBe(98863);
  });

  it('moves a trailing larger digit past zeros', () => {
    expect(maximumSwap(1009)).toBe(9001);
    expect(maximumSwap(100)).toBe(100);
  });

  it('handles the upper bound', () => {
    expect(maximumSwap(100_000_000)).toBe(100_000_000);
    expect(maximumSwap(99_999_998)).toBe(99_999_998);
    expect(maximumSwap(19_999_999)).toBe(99_999_991);
  });
});
