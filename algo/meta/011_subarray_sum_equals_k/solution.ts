/** Counts contiguous non-empty subarrays of nums whose sum equals k. */
export function subarraySum(nums: number[], k: number): number {
  // sum(i..j) = prefix[j] - prefix[i-1]; count earlier prefixes equal to prefix - k.
  const seen = new Map<number, number>([[0, 1]]);
  let prefix = 0;
  let count = 0;
  for (const num of nums) {
    prefix += num;
    count += seen.get(prefix - k) ?? 0;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}
