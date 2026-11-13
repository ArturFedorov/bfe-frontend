/**
 * Sliding Max Latency — reference solution.
 *
 * Monotonic deque of `{ index, latency }` entries kept in strictly decreasing
 * latency order. On each record:
 *  1. Pop from the back every entry whose latency is <= the new one — those
 *     can never be a future maximum because the new value is at least as
 *     large and will outlive them.
 *  2. Push the new entry.
 *  3. Pop from the front while the front index has fallen out of the window.
 * The front is always the current window maximum.
 *
 * Deque implementation: a plain array with a moving `head` offset gives O(1)
 * pops at both ends (no `Array#shift`). The dead prefix is reclaimed with a
 * single `splice` whenever `head` passes half the array — amortized O(1).
 * Each entry is pushed once and popped at most once.
 *
 * Time:  amortized O(1) per record.
 * Space: O(N) — at most `windowSize` live entries (plus a bounded dead prefix).
 */

interface Entry {
  index: number;
  latency: number;
}

/**
 * Streaming maximum over the last N recorded latencies.
 *
 * - `record(latency)` ingests one value and returns the max of the last
 *   `min(N, count)` values, including the one just recorded.
 * - Amortized O(1) per record via a monotonic deque; O(N) memory.
 * - The constructor throws an Error when windowSize is not a positive integer.
 */
export class SlidingMaxLatency {
  private readonly windowSize: number;
  private readonly deque: Entry[] = [];
  private head = 0; // logical front of the deque
  private count = 0; // total values recorded so far (= next index)

  constructor(windowSize: number) {
    if (!Number.isInteger(windowSize) || windowSize <= 0) {
      throw new Error(
        `windowSize must be a positive integer, got ${windowSize}`,
      );
    }
    this.windowSize = windowSize;
  }

  record(latency: number): number {
    const index = this.count++;

    // 1. Drop dominated entries: older and not larger => never the max again.
    while (
      this.deque.length > this.head &&
      this.deque[this.deque.length - 1].latency <= latency
    ) {
      this.deque.pop();
    }

    // 2. Admit the new value.
    this.deque.push({ index, latency });

    // 3. Expire the front once it slides out of the window.
    const oldestAllowed = index - this.windowSize + 1;
    while (this.deque[this.head].index < oldestAllowed) {
      this.head++;
    }

    // Reclaim the dead prefix occasionally so memory stays O(N).
    if (this.head > 0 && this.head * 2 >= this.deque.length) {
      this.deque.splice(0, this.head);
      this.head = 0;
    }

    return this.deque[this.head].latency;
  }
}
