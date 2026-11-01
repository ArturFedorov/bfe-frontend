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

/**
 * `GET /deliveries` with AND-ed exact filters, multi-field sort, and keyset
 * cursor pagination that stays stable under concurrent inserts. Cursor
 * design documented in the README.
 */
export function createDeliveriesHandler(store: DeliveryStore): Handler {
  throw new Error('Not implemented');
}
