export function bandwidthBurst(transfers: number[], cap: number): number {
  let best = Infinity;
  let sum = 0;
  let left = 0;

  for (let right = 0; right < transfers.length; right++) {
    sum += transfers[right];

    // Positive sizes make shrinking safe: dropping from the left only lowers the sum.
    while (sum >= cap) {
      best = Math.min(best, right - left + 1);
      sum -= transfers[left++];
    }
  }

  return best === Infinity ? 0 : best;
}
