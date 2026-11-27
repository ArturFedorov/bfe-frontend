/** First index i with nums[i] >= x (nums.length if none). */
function lowerBound(nums: number[], x: number): number {
  let lo = 0;
  let hi = nums.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Returns [first, last] index of `target` in sorted `nums`, or [-1, -1]. */
export function searchRange(nums: number[], target: number): [number, number] {
  const first = lowerBound(nums, target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  // Integers: the first element > target is the lower bound of target + 1.
  return [first, lowerBound(nums, target + 1) - 1];
}
