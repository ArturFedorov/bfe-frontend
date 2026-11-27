import { longestOnes } from './max_consecutive_ones_iii';

describe('longestOnes', () => {
  it('example 1 -> 6', () => {
    expect(longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2)).toBe(6);
  });

  it('example 2 -> 10', () => {
    expect(
      longestOnes([0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3),
    ).toBe(10);
  });

  it('all zeros with k = 0 -> 0', () => {
    expect(longestOnes([0, 0, 0], 0)).toBe(0);
  });

  it('k = 0 returns the longest existing run of ones', () => {
    expect(longestOnes([1, 1, 0, 1, 1, 1, 0, 1], 0)).toBe(3);
  });

  it('all ones', () => {
    expect(longestOnes([1, 1, 1, 1], 0)).toBe(4);
    expect(longestOnes([1, 1, 1, 1], 2)).toBe(4);
  });

  it('k at least the number of zeros covers the whole array', () => {
    expect(longestOnes([0, 1, 0, 1, 0], 3)).toBe(5);
    expect(longestOnes([0, 0, 0], 3)).toBe(3);
  });

  it('single element', () => {
    expect(longestOnes([0], 0)).toBe(0);
    expect(longestOnes([0], 1)).toBe(1);
    expect(longestOnes([1], 0)).toBe(1);
  });

  it('best window at the very start or end', () => {
    expect(longestOnes([1, 1, 0, 1, 0, 0, 0, 0], 1)).toBe(4);
    expect(longestOnes([0, 0, 0, 0, 1, 0, 1, 1], 1)).toBe(4);
  });

  it('k = 1 bridges two runs', () => {
    expect(longestOnes([1, 0, 1, 1, 0, 1], 1)).toBe(4);
  });

  it('large input (10^5) in linear time', () => {
    const n = 100_000;
    const nums = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 0 : 1));
    expect(longestOnes(nums, 1000)).toBe(2001);
    expect(longestOnes(nums, 0)).toBe(1);
    const zeros = new Array<number>(n).fill(0);
    expect(longestOnes(zeros, 5000)).toBe(5000);
    const ones = new Array<number>(n).fill(1);
    expect(longestOnes(ones, 0)).toBe(n);
  });
});
