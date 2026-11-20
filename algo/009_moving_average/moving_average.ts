/**
 * Moving average over the last `k` readings of a metric stream.
 *
 * During warm-up (fewer than `k` readings so far) the average covers
 * everything seen so far. Each `next` call must run in O(1).
 */
export class MovingAverage {
  private readonly window: number[];
  private count = 0;
  private head = 0;
  private sum = 0;
  private k: number;

  constructor(k: number) {
    if (!Number.isInteger(k) || k < 1) {
      throw new RangeError('k must be a positive integer');
    }

    this.k = k;
    this.window = new Array<number>(k);
  }

  /**
   * Ingests one reading and returns the average of the last `k` readings
   * (or of all readings, while fewer than `k` have arrived).
   */
  next(reading: number): number {
    if (this.count === this.k) {
      this.sum -= this.window[this.head];
    } else {
      this.count++;
    }

    this.window[this.head] = reading;
    this.sum += reading;
    this.head = (this.head + 1) % this.k;

    return this.sum / this.count;
  }
}
