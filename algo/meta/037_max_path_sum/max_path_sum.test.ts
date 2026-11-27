import { TreeNode, buildTree } from '../_shared/structures';
import { maxPathSum } from './max_path_sum';

const tree = (values: Array<number | null>): TreeNode =>
  buildTree(values) as TreeNode;

describe('maxPathSum', () => {
  it('example: [1,2,3] -> 6', () => {
    expect(maxPathSum(tree([1, 2, 3]))).toBe(6);
  });

  it('example: [-10,9,20,null,null,15,7] -> 42', () => {
    expect(maxPathSum(tree([-10, 9, 20, null, null, 15, 7]))).toBe(42);
  });

  it('single negative node', () => {
    expect(maxPathSum(tree([-3]))).toBe(-3);
  });

  it('all negative: picks the largest single node', () => {
    expect(maxPathSum(tree([-2, -1, -3]))).toBe(-1);
    expect(maxPathSum(tree([-5, -4, -6, -8, -2]))).toBe(-2);
  });

  it('negative root with a positive child', () => {
    expect(maxPathSum(tree([-2, 1]))).toBe(1);
  });

  it('path that does not include the root', () => {
    expect(maxPathSum(tree([-100, 5, -1, 3, 4]))).toBe(12);
  });

  it('drops a negative branch but keeps going through the node', () => {
    // 4 + 11 + 2 path inside left subtree vs whole bend
    expect(
      maxPathSum(tree([5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1])),
    ).toBe(48);
  });

  it('zeros', () => {
    expect(maxPathSum(tree([0, -1, -1]))).toBe(0);
  });

  it('chain where the best path is in the middle', () => {
    // 1 -> -5 -> 3 -> 4 -> -10 -> 2 (left-skewed): best is 3 + 4 = 7
    expect(
      maxPathSum(tree([1, -5, null, 3, null, 4, null, -10, null, 2])),
    ).toBe(7);
  });

  it('large: full tree of 2^15 - 1 nodes', () => {
    // all-ones tree of depth 14: best path joins two full root-to-leaf paths
    const ones = tree(new Array(2 ** 15 - 1).fill(1));
    expect(maxPathSum(ones)).toBe(29);
  });
});
