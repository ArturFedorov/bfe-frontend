export type Task<T> = () => Promise<T>;

/**
 * Runs tasks strictly one at a time in input order.
 * Rejects with the first error; later tasks are never started.
 */
export function runSequential<T>(tasks: Array<Task<T>>): Promise<T[]> {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Starts every task immediately and fails fast on the first rejection.
 * Resolves with results in input order.
 */
export function runParallel<T>(tasks: Array<Task<T>>): Promise<T[]> {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Runs tasks in chunks of k: parallel within a chunk, chunks strictly in
 * sequence. A rejection skips all later chunks. Throws RangeError if k < 1.
 */
export function runChunked<T>(tasks: Array<Task<T>>, k: number): Promise<T[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
