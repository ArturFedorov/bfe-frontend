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

/**
 * Stripe-style Idempotency-Key wrapper: at-most-once handler execution per
 * key within the TTL, replaying the stored response to retries. Conflicting
 * payload under the same key → 422. 5xx responses are never stored.
 */
export function withIdempotency(
  handler: Handler,
  options: IdempotencyOptions = {},
): Handler {
  throw new Error('Not implemented');
}
