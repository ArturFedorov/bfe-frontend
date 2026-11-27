import { ListNode } from '../_shared/structures';

/** Minimal binary min-heap of list nodes keyed by `val`. */
class NodeHeap {
  private items: ListNode[] = [];

  get size(): number {
    return this.items.length;
  }

  push(node: ListNode): void {
    const items = this.items;
    items.push(node);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].val <= items[i].val) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop(): ListNode {
    const items = this.items;
    const top = items[0];
    const last = items.pop() as ListNode;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && items[left].val < items[smallest].val) {
          smallest = left;
        }
        if (right < items.length && items[right].val < items[smallest].val) {
          smallest = right;
        }
        if (smallest === i) break;
        [items[smallest], items[i]] = [items[i], items[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

/** Merges k sorted linked lists into one sorted list and returns its head. */
export function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
  // Keep only the current head of each list in the heap: size <= k.
  const heap = new NodeHeap();
  for (const head of lists) if (head) heap.push(head);

  const dummy = new ListNode(0);
  let tail = dummy;
  while (heap.size > 0) {
    const node = heap.pop();
    if (node.next) heap.push(node.next);
    tail.next = node;
    tail = node;
  }
  tail.next = null;
  return dummy.next;
}
