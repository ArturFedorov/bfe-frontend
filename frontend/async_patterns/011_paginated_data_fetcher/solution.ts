/**
 * Reference solution for 011 — paginated data fetcher.
 *
 * `fetchPages` walks a cursor-paginated API lazily: a page is only requested
 * when the consumer has drained the previous one. `take` is a generic
 * "first n" adapter over ANY async iterable.
 */
interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

/** Append `?cursor=` (or `&cursor=` if the URL already has a query string). */
function withCursor(url: string, cursor: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cursor=${encodeURIComponent(cursor)}`;
}

export async function* fetchPages<T>(url: string): AsyncGenerator<T> {
  let cursor: string | null = null;

  while (true) {
    // First request: the bare URL. Subsequent requests: the cursor as a query param.
    const endpoint = cursor === null ? url : withCursor(url, cursor);

    // A rejected fetch (or a non-2xx response) throws out of `next()` and
    // therefore out of the consumer's `for await` loop — that IS the propagation.
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${endpoint}`);
    const page = (await res.json()) as PageResponse<T>;

    // Stop conditions: an empty page, or no cursor for the next one.
    if (page.items.length === 0) return;

    for (const item of page.items) {
      yield item;
    }

    if (page.nextCursor === null) return;
    cursor = page.nextCursor;
  }
}

export async function* take<T>(
  n: number,
  asyncIterable: AsyncIterable<T>,
): AsyncGenerator<T> {
  if (n <= 0) return; // never touch the source at all

  let taken = 0;
  for await (const item of asyncIterable) {
    yield item;
    // Check AFTER yielding, BEFORE pulling again: the source is never advanced
    // past the n-th item. Leaving the loop via `return` also calls the source
    // iterator's `return()`, so a generator source is closed, not abandoned.
    if (++taken >= n) return;
  }
}
