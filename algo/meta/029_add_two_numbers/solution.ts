import { ListNode } from '../_shared/structures';

/** Adds two non-negative integers stored as reversed digit lists. */
export function addTwoNumbers(
  l1: ListNode | null,
  l2: ListNode | null,
): ListNode | null {
  const dummy = new ListNode(0);
  let tail = dummy;
  let carry = 0;
  // Keep going while either list has digits or a carry remains.
  while (l1 || l2 || carry) {
    const sum = (l1?.val ?? 0) + (l2?.val ?? 0) + carry;
    carry = sum >= 10 ? 1 : 0;
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    l1 = l1?.next ?? null;
    l2 = l2?.next ?? null;
  }
  return dummy.next;
}
