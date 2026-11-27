/** Returns the k most frequent values in `nums`, in any order. */
export function topKFrequent(nums: number[], k: number): number[] {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);

  // Bucket sort: a frequency is at most nums.length, so index buckets by it.
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [value, freq] of counts) buckets[freq].push(value);

  const result: number[] = [];
  for (let freq = nums.length; freq > 0 && result.length < k; freq--) {
    for (const value of buckets[freq]) {
      result.push(value);
      if (result.length === k) break;
    }
  }
  return result;
}
