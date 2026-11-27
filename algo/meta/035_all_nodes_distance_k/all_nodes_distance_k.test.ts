import { TreeNode, buildTree, findNode } from '../_shared/structures';
import { distanceK } from './all_nodes_distance_k';

const sorted = (xs: number[]): number[] => [...xs].sort((a, b) => a - b);

function run(
  values: Array<number | null>,
  targetVal: number,
  k: number,
): number[] {
  const root = buildTree(values);
  const target = findNode(root, targetVal);
  if (!target) throw new Error(`target ${targetVal} not in tree`);
  return sorted(distanceK(root, target, k));
}

const EXAMPLE = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4];

describe('distanceK', () => {
  it('example: target 5, k 2 -> [7, 4, 1]', () => {
    expect(run(EXAMPLE, 5, 2)).toEqual([1, 4, 7]);
  });

  it('example: single node, k 3 -> []', () => {
    expect(run([1], 1, 3)).toEqual([]);
  });

  it('k = 0 returns the target itself', () => {
    expect(run(EXAMPLE, 2, 0)).toEqual([2]);
  });

  it('k = 1 includes parent and children', () => {
    expect(run(EXAMPLE, 5, 1)).toEqual([2, 3, 6]);
  });

  it('target is the root (only goes down)', () => {
    expect(run(EXAMPLE, 3, 2)).toEqual([0, 2, 6, 8]);
  });

  it('target is a leaf (only goes up first)', () => {
    expect(run(EXAMPLE, 7, 3)).toEqual([3, 6]);
  });

  it('path crosses the root to the other subtree', () => {
    expect(run(EXAMPLE, 7, 5)).toEqual([0, 8]);
  });

  it('k larger than the tree diameter -> []', () => {
    expect(run(EXAMPLE, 5, 10)).toEqual([]);
  });

  it('chain: nodes on both sides at distance k', () => {
    // 1 -> 2 -> 3 -> 4 -> 5 (left-skewed), target 3
    expect(run([1, 2, null, 3, null, 4, null, 5], 3, 2)).toEqual([1, 5]);
  });

  it('does not count the target when walking back', () => {
    expect(run([1, 2, 3], 2, 2)).toEqual([3]);
  });

  it('large: deep chain of 100k nodes', () => {
    const n = 100_000;
    let root: TreeNode | null = null;
    for (let v = n - 1; v >= 0; v--) root = new TreeNode(v, root, null);
    let target = root as TreeNode;
    for (let i = 0; i < n / 2; i++) target = target.left as TreeNode;
    const result = sorted(distanceK(root, target, 1_000));
    expect(result).toEqual([n / 2 - 1_000, n / 2 + 1_000]);
  });
});
