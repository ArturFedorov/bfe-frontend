export class PriorityJobRunner {
  constructor(concurrency: number) {
    // TODO: implement
    throw new Error('Not implemented');
  }

  /**
   * Submits a job. Higher `priority` numbers start before lower ones once the
   * pool is saturated; equal priorities start in arrival order.
   */
  run<T>(fn: () => Promise<T>, priority: number): Promise<T> {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
