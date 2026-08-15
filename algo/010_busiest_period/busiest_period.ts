/**
 * Finds the start index of the `k` consecutive hours with the highest
 * total request count. Ties resolve to the earliest start index.
 *
 * @param requests - requests received per hour (non-negative integers)
 * @param k - window width in hours; integer with 1 <= k <= requests.length
 * @returns the starting index of the busiest k-hour window
 * @throws RangeError when `k` is not an integer in [1, requests.length]
 */
export function busiestPeriod(requests: number[], k: number): number {
  // TODO: implement
  throw new Error('Not implemented');
}
