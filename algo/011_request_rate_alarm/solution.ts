const WINDOW_MS = 60_000;

export class RequestRateAlarm {
  private queue: number[] = [];
  private head = 0;
  private last = -Infinity;

  record(timestampMs: number): number {
    if (timestampMs < this.last)
      throw new Error('Timestamps must not decrease');
    this.last = timestampMs;

    this.queue.push(timestampMs);
    while (this.queue[this.head] <= timestampMs - WINDOW_MS) this.head++;

    // Compact once the dead prefix dominates, keeping memory O(window).
    if (this.head > 1024 && this.head * 2 > this.queue.length) {
      this.queue = this.queue.slice(this.head);
      this.head = 0;
    }

    return this.queue.length - this.head;
  }
}
