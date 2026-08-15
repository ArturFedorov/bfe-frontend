/**
 * Streaming maximum over the last N recorded latencies.
 *
 * - `record(latency)` ingests one value and returns the max of the last
 *   `min(N, count)` values, including the one just recorded.
 * - Amortized O(1) per record via a monotonic deque; O(N) memory.
 * - The constructor throws an Error when windowSize is not a positive integer.
 */
export class SlidingMaxLatency {
  constructor(windowSize: number) {
    // TODO: implement
    throw new Error('Not implemented');
  }

  record(latency: number): number {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
