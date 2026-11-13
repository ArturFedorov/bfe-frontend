/**
 * Log Ring Buffer — reference solution.
 *
 * Fixed backing array of length `capacity`, a `writeIndex` that advances
 * modulo capacity, and a `count` capped at capacity. Appending writes into
 * the slot at `writeIndex` and moves on; once full, that slot naturally
 * holds the oldest line, so the overwrite is implicit — nothing ever moves.
 * The oldest element lives at `(writeIndex - count) mod capacity`, so
 * `getAll` reads `count` slots forward from there.
 *
 * Time:  append O(1); getAll O(capacity); size O(1).
 * Space: O(capacity) regardless of how many lines ever arrived.
 */

/**
 * Fixed-capacity circular buffer over the most recent log lines.
 *
 * - `append` is O(1): fixed backing array + write index with `% capacity`.
 *   No shifting, no unbounded growth.
 * - `getAll` returns the retained lines oldest-to-newest as a fresh array.
 * - The constructor throws an Error when capacity is not a positive integer.
 */
export class LogRingBuffer {
  private readonly capacity: number;
  private readonly slots: string[];
  private writeIndex = 0; // next slot to write
  private count = 0; // lines currently held (<= capacity)

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`capacity must be a positive integer, got ${capacity}`);
    }
    this.capacity = capacity;
    this.slots = new Array<string>(capacity);
  }

  append(line: string): void {
    this.slots[this.writeIndex] = line;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  getAll(): string[] {
    // Oldest line sits `count` slots behind the write cursor (mod capacity).
    const start =
      (this.writeIndex - this.count + this.capacity) % this.capacity;
    const result: string[] = new Array(this.count);
    for (let i = 0; i < this.count; i++) {
      result[i] = this.slots[(start + i) % this.capacity];
    }
    return result;
  }

  size(): number {
    return this.count;
  }
}
