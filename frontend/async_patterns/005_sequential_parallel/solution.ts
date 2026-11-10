/**
 * Reference solution for 005 — keep sequential_parallel.ts as your own attempt;
 * this file is for comparison afterwards.
 */

/** One after another: the next task is not even STARTED until the previous settled. */
export async function sequential<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task()); // a rejection here propagates and stops the chain
  }
  return results;
}

/** All at once: start every task now, then wait for all. Order = input order. */
export function parallel<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  return Promise.all(tasks.map((task) => task()));
}

/** The same thing without Promise.all, to show what it does for you. */
export function parallelManual<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    if (tasks.length === 0) return resolve([]); // a counter never reaches 0 → guard
    const results = new Array<T>(tasks.length);
    let remaining = tasks.length;
    tasks.forEach((task, i) => {
      task().then((value) => {
        results[i] = value; // write by INDEX so finish order does not matter
        if (--remaining === 0) resolve(results); // count settlements, never results.length
      }, reject); // first rejection wins; later calls are no-ops
    });
  });
}
