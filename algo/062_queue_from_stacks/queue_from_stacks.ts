/**
 * FIFO queue built on exactly two LIFO stacks (arrays used with push/pop only —
 * no shift/unshift/splice).
 *
 * - `enqueue` pushes onto the inbound stack.
 * - `dequeue`/`peek` serve from the outbound stack, tipping the inbound stack
 *   over into it only when it runs dry — amortized O(1) per operation.
 * - `dequeue` and `peek` throw an Error when the queue is empty.
 */
export class QueueFromStacks<T> {
  enqueue(task: T): void {
    // TODO: implement
    throw new Error('Not implemented');
  }

  dequeue(): T {
    // TODO: implement
    throw new Error('Not implemented');
  }

  peek(): T {
    // TODO: implement
    throw new Error('Not implemented');
  }

  size(): number {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
