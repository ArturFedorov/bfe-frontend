import { checkSubarraySum } from './continuous_subarray_sum';

describe('checkSubarraySum', () => {
  it('[23,2,4,6,7], k=6 -> true', () => {
    expect(checkSubarraySum([23, 2, 4, 6, 7], 6)).toBe(true);
  });

  it('[23,2,6,4,7], k=6 -> true (whole array)', () => {
    expect(checkSubarraySum([23, 2, 6, 4, 7], 6)).toBe(true);
  });

  it('[23,2,6,4,7], k=13 -> false', () => {
    expect(checkSubarraySum([23, 2, 6, 4, 7], 13)).toBe(false);
  });

  it('single element can never qualify', () => {
    expect(checkSubarraySum([6], 6)).toBe(false);
    expect(checkSubarraySum([0], 1)).toBe(false);
  });

  it('single element divisible by k does not count on its own', () => {
    expect(checkSubarraySum([1, 6], 6)).toBe(false);
  });

  it('two zeros sum to 0, a multiple of any k', () => {
    expect(checkSubarraySum([0, 0], 7)).toBe(true);
    expect(checkSubarraySum([5, 0, 0, 3], 100)).toBe(true);
  });

  it('a single zero next to a non-multiple is not enough', () => {
    expect(checkSubarraySum([1, 0], 2)).toBe(false);
  });

  it('k = 1 is satisfied by any length-2 subarray', () => {
    expect(checkSubarraySum([4, 9], 1)).toBe(true);
  });

  it('match only when earliest remainder index is kept', () => {
    expect(checkSubarraySum([5, 2, 4], 5)).toBe(false);
    expect(checkSubarraySum([2, 4, 3], 6)).toBe(true);
  });

  it('large values', () => {
    expect(
      checkSubarraySum([1_000_000_000, 1_000_000_000], 2_000_000_000),
    ).toBe(true);
    expect(checkSubarraySum([1_000_000_000, 1], 2_147_483_647)).toBe(false);
  });

  it('large input (10^5) in linear time', () => {
    const n = 100_000;
    const nums = new Array<number>(n).fill(1);
    expect(checkSubarraySum(nums, 2_000_000_000)).toBe(false);
    nums[n - 1] = 0;
    nums[n - 2] = 0;
    expect(checkSubarraySum(nums, 2_000_000_000)).toBe(true);
  });
});
