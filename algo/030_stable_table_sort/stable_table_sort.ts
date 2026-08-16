export interface TableRow {
  id: number;
  team: string;
  score: number;
}

export type Comparator<T> = (a: T, b: T) => number;

export function stableMergeSort<T>(
  rows: readonly T[],
  compare: Comparator<T>,
): T[] {
  // TODO: implement
  throw new Error('Not implemented');
}
