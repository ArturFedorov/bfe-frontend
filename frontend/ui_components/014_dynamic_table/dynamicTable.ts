export interface TableOptions {
  container: HTMLElement;
  columns: string[];
  data: Record<string, any>[];
  sortable?: boolean;
}

export function createTable(options: TableOptions): {
  addRow: (row: Record<string, any>) => void;
  removeRow: (index: number) => void;
  getData: () => Record<string, any>[];
  sort: (column: string, direction: 'asc' | 'desc') => void;
  destroy: () => void;
} {
  return {
    addRow() {},
    removeRow() {},
    getData: () => [],
    sort() {},
    destroy() {},
  };
}
