export function promiseRace<T>(promises: (T | Promise<T>)[]): Promise<T> {
  return new Promise(() => {});
}
