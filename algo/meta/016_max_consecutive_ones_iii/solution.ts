/** Returns the longest run of 1s achievable by flipping at most k zeros. */
export function longestOnes(nums: number[], k: number): number {
  // Sliding window that holds at most k zeros; shrink from the left when it overflows.
  let left = 0;
  let zeros = 0;
  let best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeros++;
    while (zeros > k) {
      if (nums[left] === 0) zeros--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
