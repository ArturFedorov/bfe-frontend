export function promiseAll<T>(promises: (T | Promise<T>)[]): Promise<T[]> {
  return new Promise(() => {});
}
