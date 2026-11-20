export interface GridCell<T> {
  row: number;
  col: number;
  value: T;
}

export class SparseGrid<T> {
  private readonly rows = new Map<number, Map<number, T>>();
  private count = 0;

  set(row: number, col: number, value: T): void {
    this.validate(row, col);

    let cols = this.rows.get(row);
    if (!cols) {
      cols = new Map();
      this.rows.set(row, cols);
    }
    if (!cols.has(col)) this.count++;
    cols.set(col, value);
  }

  get(row: number, col: number): T | undefined {
    this.validate(row, col);

    return this.rows.get(row)?.get(col);
  }

  delete(row: number, col: number): boolean {
    this.validate(row, col);

    const cols = this.rows.get(row);
    if (!cols || !cols.delete(col)) return false;

    if (cols.size === 0) this.rows.delete(row);
    this.count--;
    return true;
  }

  size(): number {
    return this.count;
  }

  cells(): GridCell<T>[] {
    const result: GridCell<T>[] = [];
    const rowKeys = [...this.rows.keys()].sort((a, b) => a - b);

    for (const row of rowKeys) {
      const cols = this.rows.get(row)!;
      const colKeys = [...cols.keys()].sort((a, b) => a - b);
      for (const col of colKeys)
        result.push({ row, col, value: cols.get(col)! });
    }

    return result;
  }

  private validate(row: number, col: number): void {
    if (!Number.isInteger(row) || row < 0 || !Number.isInteger(col) || col < 0)
      throw new RangeError('Invalid coordinates');
  }
}
