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
  if (!Number.isInteger(k) || k < 1) {
    throw new RangeError(`k must be >= 1, got ${k}`);
  }
  return runPoolAsync(tasks, k);
}

async function runPoolAsync<T>(tasks: Array<Task<T>>, k: number): Promise<T[]> {
  const n = tasks.length;
  const results = new Array<T>(n);

  const failures = new Map<number, unknown>();
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < n) {
      const i = next++;
      try {
        results[i] = await tasks[i]();
      } catch (reason) {
        failures.set(i, reason);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(k, n) }, worker));

  if (failures.size > 0) {
    const errors: unknown[] = [];
    for (let i = 0; i < n; i++) {
      if (failures.has(i)) errors.push(failures.get(i));
    }
    throw new PoolError(errors);
  }

  return results;
}
