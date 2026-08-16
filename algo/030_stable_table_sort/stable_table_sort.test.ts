import { stableMergeSort, Comparator, TableRow } from './stable_table_sort';

const byScoreDesc: Comparator<TableRow> = (a, b) => b.score - a.score;
const byScoreAsc: Comparator<TableRow> = (a, b) => a.score - b.score;
const byTeamAsc: Comparator<TableRow> = (a, b) =>
  a.team < b.team ? -1 : a.team > b.team ? 1 : 0;

describe('stableMergeSort', () => {
  it('sorts an empty array', () => {
    expect(stableMergeSort<number>([], (a, b) => a - b)).toEqual([]);
  });

  it('sorts a single element', () => {
    expect(stableMergeSort([7], (a, b) => a - b)).toEqual([7]);
  });

  it('sorts numbers ascending', () => {
    expect(stableMergeSort([5, 3, 8, 1, 9, 2], (a, b) => a - b)).toEqual([
      1, 2, 3, 5, 8, 9,
    ]);
  });

  it('handles an already sorted array', () => {
    expect(stableMergeSort([1, 2, 3, 4], (a, b) => a - b)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('handles a reverse-sorted array', () => {
    expect(stableMergeSort([4, 3, 2, 1], (a, b) => a - b)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('handles odd lengths and duplicates', () => {
    expect(stableMergeSort([2, 1, 2, 1, 2], (a, b) => a - b)).toEqual([
      1, 1, 2, 2, 2,
    ]);
  });

  describe('stability', () => {
    it('keeps original order of rows with equal keys', () => {
      const rows: TableRow[] = [
        { id: 1, team: 'red', score: 50 },
        { id: 2, team: 'blue', score: 90 },
        { id: 3, team: 'red', score: 90 },
      ];
      expect(stableMergeSort(rows, byScoreDesc).map((r) => r.id)).toEqual([
        2, 3, 1,
      ]);
    });

    it('defeats a non-stable sort on a crafted case', () => {
      // Many equal keys arranged so that any swap of equal elements
      // (as quicksort or selection sort would do) changes the id sequence.
      const rows: TableRow[] = [
        { id: 1, team: 'a', score: 2 },
        { id: 2, team: 'b', score: 1 },
        { id: 3, team: 'c', score: 2 },
        { id: 4, team: 'd', score: 1 },
        { id: 5, team: 'e', score: 2 },
        { id: 6, team: 'f', score: 1 },
        { id: 7, team: 'g', score: 2 },
      ];
      expect(stableMergeSort(rows, byScoreAsc).map((r) => r.id)).toEqual([
        2, 4, 6, 1, 3, 5, 7,
      ]);
    });

    it('supports the sort-by-B-then-stably-by-A idiom', () => {
      const rows: TableRow[] = [
        { id: 1, team: 'red', score: 30 },
        { id: 2, team: 'blue', score: 20 },
        { id: 3, team: 'red', score: 10 },
        { id: 4, team: 'blue', score: 40 },
      ];
      const byScoreThenTeam = stableMergeSort(
        stableMergeSort(rows, byScoreAsc),
        byTeamAsc,
      );
      // Grouped by team; scores ascending within each team.
      expect(byScoreThenTeam.map((r) => r.id)).toEqual([2, 4, 3, 1]);
    });

    it('returns identical references in original order when all keys are equal', () => {
      const a = { id: 1, team: 'x', score: 5 };
      const b = { id: 2, team: 'y', score: 5 };
      const c = { id: 3, team: 'z', score: 5 };
      const result = stableMergeSort([a, b, c], byScoreAsc);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
      expect(result[2]).toBe(c);
    });
  });

  describe('contract', () => {
    it('does not call Array.prototype.sort', () => {
      const sortSpy = jest.spyOn(Array.prototype, 'sort');
      try {
        stableMergeSort([3, 1, 2], (a, b) => a - b);
        expect(sortSpy).not.toHaveBeenCalled();
      } finally {
        sortSpy.mockRestore();
      }
    });

    it('returns a new array and does not mutate the input', () => {
      const input = [3, 1, 2];
      const result = stableMergeSort(input, (a, b) => a - b);
      expect(result).not.toBe(input);
      expect(input).toEqual([3, 1, 2]);
    });

    it('works with string elements', () => {
      expect(
        stableMergeSort(['pear', 'apple', 'fig'], (a, b) =>
          a < b ? -1 : a > b ? 1 : 0,
        ),
      ).toEqual(['apple', 'fig', 'pear']);
    });
  });

  describe('large input', () => {
    it('sorts 100k rows and stays stable within equal keys', () => {
      const n = 100_000;
      const rows: TableRow[] = [];
      for (let i = 0; i < n; i++) {
        rows.push({
          id: i,
          team: `team-${i % 7}`,
          score: (i * 31) % 100, // deterministic, heavily duplicated keys
        });
      }
      const result = stableMergeSort(rows, byScoreAsc);
      expect(result).toHaveLength(n);
      for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1];
        const curr = result[i];
        if (prev.score > curr.score) {
          throw new Error(`Not sorted at index ${i}`);
        }
        // Original order was id-ascending, so equal scores must keep ids ascending.
        if (prev.score === curr.score && prev.id > curr.id) {
          throw new Error(
            `Stability violated at index ${i}: id ${prev.id} before id ${curr.id}`,
          );
        }
      }
    });
  });
});
