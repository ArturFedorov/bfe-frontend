type Entry = { dist: number; point: number[] };

/** Binary max-heap ordered by `dist`. */
class MaxHeap {
  private readonly items: Entry[] = [];

  get size(): number {
    return this.items.length;
  }

  peek(): Entry {
    return this.items[0];
  }

  push(entry: Entry): void {
    const a = this.items;
    a.push(entry);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent].dist >= a[i].dist) break;
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
    }
  }

  pop(): Entry {
    const a = this.items;
    const top = a[0];
    const last = a.pop() as Entry;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let largest = i;
        if (l < a.length && a[l].dist > a[largest].dist) largest = l;
        if (r < a.length && a[r].dist > a[largest].dist) largest = r;
        if (largest === i) break;
        [a[largest], a[i]] = [a[i], a[largest]];
        i = largest;
      }
    }
    return top;
  }

  toArray(): Entry[] {
    return [...this.items];
  }
}

/** Returns the k points closest to the origin (any order). */
export function kClosest(points: number[][], k: number): number[][] {
  // Keep the k closest seen so far; the root is the farthest of them, evicted first.
  const heap = new MaxHeap();
  for (const point of points) {
    const dist = point[0] * point[0] + point[1] * point[1];
    if (heap.size < k) heap.push({ dist, point });
    else if (dist < heap.peek().dist) {
      heap.pop();
      heap.push({ dist, point });
    }
  }
  return heap.toArray().map((e) => [...e.point]);
}
