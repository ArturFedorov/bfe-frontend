export async function sequential<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];

  for (const task of tasks) {
    results.push(await task());
  }

  return results;
}

export function parallel<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    if (tasks.length === 0) resolve([]);
    const results = new Array<T>(tasks.length);
    let remaining = tasks.length;

    tasks.forEach((task, index) => {
      task().then((result) => {
        results[index] = result;
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}
