export function chunk<T>(arr: T[], size: number): T[][] {
  return [] as any;
}

export function zip<A, B>(a: A[], b: B[]): [A, B][];
export function zip<A, B, C>(a: A[], b: B[], c: C[]): [A, B, C][];
export function zip(...arrays: unknown[][]): unknown[][];
export function zip(...arrays: unknown[][]): unknown[][] {
  return [] as any;
}

export function unzip<A, B>(tuples: [A, B][]): [A[], B[]];
export function unzip<A, B, C>(tuples: [A, B, C][]): [A[], B[], C[]];
export function unzip(tuples: unknown[][]): unknown[][];
export function unzip(tuples: unknown[][]): unknown[][] {
  return [] as any;
}
