/**
 * Reference solution for 001 — concurrency limiter (`asyncPool`).
 *
 * Run `tasks` with at most `limit` in flight at once, resolve with the results
 * in INPUT order (not completion order), and reject with the first error.
 *
 * Pattern: a fixed pool of `limit` workers that share one cursor. Each worker
 * pulls the next unstarted task, awaits it, writes the result by index, and
 * repeats until the cursor runs off the end. Nothing is ever started eagerly,
 * so the in-flight count can never exceed the number of workers.
 */
export async function asyncPool<T>(
  limit: number,
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0; // index of the next task nobody has claimed yet

  const worker = async (): Promise<void> => {
    while (next < tasks.length) {
      const i = next++; // claim synchronously: no two workers get the same index
      results[i] = await tasks[i]();
    }
  };

  // Never spawn more workers than there are tasks (limit may exceed length).
  const workerCount = Math.max(1, Math.min(limit, tasks.length));
  // Promise.all rejects on the first failing worker; the other workers keep
  // draining but their own rejections are already observed through this same
  // Promise.all, so nothing is left unhandled.
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}
