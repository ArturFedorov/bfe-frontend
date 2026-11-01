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

export type PartnerTier = 'standard' | 'premium';

export interface Partner {
  id: string;
  name: string;
  email: string;
  tier: PartnerTier;
}

export type PartnerStore = Map<string, Partner>;

/**
 * A `/partners` resource over an injected in-memory store. `nextId` supplies
 * ids so tests stay deterministic. Exact status-code contract in README.
 */
export function createPartnersHandler(
  store: PartnerStore,
  nextId: () => string,
): Handler {
  throw new Error('Not implemented');
}
