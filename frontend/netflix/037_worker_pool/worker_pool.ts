/**
 * Run async jobs across a pool of fixed size. At most `size` jobs run at once;
 * results are returned in the SAME order as the input jobs. If a job rejects,
 * the returned promise rejects (after in-flight jobs settle is acceptable).
 *
 * (Models a worker_threads pool without spawning real threads.)
 */
export async function runPool<T>(
  size: number,
  jobs: (() => Promise<T>)[],
): Promise<T[]> {
  const results = new Array<T>(jobs.length);
  const executing = new Set<Promise<void>>();
  const all: Promise<void>[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const promise = Promise.resolve()
      .then(() => jobs[i]())
      .then((result) => {
        results[i] = result;
      });

    all.push(promise);
    executing.add(promise);

    promise.finally(() => executing.delete(promise)).catch(() => {});

    if (executing.size >= size) {
      await Promise.race(executing).catch(() => {});
    }
  }

  await Promise.all(all);

  return results;
}
