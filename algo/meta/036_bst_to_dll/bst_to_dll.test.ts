import { TreeNode, buildTree } from '../_shared/structures';
import { treeToDoublyList } from './bst_to_dll';

/** Walk `steps` nodes from head via `dir`, returning the visited values. */
function walk(head: TreeNode, dir: 'left' | 'right', steps: number): number[] {
  const out: number[] = [];
  let node: TreeNode | null = head;
  for (let i = 0; i < steps; i++) {
    if (!node) throw new Error(`broken ${dir} chain at step ${i}`);
    out.push(node.val);
    node = node[dir];
  }
  if (node !== head)
    throw new Error(`${dir} chain does not close back to head`);
  return out;
}

function collect(root: TreeNode | null): TreeNode[] {
  const out: TreeNode[] = [];
  const stack: Array<TreeNode | null> = [root];
  while (stack.length > 0) {
    const n = stack.pop();
    if (!n) continue;
    out.push(n);
    stack.push(n.left, n.right);
  }
  return out;
}

function check(values: Array<number | null>): void {
  const root = buildTree(values);
  const originals = collect(root);
  const expected = originals.map((n) => n.val).sort((a, b) => a - b);
  const n = expected.length;

  const head = treeToDoublyList(root);
  expect(head).not.toBeNull();
  const h = head as TreeNode;

  expect(walk(h, 'right', n)).toEqual(expected);
  expect(walk(h, 'left', n)).toEqual([
    expected[0],
    ...expected.slice(1).reverse(),
  ]);

  // in place: every list node is an original tree node
  const originalSet = new Set(originals);
  let node = h;
  for (let i = 0; i < n; i++) {
    expect(originalSet.has(node)).toBe(true);
    node = node.right as TreeNode;
  }
}

describe('treeToDoublyList', () => {
  it('example: [4,2,5,1,3]', () => {
    check([4, 2, 5, 1, 3]);
  });

  it('example: [2,1,3]', () => {
    check([2, 1, 3]);
  });

  it('empty tree -> null', () => {
    expect(treeToDoublyList(null)).toBeNull();
  });

  it('single node points to itself both ways', () => {
    const root = buildTree([1]) as TreeNode;
    const head = treeToDoublyList(root) as TreeNode;
    expect(head).toBe(root);
    expect(head.left).toBe(head);
    expect(head.right).toBe(head);
  });

  it('two nodes', () => {
    check([2, 1]);
    check([1, null, 2]);
  });

  it('returns the smallest node, not the root', () => {
    const root = buildTree([10, 5, 15]) as TreeNode;
    const head = treeToDoublyList(root) as TreeNode;
    expect(head.val).toBe(5);
  });

  it('left-skewed BST', () => {
    check([5, 4, null, 3, null, 2, null, 1]);
  });

  it('right-skewed BST', () => {
    check([1, null, 2, null, 3, null, 4]);
  });

  it('negative values and an unbalanced shape', () => {
    check([0, -10, 20, -20, -5, 10, null, null, null, -7, null, 5, 15]);
  });

  it('large balanced BST (2^15 - 1 nodes)', () => {
    const build = (lo: number, hi: number): TreeNode | null => {
      if (lo > hi) return null;
      const mid = (lo + hi) >> 1;
      return new TreeNode(mid, build(lo, mid - 1), build(mid + 1, hi));
    };
    const n = 2 ** 15 - 1;
    const head = treeToDoublyList(build(0, n - 1)) as TreeNode;
    const forward = walk(head, 'right', n);
    expect(forward[0]).toBe(0);
    expect(forward[n - 1]).toBe(n - 1);
    expect((head.left as TreeNode).val).toBe(n - 1);
  });
});
