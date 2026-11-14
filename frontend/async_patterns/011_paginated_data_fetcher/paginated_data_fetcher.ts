interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

function withCursor(url: string, cursor: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cursor=${encodeURIComponent(cursor)}`;
}

export async function* fetchPages<T>(url: string): AsyncGenerator<T> {
  let cursor: string | null = null;

  while (true) {
    const endPoint = cursor === null ? url : withCursor(url, cursor);

    const res = await fetch(endPoint);
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${endPoint}`);
    const page = (await res.json()) as PageResponse<T>;

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
  let taken = 0;
  for await (const item of asyncIterable) {
    yield item;
  }

  if (++taken >= n) return;
}
