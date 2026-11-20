export class UndoHistory<T> {
  private readonly maxDepth: number;
  private buffer: T[];
  private count: number;
  private start: number;

  constructor(maxDepth: number) {
    if (!Number.isInteger(maxDepth) || maxDepth <= 0) {
      throw new RangeError('Max depth must be a positive number');
    }

    this.maxDepth = maxDepth;
    this.count = 0;
    this.start = 0;
    this.buffer = new Array<T>(maxDepth);
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
      throw new Error('History is  empty');
    }

    return this.buffer[(this.start + this.count - 1) % this.maxDepth];
  }

  jumpTo(index: number): T {
    if (index >= this.count || index < 0 || !Number.isInteger(index)) {
      throw new RangeError('Index should be a positive integer');
    }

    this.count = index + 1;

    return this.buffer[(this.start + index) % this.maxDepth];
  }

  size(): number {
    return this.count;
  }
}
