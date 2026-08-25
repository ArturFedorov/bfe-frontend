export class AsyncQueue {
  private tail: Promise<unknown> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(() => task());
    this.tail = result.catch(() => {});
    return result;
  }
}
