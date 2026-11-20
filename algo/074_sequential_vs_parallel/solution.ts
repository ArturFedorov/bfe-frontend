/**
 * 074. Sequential vs Parallel — reference solution
 *
 * - Sequential: await each task before calling the next.
 * - Parallel: call every task up front and hand the promises to Promise.all,
 *   which preserves input order and fails fast.
 * - Chunked: Promise.all over each slice of k, awaiting slices in order.
 *
 * Results always land by index, so order mirrors the input.
 */
export type Task<T> = () => Promise<T>;

export async function runSequential<T>(tasks: Array<Task<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

export function runParallel<T>(tasks: Array<Task<T>>): Promise<T[]> {
  return Promise.all(tasks.map((task) => task()));
}

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
