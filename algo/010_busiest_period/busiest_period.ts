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
  if (!Number.isInteger(k) || k < 1 || k > requests.length) {
    throw new RangeError('Invalid window size');
  }

  let sum = 0;

  for (let i = 0; i < k; i++) sum += requests[i];

  let best = sum;
  let bestStart = 0;

  for (let i = k; i < requests.length; i++) {
    sum += requests[i] - requests[i - k];

    if (sum > best) {
      best = sum;
      bestStart = i - k + 1;
    }
  }

  return bestStart;
}
