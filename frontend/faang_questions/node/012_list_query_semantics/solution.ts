/**
 * Reference solution for 012 — list query semantics.
 *
 * Filter, sort by a composite key that always ends in `id asc`, then return
 * the items strictly after the cursor's key. The cursor carries the sort spec
 * and the last item's key, so it names a position, not an offset.
 */
export interface ApiRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export type Handler = (req: ApiRequest) => ApiResponse | Promise<ApiResponse>;

export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface Delivery {
  id: string;
  partnerId: string;
  status: DeliveryStatus;
  createdAt: number;
}

export type DeliveryStore = Map<string, Delivery>;

export interface DeliveriesPage {
  items: Delivery[];
  nextCursor: string | null;
}

type SortField = 'createdAt' | 'status' | 'partnerId' | 'id';
type Direction = 'asc' | 'desc';
type KeyValue = string | number;

interface SortTerm {
  field: SortField;
  direction: Direction;
}

interface Cursor {
  s: string;
  k: KeyValue[];
}

const SORT_FIELDS: readonly SortField[] = [
  'createdAt',
  'status',
  'partnerId',
  'id',
];
const QUERY_PARAMS = new Set([
  'partnerId',
  'status',
  'sort',
  'limit',
  'cursor',
]);
const DEFAULT_LIMIT = 10;
const TIEBREAKER: SortTerm = { field: 'id', direction: 'asc' };

class BadRequest extends Error {}

const badRequest = (error: string): ApiResponse => ({
  status: 400,
  body: { error },
});

const isSortField = (value: string): value is SortField =>
  (SORT_FIELDS as readonly string[]).includes(value);

function parseSort(raw: string | undefined): SortTerm[] {
  if (raw === undefined) return [{ field: 'createdAt', direction: 'asc' }];

  return raw.split(',').map((part) => {
    const [field, direction = 'asc'] = part.trim().split(':');
    if (!isSortField(field))
      throw new BadRequest(`Unknown sort field: ${field}`);
    if (direction !== 'asc' && direction !== 'desc') {
      throw new BadRequest(`Invalid sort direction: ${direction}`);
    }
    return { field, direction };
  });
}

function parseLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_LIMIT;
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
    throw new BadRequest('Invalid limit');
  }
  return Number(raw);
}

const encodeSpec = (terms: SortTerm[]): string =>
  terms.map(({ field, direction }) => `${field}:${direction}`).join(',');

const encodeCursor = (cursor: Cursor): string =>
  Buffer.from(JSON.stringify(cursor)).toString('base64url');

function decodeCursor(raw: string, keyFields: SortField[]): Cursor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequest('Invalid cursor');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new BadRequest('Invalid cursor');
  }
  const { s, k } = parsed as Record<string, unknown>;
  const validKey =
    Array.isArray(k) &&
    k.length === keyFields.length &&
    k.every(
      (value, i) =>
        typeof value === (keyFields[i] === 'createdAt' ? 'number' : 'string'),
    );
  if (typeof s !== 'string' || !validKey)
    throw new BadRequest('Invalid cursor');

  return { s, k: k as KeyValue[] };
}

const keyOf = (item: Delivery, terms: SortTerm[]): KeyValue[] =>
  terms.map(({ field }) => item[field]);

function compareKeys(a: KeyValue[], b: KeyValue[], terms: SortTerm[]): number {
  for (let i = 0; i < terms.length; i++) {
    if (a[i] === b[i]) continue;
    const order = a[i] < b[i] ? -1 : 1;
    return terms[i].direction === 'asc' ? order : -order;
  }
  return 0;
}

function listDeliveries(
  store: DeliveryStore,
  query: Record<string, string>,
): DeliveriesPage {
  const unknown = Object.keys(query).find((name) => !QUERY_PARAMS.has(name));
  if (unknown !== undefined) {
    throw new BadRequest(`Unknown query parameter: ${unknown}`);
  }

  const sort = parseSort(query.sort);
  const limit = parseLimit(query.limit);
  const spec = encodeSpec(sort);
  const terms = [...sort, TIEBREAKER];

  let after: KeyValue[] | null = null;
  if (query.cursor !== undefined) {
    const cursor = decodeCursor(
      query.cursor,
      terms.map(({ field }) => field),
    );
    if (cursor.s !== spec) throw new BadRequest('Cursor does not match sort');
    after = cursor.k;
  }

  const matching = [...store.values()]
    .filter(
      (item) =>
        (query.partnerId === undefined || item.partnerId === query.partnerId) &&
        (query.status === undefined || item.status === query.status),
    )
    .map((item) => ({ item, key: keyOf(item, terms) }))
    .filter(({ key }) => after === null || compareKeys(key, after, terms) > 0)
    .sort((a, b) => compareKeys(a.key, b.key, terms));

  const page = matching.slice(0, limit);
  const hasMore = matching.length > limit;
  const last = page[page.length - 1];

  return {
    items: page.map(({ item }) => item),
    nextCursor: hasMore ? encodeCursor({ s: spec, k: last.key }) : null,
  };
}

export function createDeliveriesHandler(store: DeliveryStore): Handler {
  return (req) => {
    if (req.method !== 'GET' || req.path !== '/deliveries') {
      return { status: 404, body: { error: 'Not Found' } };
    }

    try {
      return { status: 200, body: listDeliveries(store, req.query) };
    } catch (error) {
      if (error instanceof BadRequest) return badRequest(error.message);
      throw error;
    }
  };
}
