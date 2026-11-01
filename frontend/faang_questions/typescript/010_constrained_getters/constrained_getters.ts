export function getField<T, K extends keyof T>(
  items: readonly T[],
  key: K,
): T[K][] {
  throw new Error('Not implemented');
}
