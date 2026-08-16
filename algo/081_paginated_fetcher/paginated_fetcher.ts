export interface Page<T> {
  items: T[];
  /** Cursor for the next page, or null when this is the last page. */
  nextCursor: string | null;
}

/** Cursor API: null requests the first page. */
export type FetchPage<T> = (cursor: string | null) => Promise<Page<T>>;

/**
 * Async generator over a cursor-paginated API. Lazy start; prefetches the
 * next page as soon as the current one arrives; stops fetching once the
 * consumer stops iterating.
 */
export function paginate<T>(
  fetchPage: FetchPage<T>,
): AsyncGenerator<T, void, undefined> {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Collects the first n items from an async iterable, then closes it (calls
 * return()) — even mid-page. Returns fewer items if the source ends early;
 * take(source, 0) resolves [] without pulling anything.
 */
export function take<T>(source: AsyncIterable<T>, n: number): Promise<T[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
