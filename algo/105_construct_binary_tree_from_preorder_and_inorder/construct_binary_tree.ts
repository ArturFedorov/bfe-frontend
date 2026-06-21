/**
 * LC 105. Construct Binary Tree from Preorder and Inorder Traversal
 *
 * The head of `preorder` is the root; its position in `inorder` splits the
 * remaining nodes into the left and right subtrees. Recurse with a single
 * shared pointer walking `preorder` in root → left → right order.
 */
export class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(
    val = 0,
    left: TreeNode | null = null,
    right: TreeNode | null = null,
  ) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

export function buildTree(
  preorder: number[],
  inorder: number[],
): TreeNode | null {
  const indexByValue = new Map<number, number>();
  inorder.forEach((value, i) => indexByValue.set(value, i));

  let pre = 0;

  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) return null;

    const rootVal = preorder[pre++];
    const node = new TreeNode(rootVal);
    const mid = indexByValue.get(rootVal)!;

    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);

    return node;
  };

  return build(0, inorder.length - 1);
}
