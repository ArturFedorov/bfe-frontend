import type { ReactElement } from 'react';

export interface TransferItem {
  id: string;
  label: string;
}

export type MoveDirection = 'right' | 'left';

export interface TransferListProps {
  /** Every item, in canonical (left-side) order. */
  items: readonly TransferItem[];
  /** Ids currently on the right. Iteration order of the Set = display order on the right. */
  value: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  /** Listbox names. Defaults to `{ left: 'Available', right: 'Selected' }`. */
  titles?: { left: string; right: string };
}

export interface Partition {
  left: TransferItem[];
  right: TransferItem[];
}

/**
 * Split `items` into the two columns. `left` keeps `items` order; `right`
 * follows the insertion order of `value` (ids in `value` without an item are skipped).
 */
export function partition(items: readonly TransferItem[], value: ReadonlySet<string>): Partition {
  throw new Error('Not implemented');
}

/** Returns a NEW Set: `right` appends `ids` in the given order, `left` removes them. */
export function moveIds(
  value: ReadonlySet<string>,
  ids: readonly string[],
  direction: MoveDirection,
): Set<string> {
  throw new Error('Not implemented');
}

export function TransferList(props: TransferListProps): ReactElement {
  throw new Error('Not implemented');
}
