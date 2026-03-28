interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export async function* fetchPages<T>(url: string): AsyncGenerator<T> {
  let cursor: string | null = null;

  while (true) {
    const endpoint = cursor ? `${url}?cursor=${cursor}` : url;
    const res = await fetch(endpoint);
    const data: PageResponse<T> = await res.json();

    if (data.items.length === 0) {
      return;
    }

    for (const item of data.items) {
      yield item;
    }

    if (data.nextCursor === null) return;
    cursor = data.nextCursor;
  }
}

export async function* take<T>(
  n: number,
  asyncIterable: AsyncIterable<T>,
): AsyncGenerator<T> {
  let count = 0;

  for await (const item of asyncIterable) {
    if (count >= n) return;
    yield item;
    count++;
  }
}
