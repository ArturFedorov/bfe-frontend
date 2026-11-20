export function busiestPeriod(requests: number[], k: number): number {
  if (!Number.isInteger(k) || k < 1 || k > requests.length)
    throw new RangeError('Invalid window size');

  let sum = 0;
  for (let i = 0; i < k; i++) sum += requests[i];

  let best = sum;
  let bestStart = 0;

  for (let i = k; i < requests.length; i++) {
    sum += requests[i] - requests[i - k];
    // Strict > keeps the earliest start on ties.
    if (sum > best) {
      best = sum;
      bestStart = i - k + 1;
    }
  }

  return bestStart;
}
