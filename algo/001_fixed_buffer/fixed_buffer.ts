export class FixedBuffer<T> {
  private readonly capacity: number;
  private readonly buffer: T[];
  private count: number = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0)
      throw new RangeError('Invalid capacity');

    this.capacity = capacity;
    this.buffer = new Array<T>(capacity);
  }

  push(item: T): void {
    if (this.count === this.capacity) throw new RangeError('Buffer is full');

    this.buffer[this.count++] = item;
  }

  get(index: number): T {
    if (index >= this.count || index < 0 || !Number.isInteger(index))
      throw new RangeError('Wrong index');

    return this.buffer[index];
  }

  size(): number {
    return this.count;
  }
}
