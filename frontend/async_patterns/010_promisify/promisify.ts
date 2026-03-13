export function promisify<T>(fn: (...args: any[]) => void): (...args: any[]) => Promise<T> {
  return () => new Promise(() => {});
}
