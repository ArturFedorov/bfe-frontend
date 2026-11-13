interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export async function* fetchPages<T>(url: string): AsyncGenerator<T> {}

export async function* take<T>(
  n: number,
  asyncIterable: AsyncIterable<T>,
): AsyncGenerator<T> {}
