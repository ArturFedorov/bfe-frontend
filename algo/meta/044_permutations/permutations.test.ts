import { permute } from './permutations';

const normalize = (perms: number[][]): string[] =>
  perms.map((p) => p.join(',')).sort();

describe('permute', () => {
  it('returns all 6 permutations of [1, 2, 3]', () => {
    expect(normalize(permute([1, 2, 3]))).toEqual(
      normalize([
        [1, 2, 3],
        [1, 3, 2],
        [2, 1, 3],
        [2, 3, 1],
        [3, 1, 2],
        [3, 2, 1],
      ]),
    );
  });

  it('handles two elements', () => {
    expect(normalize(permute([0, 1]))).toEqual(
      normalize([
        [0, 1],
        [1, 0],
      ]),
    );
  });

  it('handles a single element', () => {
    expect(permute([1])).toEqual([[1]]);
  });

  it('handles negative numbers', () => {
    expect(normalize(permute([-1, 5]))).toEqual(
      normalize([
        [-1, 5],
        [5, -1],
      ]),
    );
  });

  it('returns permutations of full length', () => {
    for (const p of permute([4, 5, 6, 7])) {
      expect(p).toHaveLength(4);
      expect([...p].sort((a, b) => a - b)).toEqual([4, 5, 6, 7]);
    }
  });

  it('returns n! unique permutations for n = 4', () => {
    const result = permute([1, 2, 3, 4]);
    expect(result).toHaveLength(24);
    expect(new Set(result.map((p) => p.join(','))).size).toBe(24);
  });

  it('returns 720 unique permutations for n = 6', () => {
    const result = permute([-10, -3, 0, 2, 7, 10]);
    expect(result).toHaveLength(720);
    expect(new Set(result.map((p) => p.join(','))).size).toBe(720);
  });

  it('returns independent arrays (no shared references)', () => {
    const result = permute([1, 2]);
    result[0].push(99);
    expect(result[1]).toHaveLength(2);
  });

  it('does not mutate the input', () => {
    const nums = [3, 1, 2];
    permute(nums);
    expect(nums).toEqual([3, 1, 2]);
  });
});
