import { ReactElement } from 'react';

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
  // TODO: implement — always return a new Set on change; togglePage deselects
  // the visible ids only when ALL of them are already selected.
  throw new Error('Not implemented');
}

export type HeaderCheckboxState = 'all' | 'some' | 'none';

export function getHeaderState(
  selectedIds: ReadonlySet<string>,
  pageIds: readonly string[],
): HeaderCheckboxState {
  // TODO: implement
  throw new Error('Not implemented');
}

interface SelectableTableProps {
  rows: readonly Row[];
  pageSize?: number;
}

export function SelectableTable({ rows, pageSize = 3 }: SelectableTableProps): ReactElement {
  // TODO: implement — page state + selection reducer; header checkbox labeled
  // "Select page" (checked when 'all', el.indeterminate when 'some'), a row
  // checkbox per row labeled with the row name, "Select all {rows.length}",
  // "Clear", "Previous"/"Next" buttons, "{n} selected" and
  // "Page {x} of {y}" indicators.
  throw new Error('Not implemented');
}
