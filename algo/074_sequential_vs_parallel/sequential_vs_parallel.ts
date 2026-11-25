export type Task<T> = () => Promise<T>;

/**
 * Runs tasks strictly one at a time in input order.
 * Rejects with the first error; later tasks are never started.
 */
export async function runSequential<T>(tasks: Array<Task<T>>): Promise<T[]> {
  let results: T[] = [];

  for (let i = 0; i < tasks.length; i++) {
    results[i] = await tasks[i]();
  }

  return results;
}

/**
 * Starts every task immediately and fails fast on the first rejection.
 * Resolves with results in input order.
 */
export async function runParallel<T>(tasks: Array<Task<T>>): Promise<T[]> {
  return Promise.all(tasks.map((task) => task()));
}

/**
 * Runs tasks in chunks of k: parallel within a chunk, chunks strictly in
 * sequence. A rejection skips all later chunks. Throws RangeError if k < 1.
 */
export function runChunked<T>(tasks: Array<Task<T>>, k: number): Promise<T[]> {
  if (!(k >= 1)) {
    throw new RangeError(`Chunk size must be >= 1, got ${k}`);
  }

  return (async () => {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += k) {
      const chunk = await runParallel(tasks.slice(i, i + k));
      results.push(...chunk);
    }
    return results;
  })();
}
