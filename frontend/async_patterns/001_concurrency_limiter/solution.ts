export async function asyncPool<T>(
  limit: number,
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  const all: Promise<void>[] = [];
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < tasks.length; i++) {
    const promise: Promise<void> = Promise.resolve()
      .then(() => tasks[i]())
      .then((result) => {
        results[i] = result;
      });

    all.push(promise);
    executing.add(promise);
    promise.finally(() => executing.delete(promise)).catch(() => {});

    if (executing.size >= limit) {
      await Promise.race(executing).catch(() => {});
    }
  }

  await Promise.all(all);

  return results;
}
