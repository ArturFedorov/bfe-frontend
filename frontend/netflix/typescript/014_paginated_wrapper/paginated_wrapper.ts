export interface Paginated<T, Meta = undefined> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  meta: Meta;
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): Paginated<T> {
  throw new Error('Not implemented');
}

export function mapPaginated<T, U, Meta>(
  page: Paginated<T, Meta>,
  fn: (item: T, index: number) => U
): Paginated<U, Meta> {
  throw new Error('Not implemented');
}
