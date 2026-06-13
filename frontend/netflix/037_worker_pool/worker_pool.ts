/**
 * Run async jobs across a pool of fixed size. At most `size` jobs run at once;
 * results are returned in the SAME order as the input jobs. If a job rejects,
 * the returned promise rejects (after in-flight jobs settle is acceptable).
 *
 * (Models a worker_threads pool without spawning real threads.)
 */
export function runPool<T>(
  size: number,
  jobs: (() => Promise<T>)[],
): Promise<T[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
