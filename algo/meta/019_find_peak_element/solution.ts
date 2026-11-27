/** Returns the index of any peak element in `nums` in O(log n). */
export function findPeakElement(nums: number[]): number {
  let lo = 0;
  let hi = nums.length - 1;
  // Invariant: a peak exists in [lo, hi]; walk uphill toward it.
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
