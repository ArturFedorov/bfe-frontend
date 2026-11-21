/**
 * Reference solution for 014 — idempotency keys.
 *
 * Look the key up, drop it if expired, then either replay (same fingerprint),
 * reject with 422 (different fingerprint), or run the handler and store any
 * non-5xx response.
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

export interface IdempotencyEntry {
  fingerprint: string;
  response: ApiResponse;
  storedAt: number;
}

export type IdempotencyStore = Map<string, IdempotencyEntry>;

export interface IdempotencyOptions {
  store?: IdempotencyStore;
  clock?: () => number;
  ttlMs?: number;
}

const HEADER = 'idempotency-key';
const DAY_MS = 24 * 60 * 60 * 1000;

function readKey(headers: Record<string, string>): string | undefined {
  const name = Object.keys(headers).find((h) => h.toLowerCase() === HEADER);
  return name === undefined ? undefined : headers[name];
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [
          key,
          canonicalize((value as Record<string, unknown>)[key]),
        ]),
    );
  }
  return value;
}

// JSON.stringify(undefined) is undefined; coalesce so a bodiless request
// still gets a stable fingerprint.
const fingerprintOf = (body: unknown): string =>
  JSON.stringify(canonicalize(body)) ?? '';

const replayed = (response: ApiResponse): ApiResponse => ({
  ...response,
  headers: { ...response.headers, 'Idempotency-Replayed': 'true' },
});

export function withIdempotency(
  handler: Handler,
  options: IdempotencyOptions = {},
): Handler {
  const { store = new Map(), clock = Date.now, ttlMs = DAY_MS } = options;

  return async (req) => {
    const key = readKey(req.headers);
    if (key === undefined) return handler(req);

    const fingerprint = fingerprintOf(req.body);
    const entry = store.get(key);

    if (entry !== undefined && clock() - entry.storedAt < ttlMs) {
      if (entry.fingerprint !== fingerprint) {
        return {
          status: 422,
          body: { error: 'Idempotency-Key reused with a different payload' },
        };
      }
      return replayed(entry.response);
    }
    store.delete(key);

    const response = await handler(req);
    if (response.status < 500) {
      store.set(key, { fingerprint, response, storedAt: clock() });
    }
    return response;
  };
}
