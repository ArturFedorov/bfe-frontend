/** Returns every subset (the power set) of a list of distinct integers. */
export function subsets(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];

  // Every node of the recursion tree is a subset: record it, then extend it
  // only with later indices so each subset is built exactly once.
  const backtrack = (start: number): void => {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  };

  backtrack(0);
  return result;
}
