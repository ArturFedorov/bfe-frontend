import { nextPermutation } from './next_permutation';

const run = (nums: number[]): number[] => {
  nextPermutation(nums);
  return nums;
};

describe('nextPermutation', () => {
  it('[1,2,3] -> [1,3,2]', () => {
    expect(run([1, 2, 3])).toEqual([1, 3, 2]);
  });

  it('wraps the last permutation to the first', () => {
    expect(run([3, 2, 1])).toEqual([1, 2, 3]);
  });

  it('handles duplicates', () => {
    expect(run([1, 1, 5])).toEqual([1, 5, 1]);
  });

  it('mutates in place and returns undefined', () => {
    const nums = [1, 3, 2];
    const ret = nextPermutation(nums);
    expect(ret).toBeUndefined();
    expect(nums).toEqual([2, 1, 3]);
  });

  it('single element is unchanged', () => {
    expect(run([7])).toEqual([7]);
  });

  it('all equal elements stay the same', () => {
    expect(run([2, 2, 2])).toEqual([2, 2, 2]);
  });

  it('swaps with the smallest larger element in the suffix', () => {
    expect(run([1, 5, 8, 4, 7, 6, 5, 3, 1])).toEqual([
      1, 5, 8, 5, 1, 3, 4, 6, 7,
    ]);
  });

  it('duplicates in the suffix', () => {
    expect(run([2, 3, 1, 3, 3])).toEqual([2, 3, 3, 1, 3]);
    expect(run([1, 5, 1])).toEqual([5, 1, 1]);
  });

  it('two elements', () => {
    expect(run([1, 2])).toEqual([2, 1]);
    expect(run([2, 1])).toEqual([1, 2]);
  });

  it('cycles through all permutations of [1,2,3]', () => {
    const nums = [1, 2, 3];
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      nextPermutation(nums);
      seen.push(nums.join(''));
    }
    expect(seen).toEqual(['132', '213', '231', '312', '321', '123']);
  });

  it('large input (10^5) in linear time', () => {
    const n = 100_000;
    const nums = Array.from({ length: n }, (_, i) => n - i); // descending
    nextPermutation(nums);
    expect(nums[0]).toBe(1);
    expect(nums[n - 1]).toBe(n);
    const asc = Array.from({ length: n }, (_, i) => i);
    nextPermutation(asc);
    expect(asc[n - 2]).toBe(n - 1);
    expect(asc[n - 1]).toBe(n - 2);
  });
});
