export interface TableRow {
  id: number;
  team: string;
  score: number;
}

export type Comparator<T> = (a: T, b: T) => number;

function merge<T>(left: T[], right: T[], compare: Comparator<T>): T[] {
  const merged: T[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    // `<= 0` takes the left element on ties, which is what keeps the sort stable.
    if (compare(left[i], right[j]) <= 0) {
      merged.push(left[i++]);
    } else {
      merged.push(right[j++]);
    }
  }

  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);

  return merged;
}

function sortRange<T>(
  rows: readonly T[],
  lo: number,
  hi: number,
  compare: Comparator<T>,
): T[] {
  if (hi - lo <= 1) return hi > lo ? [rows[lo]] : [];

  const mid = lo + Math.floor((hi - lo) / 2);

  return merge(
    sortRange(rows, lo, mid, compare),
    sortRange(rows, mid, hi, compare),
    compare,
  );
}

export function stableMergeSort<T>(
  rows: readonly T[],
  compare: Comparator<T>,
): T[] {
  return sortRange(rows, 0, rows.length, compare);
}
