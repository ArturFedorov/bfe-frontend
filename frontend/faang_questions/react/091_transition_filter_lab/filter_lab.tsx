import type { JSX } from 'react';

export type FilterLabProps = {
  items: string[];
  /** Probe: called once per render of the results list with the query that render used. */
  onListRender?: (query: string) => void;
};

/** Case-insensitive substring filter. Empty query returns a copy of all items. Pure. */
export function filterItems(_items: string[], _query: string): string[] {
  throw new Error('Not implemented');
}

export function FilterLab(_props: FilterLabProps): JSX.Element {
  throw new Error('Not implemented');
}
