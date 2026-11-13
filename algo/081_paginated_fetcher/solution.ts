/**
 * 081. Paginated Fetcher with Prefetch — reference solution
 *
 * paginate(fetchPage)
 *   An `async function*` is lazy by nature: its body does not run until the
 *   consumer's first `next()`. The body keeps a single `pending` promise —
 *   the fetch for the page we are about to yield. Loop:
 *     1. await `pending` (a rejection here propagates to the consumer's
 *        awaiting `next()`, which is exactly the required error semantics);
 *     2. immediately start fetching the next page if `nextCursor` is non-null
 *        and stash it in `pending` — this is the one-page prefetch, kicked off
 *        BEFORE any item of the current page is yielded;
 *     3. yield the current page's items in order.
 *   When the consumer stops (break / `return()` / `take`), the generator is
 *   closed while suspended at a `yield`, so step 2 never runs again: nothing
 *   beyond the already in-flight prefetch is ever requested. We attach a
 *   no-op `catch` to the prefetch so that a prefetch that rejects after the
 *   consumer has gone away is not reported as an unhandled rejection; the
 *   `await pending` on the original promise still sees the rejection when the
 *   consumer does reach that page.
 *
 * take(source, n)
 *   Pulls items manually from the async iterator until `n` are collected or
 *   the source reports `done`, then calls `return()` to close the iterator if
 *   it has not already finished. `n <= 0` short-circuits without touching the
 *   source at all. Works with any AsyncIterable, not just `paginate`.
 *
 * Time: O(total items yielded). Space: O(one page) for paginate, O(n) for take.
 */

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
export async function* paginate<T>(
  fetchPage: FetchPage<T>,
): AsyncGenerator<T, void, undefined> {
  // First fetch is issued here — i.e. only once the consumer calls next().
  let pending: Promise<Page<T>> | null = fetchPage(null);

  while (pending !== null) {
    const page: Page<T> = await pending;

    // Prefetch exactly one page ahead, before yielding anything from this one.
    if (page.nextCursor !== null) {
      pending = fetchPage(page.nextCursor);
      // Swallow a rejection that nobody ends up awaiting (consumer stopped);
      // `await pending` above still observes it if the consumer continues.
      pending.catch(() => {});
    } else {
      pending = null;
    }

    for (const item of page.items) {
      yield item;
    }
  }
}

/**
 * Collects the first n items from an async iterable, then closes it (calls
 * return()) — even mid-page. Returns fewer items if the source ends early;
 * take(source, 0) resolves [] without pulling anything.
 */
export async function take<T>(
  source: AsyncIterable<T>,
  n: number,
): Promise<T[]> {
  const out: T[] = [];
  if (n <= 0) return out;

  const iterator = source[Symbol.asyncIterator]();
  let finished = false;

  try {
    while (out.length < n) {
      const result = await iterator.next();
      if (result.done) {
        finished = true;
        break;
      }
      out.push(result.value);
    }
  } finally {
    // Close the source (stops any further fetching) unless it already ended.
    if (!finished) await iterator.return?.();
  }

  return out;
}
