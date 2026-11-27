import { TreeNode, buildTree } from '../_shared/structures';
import { closestValue } from './closest_bst_value';

describe('closestValue', () => {
  it('example: target 3.714286 -> 4', () => {
    expect(closestValue(buildTree([4, 2, 5, 1, 3]), 3.714286)).toBe(4);
  });

  it('example: single node', () => {
    expect(closestValue(buildTree([1]), 4.428571)).toBe(1);
  });

  it('tie resolves to the smaller value', () => {
    expect(closestValue(buildTree([4, 2, 5, 1, 3]), 3.5)).toBe(3);
  });

  it('tie where the smaller value is deeper in the tree', () => {
    expect(closestValue(buildTree([2, 1, 3]), 1.5)).toBe(1);
  });

  it('exact match', () => {
    expect(closestValue(buildTree([8, 4, 12, 2, 6, 10, 14]), 10)).toBe(10);
  });

  it('target below every value', () => {
    expect(closestValue(buildTree([8, 4, 12, 2, 6, 10, 14]), -100)).toBe(2);
  });

  it('target above every value', () => {
    expect(closestValue(buildTree([8, 4, 12, 2, 6, 10, 14]), 1e9)).toBe(14);
  });

  it('closest is an ancestor, not the last node on the path', () => {
    // path for 7.9: 8 -> 4 -> 6; 8 is closest
    expect(closestValue(buildTree([8, 4, 12, 2, 6, 10, 14]), 7.9)).toBe(8);
  });

  it('large values', () => {
    expect(closestValue(buildTree([1e9, 0]), 5e8 + 1)).toBe(1e9);
    expect(closestValue(buildTree([1e9, 0]), 5e8)).toBe(0);
  });

  it('deep right-skewed BST of 10^4 nodes', () => {
    let root: TreeNode | null = null;
    for (let v = 10_000 * 2; v >= 0; v -= 2) root = new TreeNode(v, null, root);
    expect(closestValue(root, 9_999.2)).toBe(10_000);
    expect(closestValue(root, 9_999)).toBe(9_998);
  });
});
