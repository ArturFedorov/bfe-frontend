import { buildTree } from '../_shared/structures';
import { sumNumbers } from './sum_root_to_leaf';

describe('sumNumbers', () => {
  it('example: [1,2,3] -> 25', () => {
    expect(sumNumbers(buildTree([1, 2, 3]))).toBe(25);
  });

  it('example: [4,9,0,5,1] -> 1026', () => {
    expect(sumNumbers(buildTree([4, 9, 0, 5, 1]))).toBe(1026);
  });

  it('single zero node', () => {
    expect(sumNumbers(buildTree([0]))).toBe(0);
  });

  it('empty tree -> 0', () => {
    expect(sumNumbers(null)).toBe(0);
  });

  it('single non-zero node', () => {
    expect(sumNumbers(buildTree([7]))).toBe(7);
  });

  it('left-skewed chain', () => {
    expect(sumNumbers(buildTree([1, 2, null, 3, null, 4]))).toBe(1234);
  });

  it('right-skewed chain', () => {
    expect(sumNumbers(buildTree([9, null, 8, null, 7]))).toBe(987);
  });

  it('only leaves count: a node with one child is not a leaf', () => {
    // 1 -> 0 (leaf) and 1 -> 5 -> 6: 10 + 156
    expect(sumNumbers(buildTree([1, 0, 5, null, null, 6]))).toBe(166);
  });

  it('zeros in the middle of paths', () => {
    // 1 -> 0 -> 0 and 1 -> 0 -> 1
    expect(sumNumbers(buildTree([1, 0, null, 0, 1]))).toBe(201);
  });

  it('full tree of depth 10 (512 leaves)', () => {
    const values: number[] = new Array(1023).fill(1);
    // every leaf path is 1111111111
    expect(sumNumbers(buildTree(values))).toBe(512 * 1111111111);
  });
});
