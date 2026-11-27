import { addTwoNumbers } from './add_two_numbers';
import { buildList, listToArray } from '../_shared/structures';

const add = (a: number[], b: number[]): number[] =>
  listToArray(addTwoNumbers(buildList(a), buildList(b)));

describe('addTwoNumbers', () => {
  it('adds 342 + 465', () => {
    expect(add([2, 4, 3], [5, 6, 4])).toEqual([7, 0, 8]);
  });

  it('adds 0 + 0', () => {
    expect(add([0], [0])).toEqual([0]);
  });

  it('adds numbers of different lengths with a final carry', () => {
    expect(add([9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9])).toEqual([
      8, 9, 9, 9, 0, 0, 0, 1,
    ]);
  });

  it('adds 9999 + 99', () => {
    expect(add([9, 9, 9, 9], [9, 9])).toEqual([8, 9, 0, 0, 1]);
  });

  it('adds zero to a number', () => {
    expect(add([0], [1, 2, 3])).toEqual([1, 2, 3]);
    expect(add([1, 2, 3], [0])).toEqual([1, 2, 3]);
  });

  it('produces a new digit from a single carry', () => {
    expect(add([5], [5])).toEqual([0, 1]);
  });

  it('adds single digits without carry', () => {
    expect(add([2], [3])).toEqual([5]);
  });

  it('propagates a carry through a long run of nines', () => {
    expect(add([1], [9, 9, 9, 9, 9])).toEqual([0, 0, 0, 0, 0, 1]);
  });

  it('handles the shorter list being first', () => {
    expect(add([1, 8], [0, 0, 0, 9])).toEqual([1, 8, 0, 9]);
  });

  it('does not mutate the inputs', () => {
    const a = buildList([9, 9]);
    const b = buildList([1]);
    addTwoNumbers(a, b);
    expect(listToArray(a)).toEqual([9, 9]);
    expect(listToArray(b)).toEqual([1]);
  });

  it('adds numbers far beyond Number.MAX_SAFE_INTEGER', () => {
    // 10^30 - 1 (thirty nines) + 1 = 10^30
    const nines = new Array<number>(30).fill(9);
    const expected = [...new Array<number>(30).fill(0), 1];
    expect(add(nines, [1])).toEqual(expected);
  });

  it('adds two 10^5-digit numbers iteratively', () => {
    const n = 100_000;
    const a = Array.from({ length: n }, (_, i) => (i === n - 1 ? 1 : 9));
    const b = Array.from({ length: n }, (_, i) => (i === n - 1 ? 1 : 0));
    b[0] = 1;
    // a = 2·10^(n-1) - 1, b = 10^(n-1) + 1, a + b = 3·10^(n-1):
    // the +1 at the ones digit ripples a carry through every nine.
    const result = add(a, b);
    expect(result).toHaveLength(n);
    expect(result[n - 1]).toBe(3);
    expect(result.slice(0, n - 1).every((d) => d === 0)).toBe(true);
  });
});
