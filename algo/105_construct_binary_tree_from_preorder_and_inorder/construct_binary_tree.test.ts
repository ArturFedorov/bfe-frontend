import { buildTree, TreeNode } from './construct_binary_tree';

describe('LC 105. Construct Binary Tree from Preorder and Inorder', () => {
  it('builds the canonical example tree', () => {
    const root = buildTree([3, 9, 20, 15, 7], [9, 3, 15, 20, 7]);
    expect(root).toEqual(
      new TreeNode(
        3,
        new TreeNode(9),
        new TreeNode(20, new TreeNode(15), new TreeNode(7)),
      ),
    );
  });

  it('builds a single-node tree', () => {
    expect(buildTree([-1], [-1])).toEqual(new TreeNode(-1));
  });

  it('builds a left-skewed tree', () => {
    // preorder: 3 2 1, inorder: 1 2 3
    expect(buildTree([3, 2, 1], [1, 2, 3])).toEqual(
      new TreeNode(3, new TreeNode(2, new TreeNode(1))),
    );
  });

  it('builds a right-skewed tree', () => {
    // preorder: 1 2 3, inorder: 1 2 3
    expect(buildTree([1, 2, 3], [1, 2, 3])).toEqual(
      new TreeNode(1, null, new TreeNode(2, null, new TreeNode(3))),
    );
  });

  it('builds a balanced tree and preserves left/right placement', () => {
    // preorder: 1 2 4 5 3 6 7, inorder: 4 2 5 1 6 3 7
    const root = buildTree([1, 2, 4, 5, 3, 6, 7], [4, 2, 5, 1, 6, 3, 7]);
    expect(root).toEqual(
      new TreeNode(
        1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3, new TreeNode(6), new TreeNode(7)),
      ),
    );
  });

  it('handles negative values', () => {
    // preorder: -10 -20 -30, inorder: -20 -10 -30
    expect(buildTree([-10, -20, -30], [-20, -10, -30])).toEqual(
      new TreeNode(-10, new TreeNode(-20), new TreeNode(-30)),
    );
  });
});
