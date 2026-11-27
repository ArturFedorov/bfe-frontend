/** Rearranges nums in place into its lexicographically next permutation. */
export function nextPermutation(nums: number[]): void {
  // Find the rightmost ascent i, swap nums[i] with the smallest larger value to its
  // right, then reverse the (non-increasing) suffix to make it as small as possible.
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  let lo = i + 1;
  let hi = nums.length - 1;
  while (lo < hi) {
    [nums[lo], nums[hi]] = [nums[hi], nums[lo]];
    lo++;
    hi--;
  }
}
