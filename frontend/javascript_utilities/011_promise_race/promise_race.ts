export function promiseRace<T>(promises: (T | Promise<T>)[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    for (const item of promises) Promise.resolve(item).then(resolve, reject);
  });
}
