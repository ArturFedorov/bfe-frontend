import { ReactElement, ReactNode, Ref } from 'react';

export type ScrollAlign = 'start' | 'center';

export interface VirtualListHandle {
  scrollToIndex(index: number, align?: ScrollAlign): void;
}

export interface VirtualListProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Viewport height in px. */
  height: number;
  /** Height assumed for a row until it has been measured. */
  estimateHeight: number;
  /** Extra rows rendered above and below the viewport. Default 3. */
  overscan?: number;
  /** Stable key per item; measured heights are cached by this key. */
  getKey: (item: T) => string;
  ref?: Ref<VirtualListHandle>;
}

/**
 * Prefix sums with a leading 0: [10, 20, 30] -> [0, 10, 30, 60].
 * Length is heights.length + 1; the last entry is the total height.
 */
export function computeOffsets(heights: readonly number[]): number[] {
  throw new Error('Not implemented');
}

/**
 * Binary search: the largest index i such that offsets[i] <= scrollTop,
 * clamped to [0, heights.length - 1]. Returns 0 for an empty list.
 */
export function findStartIndex(offsets: readonly number[], scrollTop: number): number {
  throw new Error('Not implemented');
}

export function VirtualList<T>(props: VirtualListProps<T>): ReactElement {
  throw new Error('Not implemented');
}
