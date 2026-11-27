/** Returns the index of `target` in the rotated sorted array `nums`, or -1. */
export function search(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const midVal = nums[mid];
    if (midVal === target) return mid;
    const loVal = nums[lo];
    // One half is always sorted; keep it only if target falls inside its range.
    if (loVal <= midVal) {
      if (loVal <= target && target < midVal) hi = mid - 1;
      else lo = mid + 1;
    } else {
      const hiVal = nums[hi];
      if (midVal < target && target <= hiVal) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
