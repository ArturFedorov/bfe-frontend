export interface QueueOptions {
  concurrency: number;
  retries: number; // additional attempts after the first failure
}

/**
 * Process async tasks with a concurrency limit and per-task retries. Resolve
 * with results in input order. A task that still fails after all retries causes
 * the returned promise to reject.
 */
export function runQueue<T>(
  tasks: (() => Promise<T>)[],
  options: QueueOptions,
): Promise<T[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
