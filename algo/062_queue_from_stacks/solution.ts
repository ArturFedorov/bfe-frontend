/**
 * 062. Queue From Stacks — reference solution
 *
 * Inbound stack takes pushes; outbound stack serves pops. Elements are moved
 * from inbound to outbound only when outbound is empty, so each element is
 * moved at most once.
 *
 * Time: amortized O(1) per operation. Space: O(n).
 */
export class QueueFromStacks<T> {
  private readonly inbound: T[] = [];
  private readonly outbound: T[] = [];

  enqueue(task: T): void {
    this.inbound.push(task);
  }

  dequeue(): T {
    this.refill();
    return this.outbound.pop() as T;
  }

  peek(): T {
    this.refill();
    return this.outbound[this.outbound.length - 1];
  }

  size(): number {
    return this.inbound.length + this.outbound.length;
  }

  private refill(): void {
    if (this.outbound.length === 0) {
      while (this.inbound.length > 0) {
        this.outbound.push(this.inbound.pop() as T);
      }
    }
    if (this.outbound.length === 0) {
      throw new Error('Queue is empty');
    }
  }
}
