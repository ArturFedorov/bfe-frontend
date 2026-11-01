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

export type Next = () => Promise<ApiResponse>;

export type Middleware = (
  req: ApiRequest,
  next: Next,
) => ApiResponse | Promise<ApiResponse>;

export type ErrorMiddleware = (
  err: unknown,
  req: ApiRequest,
) => ApiResponse | Promise<ApiResponse>;

/**
 * Compose middlewares around a terminal handler, koa-onion style. `next()`
 * resolves with the downstream response; a thrown error anywhere skips the
 * rest of the chain and lands in `errorMiddleware` (or rejects if absent).
 */
export function compose(
  middlewares: Middleware[],
  handler: Handler,
  errorMiddleware?: ErrorMiddleware,
): (req: ApiRequest) => Promise<ApiResponse> {
  throw new Error('Not implemented');
}
