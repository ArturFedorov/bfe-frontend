/**
 * Fixed-capacity circular buffer over the most recent log lines.
 *
 * - `append` is O(1): fixed backing array + write index with `% capacity`.
 *   No shifting, no unbounded growth.
 * - `getAll` returns the retained lines oldest-to-newest as a fresh array.
 * - The constructor throws an Error when capacity is not a positive integer.
 */
export class LogRingBuffer {
  constructor(capacity: number) {
    // TODO: implement
    throw new Error('Not implemented');
  }

  append(line: string): void {
    // TODO: implement
    throw new Error('Not implemented');
  }

  getAll(): string[] {
    // TODO: implement
    throw new Error('Not implemented');
  }

  size(): number {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
