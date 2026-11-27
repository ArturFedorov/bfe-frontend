import { ListNode } from '../_shared/structures';

/** Inserts `insertVal` into a sorted circular list and returns the given head (or the new node if empty). */
export function insert(head: ListNode | null, insertVal: number): ListNode {
  if (head === null) {
    const node = new ListNode(insertVal);
    node.next = node;
    return node;
  }

  let prev = head;
  let curr = head.next as ListNode;
  // One lap at most: stop between two nodes that bracket insertVal, at the
  // wrap point (max -> min) for a new extreme, or after a full lap (all equal).
  for (;;) {
    if (prev.val <= insertVal && insertVal <= curr.val) break;
    if (
      prev.val > curr.val &&
      (insertVal >= prev.val || insertVal <= curr.val)
    ) {
      break;
    }
    prev = curr;
    curr = curr.next as ListNode;
    if (prev === head) break;
  }

  prev.next = new ListNode(insertVal, curr);
  return head;
}
