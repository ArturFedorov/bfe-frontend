export function groupBy<T>(
  items: T[],
  key: keyof T | ((item: T) => unknown),
): Record<string, T[]> {
  return {} as Record<string, T[]>;
}
