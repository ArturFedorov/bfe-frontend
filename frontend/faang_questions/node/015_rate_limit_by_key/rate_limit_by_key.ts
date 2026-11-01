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

export interface Bucket {
  tokens: number;
  updatedAt: number;
}

export type BucketStore = Map<string, Bucket>;

export interface RateLimitOptions {
  capacity: number;
  refillPerSecond: number;
  clock: () => number;
  keyHeader?: string;
  store?: BucketStore;
}

/**
 * Per-API-key token-bucket rate limiting: buckets start full, refill
 * continuously via the injected clock, and dry buckets yield 429 with a
 * whole-second Retry-After. Keyless requests are 401, not rate-limited.
 */
export function withRateLimit(
  handler: Handler,
  options: RateLimitOptions,
): Handler {
  throw new Error('Not implemented');
}
