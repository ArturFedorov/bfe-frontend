export interface QueueOptions {
  concurrency: number;
  retries: number; // additional attempts after the first failure
}

/**
 * Process async tasks with a concurrency limit and per-task retries. Resolve
 * with results in input order. A task that still fails after all retries causes
 * the returned promise to reject.
 */
export async function runQueue<T>(
  tasks: (() => Promise<T>)[],
  options: QueueOptions,
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  const executing = new Set<Promise<void>>();
  const all: Promise<void>[] = [];

  for(let i = 0; i < tasks.length; i++) {
    const promise = Promise.resolve()
      .then(() => withRetries(tasks[i], options.retries))
      .then((result) => {
        results[i] = result;
      })

    all.push(promise);
    executing.add(promise);

    promise.finally(() => executing.delete(promise)).catch(() => {});

    if(executing.size >= options.concurrency) {
      await Promise.race(executing).catch(() => {});
    }
  }

  await Promise.all(all);

  return results;
}

async function withRetries<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: unknown;

  for(let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError;
}
