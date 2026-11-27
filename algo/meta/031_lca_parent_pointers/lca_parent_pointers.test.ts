import { lowestCommonAncestor, ParentNode } from './lca_parent_pointers';

/** Builds a tree from LeetCode level-order format, wiring parent pointers. Returns nodes by value. */
function build(values: Array<number | null>): Map<number, ParentNode> {
  const byVal = new Map<number, ParentNode>();
  if (values.length === 0 || values[0] === null) return byVal;
  const make = (val: number, parent: ParentNode | null): ParentNode => {
    const node = new ParentNode(val, null, null, parent);
    byVal.set(val, node);
    return node;
  };
  const root = make(values[0], null);
  const queue: ParentNode[] = [root];
  let head = 0;
  let i = 1;
  while (i < values.length) {
    const parent = queue[head++];
    const left = values[i++];
    if (left !== null && left !== undefined) {
      parent.left = make(left, parent);
      queue.push(parent.left);
    }
    if (i >= values.length) break;
    const right = values[i++];
    if (right !== null && right !== undefined) {
      parent.right = make(right, parent);
      queue.push(parent.right);
    }
  }
  return byVal;
}

const EXAMPLE = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4];

function lca(values: Array<number | null>, p: number, q: number): number {
  const nodes = build(values);
  const pn = nodes.get(p);
  const qn = nodes.get(q);
  if (!pn || !qn) throw new Error('bad test input');
  return lowestCommonAncestor(pn, qn).val;
}

describe('lowestCommonAncestor (parent pointers)', () => {
  it('finds the root for nodes in different subtrees', () => {
    expect(lca(EXAMPLE, 5, 1)).toBe(3);
  });

  it('returns p when p is an ancestor of q', () => {
    expect(lca(EXAMPLE, 5, 4)).toBe(5);
  });

  it('returns q when q is an ancestor of p', () => {
    expect(lca(EXAMPLE, 4, 5)).toBe(5);
  });

  it('finds a deep common ancestor', () => {
    expect(lca(EXAMPLE, 7, 4)).toBe(2);
  });

  it('handles nodes at different depths', () => {
    expect(lca(EXAMPLE, 6, 4)).toBe(5);
    expect(lca(EXAMPLE, 7, 8)).toBe(3);
  });

  it('handles a two-node tree', () => {
    expect(lca([1, 2], 1, 2)).toBe(1);
    expect(lca([1, 2], 2, 1)).toBe(1);
  });

  it('handles siblings', () => {
    expect(lca(EXAMPLE, 0, 8)).toBe(1);
  });

  it('handles negative values', () => {
    expect(lca([-1, -2, -3, -4, -5], -4, -5)).toBe(-2);
    expect(lca([-1, -2, -3, -4, -5], -4, -3)).toBe(-1);
  });

  it('returns the node object itself, not a copy', () => {
    const nodes = build(EXAMPLE);
    const result = lowestCommonAncestor(
      nodes.get(6) as ParentNode,
      nodes.get(7) as ParentNode,
    );
    expect(result).toBe(nodes.get(5));
  });

  it('does not modify the tree', () => {
    const nodes = build(EXAMPLE);
    const parents = [...nodes.values()].map((n) => n.parent);
    lowestCommonAncestor(
      nodes.get(7) as ParentNode,
      nodes.get(0) as ParentNode,
    );
    const after = [...nodes.values()].map((n) => n.parent);
    expect(after.every((parent, i) => parent === parents[i])).toBe(true);
  });

  it('handles a 10^5-deep chain with a short branch', () => {
    // Chain 0 -> 1 -> ... -> n-1 via left children; node `branch` also has a right child.
    // Compare by .val (unique here) so a failure doesn't pretty-print a 10^5-deep object.
    const n = 100_000;
    const chain: ParentNode[] = [new ParentNode(0)];
    for (let i = 1; i < n; i++) {
      const node = new ParentNode(i, null, null, chain[i - 1]);
      chain[i - 1].left = node;
      chain.push(node);
    }
    const branch = 10;
    const side = new ParentNode(-1, null, null, chain[branch]);
    chain[branch].right = side;

    expect(lowestCommonAncestor(chain[n - 1], side).val).toBe(branch);
    expect(lowestCommonAncestor(side, chain[n - 1]).val).toBe(branch);
    expect(lowestCommonAncestor(chain[n - 1], chain[1]).val).toBe(1);
    expect(lowestCommonAncestor(chain[n - 1], chain[n - 2]).val).toBe(n - 2);
  });

  it('handles two 5 * 10^4-deep branches meeting at the root (O(h^2) is too slow)', () => {
    const half = 50_000;
    const root = new ParentNode(0);
    let left = root;
    let right = root;
    for (let i = 1; i <= half; i++) {
      const l = new ParentNode(i, null, null, left);
      left.left = l;
      left = l;
      const r = new ParentNode(-i, null, null, right);
      right.right = r;
      right = r;
    }
    expect(lowestCommonAncestor(left, right).val).toBe(0);
    expect(lowestCommonAncestor(right, left).val).toBe(0);
  });
});
