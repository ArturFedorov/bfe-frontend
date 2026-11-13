import React, { ReactElement, useEffect, useRef, useState } from 'react';

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

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** none -> ascending -> descending -> none */
export function nextSortDirection(current: SortDirection): SortDirection {
  switch (current) {
    case 'none':
      return 'ascending';
    case 'ascending':
      return 'descending';
    default:
      return 'none';
  }
}

/**
 * Stable sort. Numbers compare numerically, strings with localeCompare.
 * `null` returns the rows in their original order.
 */
export function sortRows(rows: readonly Row[], sort: SortState | null): Row[] {
  if (!sort) return [...rows];
  const sign = sort.direction === 'ascending' ? 1 : -1;
  const compare = (a: string | number, b: string | number): number => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  };
  // Array.prototype.sort is stable (ES2019+), so equal keys keep their order.
  return [...rows].sort((a, b) => sign * compare(a[sort.key], b[sort.key]));
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
  const from = orderedIds.indexOf(anchorId);
  const to = orderedIds.indexOf(targetId);
  if (from === -1 || to === -1) return [targetId];
  return orderedIds.slice(Math.min(from, to), Math.max(from, to) + 1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Active cell: the row is stored by id (positions are derived), the column by index. */
interface ActiveCell {
  rowId: string | null;
  col: number;
}

interface ResizeDrag {
  key: string;
  pointerId: number;
  startX: number;
  startWidth: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Spreadsheet-style grid: sortable headers, resizable columns, roving
 * tabindex, range selection by id and paging.
 *
 * Selection is fully controlled (`selection` / `onSelectionChange`), never
 * copied into state. Sort, page, widths, the active cell and the range anchor
 * are internal. The active cell and the anchor are stored as *ids* — their
 * positions are derived from the current sorted order on every render, so
 * sorting or paging cannot leave them pointing at the wrong row.
 */
export function DataGrid({
  rows,
  columns,
  pageSize = 10,
  selection,
  onSelectionChange,
}: DataGridProps): ReactElement {
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(0);
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.width ?? DEFAULT_COLUMN_WIDTH])),
  );
  const [active, setActive] = useState<ActiveCell>({ rowId: null, col: 0 });
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const resizeDrag = useRef<ResizeDrag | null>(null);
  const cellRefs = useRef(new Map<string, HTMLTableCellElement>());
  const focusPending = useRef(false);

  // --- derived order / page --------------------------------------------------
  const sorted = sortRows(rows, sort);
  const orderedIds = sorted.map((r) => r.id);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageIndex = clamp(page, 0, pageCount - 1);
  const pageRows = sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Column 0 is the selection cell; data columns follow.
  const colCount = columns.length + 1;
  const activeCol = clamp(active.col, 0, colCount - 1);
  // Fall back to the first row of the page when the active row is not on it.
  const activeRowIndex = Math.max(
    0,
    pageRows.findIndex((r) => r.id === active.rowId),
  );
  const activeRow = pageRows[activeRowIndex] ?? null;

  const cellKey = (rowId: string, col: number) => `${rowId}\u0000${col}`;
  const widthOf = (key: string) => widths[key] ?? DEFAULT_COLUMN_WIDTH;

  // Move DOM focus to the active cell after a keyboard move (also across pages).
  useEffect(() => {
    if (!focusPending.current || !activeRow) return;
    focusPending.current = false;
    cellRefs.current.get(cellKey(activeRow.id, activeCol))?.focus();
  });

  // --- selection ------------------------------------------------------------
  const toggleRow = (id: string) => {
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
    setAnchorId(id);
  };

  const selectRangeTo = (id: string) => {
    if (anchorId === null || !orderedIds.includes(anchorId)) {
      toggleRow(id);
      return;
    }
    // Range in the *displayed* order (across pages), added to prior selections.
    const next = new Set(selection);
    for (const rangeId of rangeBetween(orderedIds, anchorId, id)) next.add(rangeId);
    onSelectionChange(next);
  };

  const onCheckboxClick = (e: React.MouseEvent<HTMLInputElement>, id: string) => {
    if (e.shiftKey) selectRangeTo(id);
    else toggleRow(id);
  };

  // --- sorting --------------------------------------------------------------
  const cycleSort = (key: string) => {
    const current: SortDirection = sort?.key === key ? sort.direction : 'none';
    const next = nextSortDirection(current);
    setSort(next === 'none' ? null : { key, direction: next });
  };

  // --- column resize ---------------------------------------------------------
  const setWidth = (key: string, width: number) =>
    setWidths((prev) => ({ ...prev, [key]: Math.max(MIN_COLUMN_WIDTH, width) }));

  const onHandleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setWidth(key, widthOf(key) + RESIZE_STEP);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setWidth(key, widthOf(key) - RESIZE_STEP);
    }
  };

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>, key: string) => {
    resizeDrag.current = { key, pointerId: e.pointerId, startX: e.clientX, startWidth: widthOf(key) };
    // Not available in jsdom; in browsers it keeps the drag alive outside the handle.
    if (typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = resizeDrag.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setWidth(drag.key, drag.startWidth + (e.clientX - drag.startX));
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = resizeDrag.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (typeof e.currentTarget.releasePointerCapture === 'function') {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resizeDrag.current = null;
  };

  // --- keyboard navigation (on the body, not window) ------------------------
  const moveTo = (rowId: string, col: number) => {
    focusPending.current = true;
    setActive({ rowId, col });
  };

  const goToPage = (nextPage: number) => {
    const target = clamp(nextPage, 0, pageCount - 1);
    const nextRows = sorted.slice(target * pageSize, (target + 1) * pageSize);
    const row = nextRows[Math.min(activeRowIndex, nextRows.length - 1)];
    setPage(target);
    if (row) moveTo(row.id, activeCol);
  };

  const onBodyKeyDown = (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
    // The checkbox handles its own Space; never double-fire from here.
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (!activeRow) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        moveTo(activeRow.id, clamp(activeCol + 1, 0, colCount - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveTo(activeRow.id, clamp(activeCol - 1, 0, colCount - 1));
        break;
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        const row = pageRows[clamp(activeRowIndex + step, 0, pageRows.length - 1)];
        moveTo(row.id, activeCol);
        break;
      }
      case 'Home':
        e.preventDefault();
        moveTo(activeRow.id, 0);
        break;
      case 'End':
        e.preventDefault();
        moveTo(activeRow.id, colCount - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        goToPage(pageIndex + 1);
        break;
      case 'PageUp':
        e.preventDefault();
        goToPage(pageIndex - 1);
        break;
      case ' ':
        if (activeCol === 0) {
          e.preventDefault();
          toggleRow(activeRow.id);
        }
        break;
    }
  };

  // --- render ---------------------------------------------------------------
  const registerCell = (key: string) => (el: HTMLTableCellElement | null) => {
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };

  return (
    <div>
      <div role="status" aria-live="polite">
        {selection.size} selected
      </div>

      <table role="grid" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead data-sticky="true">
          <tr role="row">
            <th role="columnheader" scope="col" style={{ width: 32 }}>
              <span className="visually-hidden">Selection</span>
            </th>
            {columns.map((column) => {
              const width = widthOf(column.key);
              const ariaSort = column.sortable
                ? sort?.key === column.key
                  ? sort.direction
                  : 'none'
                : undefined;
              return (
                <th
                  key={column.key}
                  role="columnheader"
                  scope="col"
                  aria-sort={ariaSort}
                  style={{ width: `${width}px`, position: 'relative' }}
                >
                  {column.sortable ? (
                    <button type="button" onClick={() => cycleSort(column.key)}>
                      {column.header}
                    </button>
                  ) : (
                    column.header
                  )}
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${column.header} column`}
                    aria-valuenow={width}
                    aria-valuemin={MIN_COLUMN_WIDTH}
                    tabIndex={0}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 6,
                      height: '100%',
                      cursor: 'col-resize',
                      touchAction: 'none',
                    }}
                    onKeyDown={(e) => onHandleKeyDown(e, column.key)}
                    onPointerDown={(e) => onHandlePointerDown(e, column.key)}
                    onPointerMove={onHandlePointerMove}
                    onPointerUp={onHandlePointerUp}
                    onPointerCancel={onHandlePointerUp}
                  />
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody onKeyDown={onBodyKeyDown}>
          {pageRows.map((row, rowIndex) => {
            const selected = selection.has(row.id);
            const isActiveRow = rowIndex === activeRowIndex;
            return (
              <tr key={row.id} role="row" aria-selected={selected}>
                <td
                  role="gridcell"
                  ref={registerCell(cellKey(row.id, 0))}
                  tabIndex={isActiveRow && activeCol === 0 ? 0 : -1}
                  onClick={() => setActive({ rowId: row.id, col: 0 })}
                >
                  <input
                    type="checkbox"
                    tabIndex={-1}
                    aria-label={`Select row ${row.id}`}
                    checked={selected}
                    onClick={(e) => onCheckboxClick(e, row.id)}
                    // Controlled by the `selection` prop; the click handler reports
                    // the change (it needs `shiftKey`, which onChange lacks).
                    onChange={() => {}}
                  />
                </td>
                {columns.map((column, i) => {
                  const col = i + 1;
                  return (
                    <td
                      key={column.key}
                      role="gridcell"
                      ref={registerCell(cellKey(row.id, col))}
                      tabIndex={isActiveRow && activeCol === col ? 0 : -1}
                      style={{ width: `${widthOf(column.key)}px` }}
                      onClick={() => setActive({ rowId: row.id, col })}
                    >
                      {row[column.key]}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div>
        <button type="button" onClick={() => setPage(pageIndex - 1)} disabled={pageIndex === 0}>
          Previous
        </button>
        <span>
          Page {pageIndex + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
