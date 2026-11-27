import { copyRandomList, RandomNode } from './copy_random_list';

type Encoded = Array<[number, number | null]>;

/** Builds a list from LeetCode's [[val, randomIndex | null], ...] format. */
function build(encoded: Encoded): RandomNode | null {
  const nodes = encoded.map(([val]) => new RandomNode(val));
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].next = nodes[i + 1] ?? null;
    const r = encoded[i][1];
    nodes[i].random = r === null ? null : nodes[r];
  }
  return nodes[0] ?? null;
}

function toNodes(head: RandomNode | null): RandomNode[] {
  const out: RandomNode[] = [];
  for (let n = head; n; n = n.next) {
    if (out.length > 200_000) throw new Error('List too long or cyclic');
    out.push(n);
  }
  return out;
}

/** Inverse of build. */
function encode(head: RandomNode | null): Encoded {
  const nodes = toNodes(head);
  const index = new Map<RandomNode, number>();
  nodes.forEach((n, i) => index.set(n, i));
  return nodes.map((n) => {
    if (n.random === null) return [n.val, null];
    const r = index.get(n.random);
    if (r === undefined) throw new Error('random points outside the list');
    return [n.val, r];
  });
}

/** toEqual on 10^5-element arrays is slow; compare large encodings as JSON. */
function expectEncoding(actual: Encoded, expected: Encoded): void {
  if (expected.length > 1000) {
    expect(JSON.stringify(actual) === JSON.stringify(expected)).toBe(true);
  } else {
    expect(actual).toEqual(expected);
  }
}

/** Copies the list, then asserts it is a correct, fully independent deep copy. */
function expectDeepCopy(encoded: Encoded): void {
  const head = build(encoded);
  const originalNodes = toNodes(head);
  const copy = copyRandomList(head);

  expectEncoding(encode(copy), encoded);
  const original = new Set(originalNodes);
  const shared = toNodes(copy).filter((n) => original.has(n));
  expect(shared).toHaveLength(0);
  // Original list is unchanged (same nodes in the same order, same pointers).
  const after = toNodes(head);
  expect(after).toHaveLength(originalNodes.length);
  expect(after.every((n, i) => n === originalNodes[i])).toBe(true);
  expectEncoding(encode(head), encoded);
}

describe('copyRandomList', () => {
  it('copies the LeetCode example 1', () => {
    expectDeepCopy([
      [7, null],
      [13, 0],
      [11, 4],
      [10, 2],
      [1, 0],
    ]);
  });

  it('copies the LeetCode example 2', () => {
    expectDeepCopy([
      [1, 1],
      [2, 1],
    ]);
  });

  it('copies the LeetCode example 3', () => {
    expectDeepCopy([
      [3, null],
      [3, 0],
      [3, null],
    ]);
  });

  it('returns null for an empty list', () => {
    expect(copyRandomList(null)).toBeNull();
  });

  it('copies a single node with no random', () => {
    expectDeepCopy([[5, null]]);
  });

  it('copies a single node whose random points to itself', () => {
    const head = build([[5, 0]]);
    const copy = copyRandomList(head);
    expect(copy).not.toBe(head);
    expect(copy?.random).toBe(copy);
    expect(copy?.next).toBeNull();
    expect(head?.random).toBe(head);
  });

  it('copies random pointers that point backwards and forwards', () => {
    expectDeepCopy([
      [1, 3],
      [2, 0],
      [3, 3],
      [4, 1],
    ]);
  });

  it('copies a list where every random is null', () => {
    expectDeepCopy([
      [-1, null],
      [0, null],
      [10000, null],
    ]);
  });

  it('copies nodes with duplicate values by identity, not by value', () => {
    expectDeepCopy([
      [2, 2],
      [2, 0],
      [2, 1],
      [2, null],
    ]);
  });

  it('copies a 10^5-node list without recursion overflow', () => {
    const n = 100_000;
    const encoded: Encoded = [];
    for (let i = 0; i < n; i++) {
      encoded.push([i % 1000, i % 3 === 0 ? null : (i * 7919) % n]);
    }
    expectDeepCopy(encoded);
  });
});
