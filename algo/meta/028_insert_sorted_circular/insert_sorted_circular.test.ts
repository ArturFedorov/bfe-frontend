import { insert } from './insert_sorted_circular';
import { ListNode } from '../_shared/structures';

/** Builds a circular list from `values` and returns the node at `headIndex`. */
function buildCircular(values: number[], headIndex = 0): ListNode | null {
  if (values.length === 0) return null;
  const nodes = values.map((v) => new ListNode(v));
  nodes.forEach((n, i) => (n.next = nodes[(i + 1) % nodes.length]));
  return nodes[headIndex];
}

/** Reads one lap of a circular list starting at `start`; throws if it never returns. */
function circularToArray(start: ListNode, limit = 200_000): number[] {
  const out: number[] = [];
  let node: ListNode | null = start;
  do {
    if (node === null) throw new Error('List is not circular');
    if (out.length >= limit) throw new Error('Did not return to start');
    out.push(node.val);
    node = node.next;
  } while (node !== start);
  return out;
}

/** True if `values` read around the circle is a rotation of a sorted array. */
function isSortedRotation(values: number[]): boolean {
  let drops = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > values[(i + 1) % values.length]) drops++;
  }
  return drops <= 1;
}

function expectInserted(
  values: number[],
  headIndex: number,
  insertVal: number,
): void {
  const head = buildCircular(values, headIndex);
  const result = insert(head, insertVal);
  if (head !== null) expect(result === head).toBe(true);

  const after = circularToArray(result);
  expect(after).toHaveLength(values.length + 1);
  expect(isSortedRotation(after)).toBe(true);
  expect([...after].sort((a, b) => a - b)).toEqual(
    [...values, insertVal].sort((a, b) => a - b),
  );
}

describe('insert (sorted circular list)', () => {
  it('inserts in the middle when head is not the minimum', () => {
    const head = buildCircular([3, 4, 1]) as ListNode;
    const result = insert(head, 2);
    expect(result).toBe(head);
    expect(circularToArray(result)).toEqual([3, 4, 1, 2]);
  });

  it('creates a self-loop for an empty list', () => {
    const result = insert(null, 1);
    expect(result.val).toBe(1);
    expect(result.next).toBe(result);
  });

  it('inserts into a single-node list', () => {
    const head = buildCircular([1]) as ListNode;
    const result = insert(head, 0);
    expect(result).toBe(head);
    expect(circularToArray(result)).toEqual([1, 0]);
    expect(head.next?.next).toBe(head);
  });

  it('inserts a new maximum at the wrap point', () => {
    const head = buildCircular([3, 5, 1], 0) as ListNode;
    insert(head, 6);
    expect(circularToArray(head)).toEqual([3, 5, 6, 1]);
  });

  it('inserts a new minimum at the wrap point', () => {
    const head = buildCircular([3, 5, 1], 0) as ListNode;
    insert(head, 0);
    expect(circularToArray(head)).toEqual([3, 5, 0, 1]);
  });

  it('inserts into a list where all values are equal (larger value)', () => {
    expectInserted([3, 3, 3], 1, 5);
  });

  it('inserts into a list where all values are equal (smaller value)', () => {
    expectInserted([3, 3, 3], 0, 1);
  });

  it('inserts a value equal to the uniform values', () => {
    expectInserted([2, 2, 2, 2], 2, 2);
  });

  it('inserts a duplicate of an existing value', () => {
    expectInserted([1, 3, 3, 5], 0, 3);
  });

  it('works for every choice of starting node', () => {
    const values = [-5, -1, 0, 0, 4, 9];
    for (let h = 0; h < values.length; h++) {
      for (const x of [-10, -5, -2, 0, 2, 9, 12]) expectInserted(values, h, x);
    }
  });

  it('inserts when the head is the maximum and the value fits right after the minimum', () => {
    const head = buildCircular([9, 1, 4], 0) as ListNode;
    insert(head, 2);
    expect(circularToArray(head)).toEqual([9, 1, 2, 4]);
  });

  it('handles a large list without looping forever', () => {
    const n = 100_000;
    const values = Array.from({ length: n }, (_, i) => i * 2);
    expectInserted(values, n / 2, 1);
    expectInserted(new Array<number>(n).fill(7), 123, 8);
  });
});
