import {ReactElement, useCallback, useReducer, useState} from 'react';

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

export function selectionReducer(
  state: SelectionState,
  action: SelectionAction,
): SelectionState {
  switch (action.type) {
    case "toggleRow":
      const newState = { selectedIds: new Set(state.selectedIds) };
      const rowSelected = state.selectedIds.has(action.id);
      if (rowSelected) {
        newState.selectedIds.delete(action.id);
      } else {
        newState.selectedIds.add(action.id);
      }

      return newState;

    case "togglePage":
      const next = new Set(state.selectedIds);
      const allSelected = action.pageIds.every((id) => next.has(id));
      for(const id of action.pageIds) {
        if(allSelected) next.delete(id);
        else next.add(id);
      }

      return { selectedIds: next };

    case "selectAll":
      return { selectedIds: new Set(action.allIds) };

    case "clearAll":
      return { selectedIds: new Set() }
  }
}

export type HeaderCheckboxState = 'all' | 'some' | 'none';

export function getHeaderState(
  selectedIds: ReadonlySet<string>,
  pageIds: readonly string[],
): HeaderCheckboxState {
  const count = pageIds.filter((id) => selectedIds.has(id)).length;
  if(count === 0) return 'none';
  return count === pageIds.length ? 'all' : 'some';
}

interface SelectableTableProps {
  rows: readonly Row[];
  pageSize?: number;
}

export function SelectableTable({ rows, pageSize = 3 }: SelectableTableProps): ReactElement {
  const [page, setPage] = useState<number>(0);
  const [{ selectedIds }, dispatch] = useReducer(selectionReducer, initialSelectionState);
  const numberOfPages = Math.max(1, Math.ceil(rows.length/pageSize));
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleRows = rows.slice(startIndex, endIndex);
  const pageIds = visibleRows.map((row) => row.id);
  const headerState = getHeaderState(selectedIds, pageIds);

  const headerRef = useCallback((el: HTMLInputElement | null) => {
    if(el) el.indeterminate = headerState === 'some';
  }, [headerState])

  return (
    <div>
      <div>
        <button type="button" onClick={() => dispatch({ type: 'selectAll', allIds: rows.map(({ id }) => id) })}>
          Select all {rows.length}
        </button>
        <button type="button" onClick={() => dispatch({ type: 'clearAll'})}>
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
        <span>Page {page + 1} of {numberOfPages}</span>
        <button type="button" disabled={page === numberOfPages - 1} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
