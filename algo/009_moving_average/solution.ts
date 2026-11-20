export class MovingAverage {
  private readonly window: number[];
  private head = 0;
  private count = 0;
  private sum = 0;

  constructor(private readonly k: number) {
    if (!Number.isInteger(k) || k < 1)
      throw new RangeError('Invalid window size');

    this.window = new Array<number>(k);
  }

  next(reading: number): number {
    if (this.count === this.k) {
      this.sum -= this.window[this.head];
    } else {
      this.count++;
    }

    this.window[this.head] = reading;
    this.sum += reading;
    this.head = (this.head + 1) % this.k;

    return this.sum / this.count;
  }
}
