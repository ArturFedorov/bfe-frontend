export async function asyncPool<T>(
  limit: number,
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };

  const workerCount = Math.max(1, Math.min(limit, tasks.length));

  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}
