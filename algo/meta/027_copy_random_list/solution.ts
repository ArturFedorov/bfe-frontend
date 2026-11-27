export class RandomNode {
  constructor(
    public val: number,
    public next: RandomNode | null = null,
    public random: RandomNode | null = null,
  ) {}
}

/** Returns a deep copy of a linked list whose nodes also carry a `random` pointer. */
export function copyRandomList(head: RandomNode | null): RandomNode | null {
  // Interleave A -> A' -> B -> B' so that orig.random.next is the copy of random.
  for (let node = head; node; ) {
    const copy = new RandomNode(node.val, node.next);
    node.next = copy;
    node = copy.next;
  }
  for (let node = head; node; ) {
    const copy = node.next as RandomNode;
    copy.random = node.random ? node.random.next : null;
    node = copy.next;
  }

  // Unweave, restoring the original list.
  const dummy = new RandomNode(0);
  let tail = dummy;
  for (let node = head; node; ) {
    const copy = node.next as RandomNode;
    node.next = copy.next;
    tail.next = copy;
    tail = copy;
    node = node.next;
  }
  tail.next = null;
  return dummy.next;
}
