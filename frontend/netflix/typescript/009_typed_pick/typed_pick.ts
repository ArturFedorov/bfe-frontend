export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  throw new Error('Not implemented');
}
