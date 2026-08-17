export class UndoHistory<T> {
  private readonly maxDepth: number;
  private buffer: T[];
  private count: number;
  private start: number;

  constructor(maxDepth: number) {
    if (!Number.isInteger(maxDepth) || maxDepth <= 0)
      throw new RangeError('Max depth must be a positive integer.');

    this.buffer = new Array<T>(maxDepth);
    this.count = 0;
    this.start = 0;
    this.maxDepth = maxDepth;
  }

  push(snapshot: T): void {
    this.buffer[(this.start + this.count) % this.maxDepth] = snapshot;

    if (this.count === this.maxDepth) {
      this.start = (this.start + 1) % this.maxDepth;
    } else {
      this.count++;
    }
  }

  current(): T {
    if (this.count < 1) {
      throw new Error('History is empty');
    }

    return this.buffer[(this.start + this.count - 1) % this.maxDepth];
  }

  jumpTo(index: number): T {
    if (!Number.isInteger(index) || index < 0 || index >= this.count)
      throw new RangeError('Index must be a positive integer.');

    this.count = index + 1;

    return this.buffer[(this.start + index) % this.maxDepth];
  }

  size(): number {
    return this.count;
  }
}
