/**
 * Shared LeetCode-style data structures and builders for algo/meta tasks.
 * Tests use the builders; stubs and solutions use the node classes.
 */

export class ListNode {
  constructor(
    public val: number,
    public next: ListNode | null = null,
  ) {}
}

export class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

/** [1, 2, 3] -> 1 -> 2 -> 3 */
export function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

/** 1 -> 2 -> 3 -> [1, 2, 3]; throws on a cycle longer than `limit`. */
export function listToArray(head: ListNode | null, limit = 1_000_000): number[] {
  const out: number[] = [];
  for (let node = head; node; node = node.next) {
    if (out.length >= limit) throw new Error('List too long or cyclic');
    out.push(node.val);
  }
  return out;
}

/**
 * LeetCode level-order format: [3, 9, 20, null, null, 15, 7].
 * `null` marks a missing child; trailing nulls may be omitted.
 */
export function buildTree(values: Array<number | null>): TreeNode | null {
  if (values.length === 0 || values[0] === null) return null;

  const root = new TreeNode(values[0]);
  const queue: TreeNode[] = [root];
  let head = 0;
  let i = 1;

  while (i < values.length) {
    const parent = queue[head++];
    const left = values[i++];
    if (left !== null && left !== undefined) {
      parent.left = new TreeNode(left);
      queue.push(parent.left);
    }
    if (i >= values.length) break;
    const right = values[i++];
    if (right !== null && right !== undefined) {
      parent.right = new TreeNode(right);
      queue.push(parent.right);
    }
  }

  return root;
}

/** Inverse of buildTree, with trailing nulls trimmed. */
export function treeToArray(root: TreeNode | null): Array<number | null> {
  const out: Array<number | null> = [];
  const queue: Array<TreeNode | null> = [root];
  let head = 0;

  while (head < queue.length) {
    const node = queue[head++];
    if (node === null) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left, node.right);
  }

  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}

/** First node (pre-order) whose val equals `val`; values are unique in tests that use it. */
export function findNode(root: TreeNode | null, val: number): TreeNode | null {
  const stack: Array<TreeNode | null> = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (node.val === val) return node;
    stack.push(node.right, node.left);
  }
  return null;
}
