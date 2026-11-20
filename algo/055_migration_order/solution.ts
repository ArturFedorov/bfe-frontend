export type DependencyGraph = Record<string, string[]>;

class MinHeap {
  private readonly items: string[] = [];

  get size(): number {
    return this.items.length;
  }

  push(value: string): void {
    const items = this.items;
    items.push(value);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent] <= items[i]) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop(): string {
    const items = this.items;
    const top = items[0];
    const last = items.pop()!;
    if (items.length === 0) return top;

    items[0] = last;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < items.length && items[left] < items[smallest]) smallest = left;
      if (right < items.length && items[right] < items[smallest])
        smallest = right;
      if (smallest === i) break;
      [items[smallest], items[i]] = [items[i], items[smallest]];
      i = smallest;
    }
    return top;
  }
}

/**
 * Returns the unique deterministic migration order: a migration is ready once
 * all of its dependencies are emitted, and among ready migrations the
 * lexicographically smallest id is always emitted first.
 * Throws an Error if the graph contains a cycle.
 */
export function migrationOrder(graph: DependencyGraph): string[] {
  const pending = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const id of Object.keys(graph)) {
    pending.set(id, 0);
    dependents.set(id, []);
  }
  for (const [id, deps] of Object.entries(graph)) {
    for (const dep of new Set(deps)) {
      pending.set(id, pending.get(id)! + 1);
      dependents.get(dep)!.push(id);
    }
  }

  // Kahn's algorithm with a min-heap ready set gives the unique smallest order.
  const ready = new MinHeap();
  for (const [id, count] of pending) if (count === 0) ready.push(id);

  const order: string[] = [];
  while (ready.size > 0) {
    const id = ready.pop();
    order.push(id);

    for (const dependent of dependents.get(id)!) {
      const remaining = pending.get(dependent)! - 1;
      pending.set(dependent, remaining);
      if (remaining === 0) ready.push(dependent);
    }
  }

  if (order.length !== pending.size)
    throw new Error('Dependency cycle detected');

  return order;
}
