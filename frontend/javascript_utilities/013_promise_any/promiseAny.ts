export function promiseAny<T>(promises: (T | Promise<T>)[]): Promise<T> {
  return new Promise(() => {});
}
