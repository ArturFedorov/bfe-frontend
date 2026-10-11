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
  if (k < 1) throw new RangeError('k must be at least 1');

  return runPoolInternal(tasks, k);
}

async function runPoolInternal<T>(
  tasks: Array<Task<T>>,
  k: number,
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  const executing = new Set<Promise<T>>();
  const all: Promise<T>[] = [];
  const errors: unknown[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const promise = Promise.resolve()
      .then(() => tasks[i]())
      .then(
        (result) => {
          results[i] = result;
        },
        (err) => {
          errors[i] = err;
        },
      ) as Promise<T>;

    all.push(promise);
    executing.add(promise);

    promise.finally(() => executing.delete(promise));

    if (executing.size >= k) {
      await Promise.race(executing);
    }
  }

  await Promise.all(all);

  if (errors.length > 0) throw new PoolError(errors.filter(Boolean));

  return results;
}
