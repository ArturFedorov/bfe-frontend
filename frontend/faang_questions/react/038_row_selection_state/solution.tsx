import { ReactElement, useCallback, useReducer, useState } from 'react';

export interface Row {
  id: string;
  name: string;
}

export interface SelectionState {
  selectedIds: ReadonlySet<string>;
}

export type SelectionAction =
  | { type: 'toggleRow'; id: string }
  | { type: 'togglePage'; pageIds: readonly string[] }
  | { type: 'selectAll'; allIds: readonly string[] }
  | { type: 'clearAll' };

export const initialSelectionState: SelectionState = {
  selectedIds: new Set<string>(),
};

/**
 * Pure reducer over an immutable Set of selected ids.
 * Every change allocates a NEW Set: React bails out of re-renders by reference
 * equality, so mutating in place would leave the UI stale.
 */
export function selectionReducer(
  state: SelectionState,
  action: SelectionAction,
): SelectionState {
  switch (action.type) {
    case 'toggleRow': {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { selectedIds: next };
    }

    case 'togglePage': {
      // Gmail semantics: if the whole visible page is selected, deselect ONLY
      // those ids; otherwise select all of them. Other pages are untouched.
      const next = new Set(state.selectedIds);
      const allSelected = action.pageIds.every((id) => next.has(id));
      for (const id of action.pageIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return { selectedIds: next };
    }

    case 'selectAll':
      // "Select all N" spans every page, unlike togglePage.
      return { selectedIds: new Set(action.allIds) };

    case 'clearAll':
      return { selectedIds: new Set<string>() };
  }
}

export type HeaderCheckboxState = 'all' | 'some' | 'none';

export function getHeaderState(
  selectedIds: ReadonlySet<string>,
  pageIds: readonly string[],
): HeaderCheckboxState {
  const count = pageIds.filter((id) => selectedIds.has(id)).length;
  if (count === 0) return 'none'; // also covers an empty page
  return count === pageIds.length ? 'all' : 'some';
}

interface SelectableTableProps {
  rows: readonly Row[];
  pageSize?: number;
}

/**
 * Thin wiring around the reducer: page state, derived page ids, and a header
 * checkbox whose `indeterminate` flag is set imperatively through a ref
 * callback (it is a DOM property, not an HTML attribute, so JSX cannot set it).
 */
export function SelectableTable({ rows, pageSize = 3 }: SelectableTableProps): ReactElement {
  const [page, setPage] = useState(0);
  const [{ selectedIds }, dispatch] = useReducer(selectionReducer, initialSelectionState);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const pageIds = visibleRows.map((row) => row.id);
  const headerState = getHeaderState(selectedIds, pageIds);

  // Re-created whenever headerState changes, so React re-invokes it with the
  // element and the DOM property is kept in sync.
  const headerRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = headerState === 'some';
    },
    [headerState],
  );

  return (
    <div>
      <div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'selectAll', allIds: rows.map((row) => row.id) })}
        >
          Select all {rows.length}
        </button>
        <button type="button" onClick={() => dispatch({ type: 'clearAll' })}>
          Clear
        </button>
        <span role="status">{selectedIds.size} selected</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>
              <input
                ref={headerRef}
                type="checkbox"
                aria-label="Select page"
                checked={headerState === 'all'}
                onChange={() => dispatch({ type: 'togglePage', pageIds })}
              />
            </th>
            <th>Job</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={row.name}
                  checked={selectedIds.has(row.id)}
                  onChange={() => dispatch({ type: 'toggleRow', id: row.id })}
                />
              </td>
              <td>{row.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          Page {page + 1} of {pageCount}
        </span>
        <button
          type="button"
          disabled={page === pageCount - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
