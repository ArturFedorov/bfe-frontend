const isInValid = (capacity: number) =>
  !Number.isInteger(capacity) || capacity < 0;

export class FixedBuffer<T> {
  private bufferSize = 0;
  private capacity = 0;
  private buffer: T[];

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0)
      throw new RangeError('Invalid capacity');

    this.capacity = capacity;
    this.buffer = new Array<T>(capacity);
  }

  push(item: T): void {
    if (this.bufferSize >= this.capacity) {
      throw new Error('Buffer is full');
    }

    this.buffer[this.bufferSize++] = item;
  }

  get(index: number): T {
    if (index >= this.bufferSize || index < 0 || !Number.isInteger(index))
      throw new RangeError('Wrong index');

    return this.buffer[index];
  }

  size(): number {
    return this.bufferSize;
  }
}
