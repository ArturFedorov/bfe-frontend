export class DynamicArray<T> {
  private _resizeCount = 0;
  private count = 0;
  private _capacity: number;
  private buffer: Array<T>;

  constructor(initialCapacity: number = 4) {
    if (!Number.isInteger(initialCapacity) || initialCapacity <= 0) {
      throw new RangeError('initialCapacity must be a positive integer');
    }

    this._capacity = initialCapacity;
    this.buffer = new Array<T>(initialCapacity);
  }

  get length(): number {
    return this.count;
  }

  get capacity(): number {
    return this._capacity;
  }

  get resizeCount(): number {
    return this._resizeCount;
  }

  push(item: T): void {
    if (this.count >= this.capacity) {
      this._capacity *= 2;

      const target = new Array<T>(this._capacity);

      for (let i = 0; i < this.count; i++) target[i] = this.buffer[i];
      this.buffer = target;
      this._resizeCount += 1;
    }

    this.buffer[this.count++] = item;
  }

  get(index: number): T {
    if (index >= this.count || index < 0 || !Number.isInteger(index)) {
      throw new RangeError('Index out of range');
    }

    return this.buffer[index];
  }

  toArray(): T[] {
    return this.buffer.slice(0, this.count);
  }
}
