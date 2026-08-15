export interface GridCell<T> {
  row: number;
  col: number;
  value: T;
}

export class SparseGrid<T> {
  set(row: number, col: number, value: T): void {
    // TODO: implement
    throw new Error('Not implemented');
  }

  get(row: number, col: number): T | undefined {
    // TODO: implement
    throw new Error('Not implemented');
  }

  delete(row: number, col: number): boolean {
    // TODO: implement
    throw new Error('Not implemented');
  }

  size(): number {
    // TODO: implement
    throw new Error('Not implemented');
  }

  cells(): GridCell<T>[] {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
