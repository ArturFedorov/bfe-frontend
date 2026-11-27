/** Returns true if some subarray of length >= 2 sums to a multiple of k. */
export function checkSubarraySum(nums: number[], k: number): boolean {
  // Two prefixes with the same remainder mod k bound a subarray whose sum is divisible by k.
  const firstIndex = new Map<number, number>([[0, -1]]);
  let remainder = 0;
  for (let i = 0; i < nums.length; i++) {
    remainder = (remainder + nums[i]) % k;
    const prev = firstIndex.get(remainder);
    if (prev === undefined) {
      firstIndex.set(remainder, i);
    } else if (i - prev >= 2) {
      return true;
    }
  }
  return false;
}
