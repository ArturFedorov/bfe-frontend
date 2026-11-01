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

export interface CatalogItem {
  id: string;
  title: string;
  genre: string;
}

export type CatalogStore = Map<string, CatalogItem>;

/**
 * Strong ETag: SHA-256 hex of the canonical (sorted-keys) JSON
 * representation, wrapped in double quotes. (`crypto.createHash` is your
 * friend.)
 */
export function computeEtag(value: unknown): string {
  throw new Error('Not implemented');
}

/**
 * `/catalog/:id` with conditional requests: If-None-Match → 304 on reads,
 * mandatory If-Match on writes (428 when absent, 412 on mismatch) for
 * lost-update protection.
 */
export function createCatalogHandler(store: CatalogStore): Handler {
  throw new Error('Not implemented');
}
