export function map<T, U>(
  arr: T[],
  fn: (item: T, index: number, arr: T[]) => U,
): U[] {
  return [] as any;
}

export function filter<T>(
  arr: T[],
  predicate: (item: T, index: number, arr: T[]) => boolean,
): T[] {
  return [] as any;
}

export function flatMap<T, U>(
  arr: T[],
  fn: (item: T, index: number, arr: T[]) => U | U[],
): U[] {
  return [] as any;
}

export function countBy<T>(
  arr: T[],
  keyFn: (item: T) => PropertyKey,
): Record<string, number> {
  return {} as any;
}

export function keyBy<T>(
  arr: T[],
  keyFn: (item: T) => PropertyKey,
): Record<string, T> {
  return {} as any;
}
