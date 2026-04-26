export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export type SortDirection = 'asc' | 'desc' | 'none';

export interface DataTableSort {
  column: string;
  direction: SortDirection;
}

export interface DataTableOptions<T extends Record<string, string | number>> {
  container: HTMLElement;
  columns: DataTableColumn[];
  data: T[];
  initialSort?: DataTableSort;
  initialFilter?: string;
}

export function createDataTable<T extends Record<string, string | number>>(
  options: DataTableOptions<T>,
): {
  setData: (data: T[]) => void;
  setFilter: (text: string) => void;
  setSort: (sort: DataTableSort) => void;
  getRows: () => T[];
  destroy: () => void;
} {
  return {
    setData() {},
    setFilter() {},
    setSort() {},
    getRows: () => [],
    destroy() {},
  };
}
