/**
 * Moving average over the last `k` readings of a metric stream.
 *
 * During warm-up (fewer than `k` readings so far) the average covers
 * everything seen so far. Each `next` call must run in O(1).
 */
export class MovingAverage {
  /**
   * @param k - window size; integer >= 1
   * @throws RangeError when `k` is not a positive integer
   */
  constructor(k: number) {
    // TODO: implement
    throw new Error('Not implemented');
  }

  /**
   * Ingests one reading and returns the average of the last `k` readings
   * (or of all readings, while fewer than `k` have arrived).
   */
  next(reading: number): number {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
