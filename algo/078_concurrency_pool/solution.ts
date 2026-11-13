/**
 * 078. Concurrency Pool — reference solution
 *
 * Approach: the "k workers over a shared cursor" pattern. We spawn
 * min(k, tasks.length) async workers; each one repeatedly claims the next
 * unstarted index (`next++`, safe because JS is single-threaded between
 * awaits), runs that task, records the outcome at its index, and loops. A
 * worker only claims a new task after its previous one settled, so at most k
 * tasks are ever in flight and a freed slot is refilled instantly — no chunk
 * boundaries. Because indices are claimed in increasing order, tasks start in
 * input order, and because outcomes are written by index, results come back
 * in input order no matter how completion interleaves.
 *
 * Failures are caught per task (so a rejection never stops the loop or the
 * other workers) and stored by index. Only once every worker has drained do
 * we decide: no failures → resolve with `results`; otherwise reject with a
 * PoolError whose `errors` lists the reasons in input order.
 *
 * `k < 1` is validated synchronously in the non-async `runPool` wrapper so it
 * throws (not rejects), as the contract requires.
 *
 * Time: O(n) scheduling overhead for n tasks. Space: O(n) for results + O(k) workers.
 */

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
  if (!Number.isFinite(k) || k < 1) {
    throw new RangeError(`k must be >= 1, got ${k}`);
  }
  return runPoolAsync(tasks, k);
}

async function runPoolAsync<T>(tasks: Array<Task<T>>, k: number): Promise<T[]> {
  const n = tasks.length;
  const results = new Array<T>(n);
  // index -> rejection reason; a Map (not a sparse array) so that falsy
  // reasons such as `undefined` are still counted as failures.
  const failures = new Map<number, unknown>();
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < n) {
      const i = next++;
      try {
        // `await` inside try also catches a factory that throws synchronously.
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
