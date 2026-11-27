import { kClosest } from './k_closest_points';

function sortPoints(points: number[][]): number[][] {
  return [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function expectSameSet(actual: number[][], expected: number[][]): void {
  expect(sortPoints(actual)).toEqual(sortPoints(expected));
}

function byDistance(points: number[][], k: number): number[][] {
  const d = (p: number[]) => p[0] * p[0] + p[1] * p[1];
  return [...points].sort((a, b) => d(a) - d(b)).slice(0, k);
}

describe('kClosest', () => {
  it('picks the single closest point', () => {
    expectSameSet(
      kClosest(
        [
          [1, 3],
          [-2, 2],
        ],
        1,
      ),
      [[-2, 2]],
    );
  });

  it('returns k points in any order', () => {
    expectSameSet(
      kClosest(
        [
          [3, 3],
          [5, -1],
          [-2, 4],
        ],
        2,
      ),
      [
        [3, 3],
        [-2, 4],
      ],
    );
  });

  it('handles a single point', () => {
    expect(kClosest([[7, -7]], 1)).toEqual([[7, -7]]);
  });

  it('returns every point when k = n', () => {
    const points = [
      [1, 1],
      [-3, 0],
      [0, 2],
    ];
    expectSameSet(kClosest(points, 3), points);
  });

  it('includes the origin itself', () => {
    expectSameSet(
      kClosest(
        [
          [5, 5],
          [0, 0],
          [1, -1],
        ],
        2,
      ),
      [
        [0, 0],
        [1, -1],
      ],
    );
  });

  it('handles all four quadrants with negatives', () => {
    const points = [
      [-1, -1],
      [10, 10],
      [-2, 3],
      [4, -5],
      [0, -1],
    ];
    expectSameSet(kClosest(points, 3), [
      [-1, -1],
      [0, -1],
      [-2, 3],
    ]);
  });

  it('keeps duplicate points', () => {
    expectSameSet(
      kClosest(
        [
          [1, 2],
          [1, 2],
          [9, 9],
        ],
        2,
      ),
      [
        [1, 2],
        [1, 2],
      ],
    );
  });

  it('handles coordinate extremes without precision issues', () => {
    expectSameSet(
      kClosest(
        [
          [10_000, 10_000],
          [-10_000, 9_999],
          [10_000, -10_000],
        ],
        1,
      ),
      [[-10_000, 9_999]],
    );
  });

  it('does not mutate the input', () => {
    const points = [
      [3, 3],
      [5, -1],
      [-2, 4],
      [0, 1],
    ];
    const copy = points.map((p) => [...p]);
    kClosest(points, 2);
    expect(points).toEqual(copy);
  });

  it('matches sorting by distance on random inputs', () => {
    let seed = 5;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed;
    };
    for (let t = 0; t < 50; t++) {
      // Distinct distances guarantee a unique answer.
      const n = 1 + (rand() % 30);
      const seen = new Set<number>();
      const points: number[][] = [];
      while (points.length < n) {
        const p = [(rand() % 201) - 100, (rand() % 201) - 100];
        const d = p[0] * p[0] + p[1] * p[1];
        if (!seen.has(d)) {
          seen.add(d);
          points.push(p);
        }
      }
      const k = 1 + (rand() % n);
      expectSameSet(kClosest(points, k), byDistance(points, k));
    }
  });

  it('handles 10^5 points quickly', () => {
    const n = 100_000;
    // Shuffled grid points in two quadrants; ties are possible, so check distances only.
    const points = Array.from({ length: n }, (_, i) => {
      const j = (i * 7919) % n;
      return j % 2 === 0
        ? [j % 10_000, Math.floor(j / 10_000)]
        : [-(j % 10_000), -Math.floor(j / 10_000)];
    });
    const k = 1000;
    const start = performance.now();
    const result = kClosest(points, k);
    expect(performance.now() - start).toBeLessThan(1000);
    expect(result).toHaveLength(k);
    const d = (p: number[]) => p[0] * p[0] + p[1] * p[1];
    const cutoff = d(byDistance(points, k)[k - 1]);
    for (const p of result) expect(d(p)).toBeLessThanOrEqual(cutoff);
  });
});
