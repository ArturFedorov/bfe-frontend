/** Picks index i with probability w[i] / sum(w), using one Math.random() per pick. */
export class WeightedPicker {
  private readonly prefix: number[];
  private readonly total: number;

  constructor(w: number[]) {
    this.prefix = [];
    let running = 0;
    for (const weight of w) {
      running += weight;
      this.prefix.push(running);
    }
    this.total = running;
  }

  /** Returns a random index weighted by w. */
  pickIndex(): number {
    // First index whose prefix sum is strictly greater than the random target.
    const target = Math.random() * this.total;
    let lo = 0;
    let hi = this.prefix.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.prefix[mid] > target) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }
}
