/** Set of distinct integers with O(1) insert, remove and uniform getRandom. */
export class RandomizedSet {
  private readonly values: number[] = [];
  private readonly indexOf = new Map<number, number>();

  /** Adds `val`; returns true if it was not already present. */
  insert(val: number): boolean {
    if (this.indexOf.has(val)) return false;
    this.indexOf.set(val, this.values.length);
    this.values.push(val);
    return true;
  }

  /** Removes `val`; returns true if it was present. */
  remove(val: number): boolean {
    const idx = this.indexOf.get(val);
    if (idx === undefined) return false;
    // Move the last element into the hole, then pop — keeps the array dense.
    const last = this.values[this.values.length - 1];
    this.values[idx] = last;
    this.indexOf.set(last, idx);
    this.values.pop();
    this.indexOf.delete(val);
    return true;
  }

  /** Returns a uniformly random element (set is non-empty). */
  getRandom(): number {
    return this.values[Math.floor(Math.random() * this.values.length)];
  }
}
