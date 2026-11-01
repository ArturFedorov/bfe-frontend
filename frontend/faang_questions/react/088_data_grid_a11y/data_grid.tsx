import { ReactElement } from 'react';

export interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  /** Initial width in px. Default 120. */
  width?: number;
}

export type Row = { id: string; [key: string]: string | number };

export type SortDirection = 'ascending' | 'descending' | 'none';

export interface SortState {
  key: string;
  direction: Exclude<SortDirection, 'none'>;
}

export interface DataGridProps {
  rows: readonly Row[];
  columns: readonly Column[];
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** Controlled selection, keyed by row id. */
  selection: ReadonlySet<string>;
  onSelectionChange: (next: Set<string>) => void;
}

export const DEFAULT_COLUMN_WIDTH = 120;
export const MIN_COLUMN_WIDTH = 40;
export const RESIZE_STEP = 10;

/** none -> ascending -> descending -> none */
export function nextSortDirection(current: SortDirection): SortDirection {
  throw new Error('Not implemented');
}

/**
 * Stable sort. Numbers compare numerically, strings with localeCompare.
 * `null` returns the rows in their original order.
 */
export function sortRows(rows: readonly Row[], sort: SortState | null): Row[] {
  throw new Error('Not implemented');
}

/**
 * Inclusive slice of `orderedIds` between `anchorId` and `targetId`, in either
 * direction. Returns `[targetId]` when the anchor is not in the list.
 */
export function rangeBetween(
  orderedIds: readonly string[],
  anchorId: string,
  targetId: string,
): string[] {
  throw new Error('Not implemented');
}

export function DataGrid(props: DataGridProps): ReactElement {
  throw new Error('Not implemented');
}
