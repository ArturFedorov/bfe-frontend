import { subarraySum } from './subarray_sum_equals_k';

describe('subarraySum', () => {
  it('[1,1,1], k=2 -> 2', () => {
    expect(subarraySum([1, 1, 1], 2)).toBe(2);
  });

  it('[1,2,3], k=3 -> 2', () => {
    expect(subarraySum([1, 2, 3], 3)).toBe(2);
  });

  it('[1,-1,0], k=0 -> 3', () => {
    expect(subarraySum([1, -1, 0], 0)).toBe(3);
  });

  it('single element equal / not equal to k', () => {
    expect(subarraySum([5], 5)).toBe(1);
    expect(subarraySum([5], 4)).toBe(0);
  });

  it('no match', () => {
    expect(subarraySum([1, 2, 3], 100)).toBe(0);
  });

  it('negative k', () => {
    expect(subarraySum([-1, -1, 1], -1)).toBe(3);
    expect(subarraySum([3, -5, 2, -4], -7)).toBe(1);
  });

  it('all zeros with k=0 counts every subarray', () => {
    expect(subarraySum([0, 0, 0, 0], 0)).toBe(10);
  });

  it('whole array is the only match', () => {
    expect(subarraySum([2, -1, 4], 5)).toBe(1);
  });

  it('mixed signs with overlapping matches', () => {
    expect(subarraySum([3, 4, 7, 2, -3, 1, 4, 2], 7)).toBe(4);
  });

  it('large input (10^5) in linear time', () => {
    const n = 100_000;
    const ones = new Array<number>(n).fill(1);
    expect(subarraySum(ones, 1000)).toBe(n - 1000 + 1);
    const zeros = new Array<number>(n).fill(0);
    expect(subarraySum(zeros, 0)).toBe((n * (n + 1)) / 2);
  });
});
