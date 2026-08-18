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

export type RouteParams = Record<string, string>;

export type RouteHandler = (
  req: ApiRequest,
  params: RouteParams,
) => ApiResponse | Promise<ApiResponse>;

/**
 * Method + path router. Static segments beat `:param` segments; a path that
 * matches a pattern but not the method yields 405 with an `Allow` header.
 */
export class Router {
  add(method: string, pattern: string, handler: RouteHandler): this {
    throw new Error('Not implemented');
  }

  async dispatch(req: ApiRequest): Promise<ApiResponse> {
    throw new Error('Not implemented');
  }
}
