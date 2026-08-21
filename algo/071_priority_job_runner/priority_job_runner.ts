interface QueuedJob {
  priority: number;
  start: () => void;
}

export class PriorityJobRunner {
  private readonly concurrency: number;
  private running = 0;
  private readonly queue: QueuedJob[] = [];

  constructor(concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 0) {
      throw new RangeError('concurrency must be an integer');
    }

    this.concurrency = concurrency;
  }

  /**
   * Submits a job. Higher `priority` numbers start before lower ones once the
   * pool is saturated; equal priorities start in arrival order.
   */
  run<T>(fn: () => Promise<T>, priority: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const start = () => {
        this.running += 1;
        Promise.resolve()
          .then(fn)
          .then(resolve, reject)
          .finally(() => {
            this.running -= 1;
            this.startNext();
          });
      };

      if (this.running < this.concurrency) {
        start();
      } else {
        this.queue.splice(this.insertionIndex(priority), 0, {
          priority,
          start,
        });
      }
    });
  }

  private insertionIndex(priority: number): number {
    let i = this.queue.length;
    while (i > 0 && this.queue[i - 1].priority < priority) i -= 1;
    return i;
  }

  private startNext(): void {
    if (this.running >= this.concurrency) return;

    const next = this.queue.shift();
    if (next) next.start();
  }
}
