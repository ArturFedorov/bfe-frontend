export function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K
): Record<K, T[]> {
  throw new Error('Not implemented');
}

export function indexBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K
): Record<K, T> {
  throw new Error('Not implemented');
}
