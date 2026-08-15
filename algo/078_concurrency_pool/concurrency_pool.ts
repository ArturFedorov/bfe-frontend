export type Task<T> = () => Promise<T>;

/**
 * Aggregate rejection for a pool run where at least one task failed.
 * `errors` holds rejection reasons in input order. Part of the contract.
 */
export class PoolError extends Error {
  readonly errors: unknown[];

  constructor(errors: unknown[]) {
    super(`${errors.length} pool task(s) failed`);
    this.name = 'PoolError';
    this.errors = errors;
  }
}

/**
 * Runs task factories with at most k in flight (slot refill on settle).
 * Resolves with results in input order; if any task rejected, waits for all
 * to settle and rejects with a PoolError. Throws RangeError if k < 1.
 */
export function runPool<T>(tasks: Array<Task<T>>, k: number): Promise<T[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
