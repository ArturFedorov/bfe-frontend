import { ReactElement } from 'react';

export interface FilterDefaults {
  status: string;
  region: string;
  search: string;
}

export interface FilterState {
  status: string;
  region: string;
  search: string;
  defaults: FilterDefaults;
}

export type FilterAction =
  | { type: 'setStatus'; status: string }
  | { type: 'setRegion'; region: string }
  | { type: 'setSearch'; search: string }
  | { type: 'clearAll' };

export const DEFAULT_FILTERS: FilterDefaults = {
  status: 'all',
  region: 'all',
  search: '',
};

export function createInitialFilterState(
  defaults: FilterDefaults = DEFAULT_FILTERS,
): FilterState {
  // TODO: implement
  throw new Error('Not implemented');
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  // TODO: implement
  throw new Error('Not implemented');
}

interface FilterBarProps {
  defaults?: FilterDefaults;
  statusOptions?: readonly string[];
  regionOptions?: readonly string[];
}

export function FilterBar({
  defaults = DEFAULT_FILTERS,
  statusOptions = ['all', 'active', 'paused'],
  regionOptions = ['all', 'amer', 'emea', 'apac'],
}: FilterBarProps): ReactElement {
  // TODO: implement — one useReducer, labeled Status/Region selects,
  // a labeled Search input, and a "Clear all" button.
  throw new Error('Not implemented');
}
