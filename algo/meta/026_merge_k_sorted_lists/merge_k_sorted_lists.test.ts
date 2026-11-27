import { mergeKLists } from './merge_k_sorted_lists';
import { buildList, listToArray, ListNode } from '../_shared/structures';

const merge = (arrays: number[][]): number[] =>
  listToArray(mergeKLists(arrays.map(buildList)));

describe('mergeKLists', () => {
  it('merges three sorted lists', () => {
    expect(
      merge([
        [1, 4, 5],
        [1, 3, 4],
        [2, 6],
      ]),
    ).toEqual([1, 1, 2, 3, 4, 4, 5, 6]);
  });

  it('returns null for no lists', () => {
    expect(mergeKLists([])).toBeNull();
  });

  it('returns null for a single empty list', () => {
    expect(mergeKLists([null])).toBeNull();
  });

  it('returns null when every list is empty', () => {
    expect(mergeKLists([null, null, null])).toBeNull();
  });

  it('returns a single list unchanged', () => {
    expect(merge([[1, 2, 3]])).toEqual([1, 2, 3]);
  });

  it('skips empty lists mixed with non-empty ones', () => {
    expect(merge([[], [2], [], [1, 3], []])).toEqual([1, 2, 3]);
  });

  it('handles negative values and duplicates', () => {
    expect(
      merge([
        [-10, -3, 0, 0],
        [-3, -3, 5],
        [0, 10000],
      ]),
    ).toEqual([-10, -3, -3, -3, 0, 0, 0, 5, 10000]);
  });

  it('handles lists of very different lengths', () => {
    expect(merge([[1, 2, 3, 4, 5, 6, 7, 8], [4], [0, 9]])).toEqual([
      0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('handles non-overlapping ranges', () => {
    expect(
      merge([
        [7, 8, 9],
        [1, 2, 3],
        [4, 5, 6],
      ]),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('reuses the original nodes', () => {
    const a = buildList([1, 3]);
    const b = buildList([2]);
    const nodes = new Set<ListNode>();
    for (const head of [a, b]) {
      for (let n = head; n; n = n.next) nodes.add(n);
    }
    const merged = mergeKLists([a, b]);
    const seen: ListNode[] = [];
    for (let n = merged; n; n = n.next) seen.push(n);
    expect(seen).toHaveLength(3);
    for (const n of seen) expect(nodes.has(n)).toBe(true);
  });

  it('merges 1000 lists of 100 nodes in O(N log k)', () => {
    const k = 1000;
    const len = 100;
    // List i holds i, i + k, i + 2k, ... so the output interleaves all lists.
    const lists: Array<ListNode | null> = [];
    for (let i = 0; i < k; i++) {
      const values: number[] = [];
      for (let j = 0; j < len; j++) values.push(i + j * k);
      lists.push(buildList(values));
    }
    const result = listToArray(mergeKLists(lists));
    expect(result).toHaveLength(k * len);
    for (let i = 0; i < result.length; i++) {
      if (result[i] !== i) throw new Error(`mismatch at ${i}: ${result[i]}`);
    }
  });
});
