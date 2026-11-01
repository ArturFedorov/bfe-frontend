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

export type FieldType = 'string' | 'number' | 'boolean';

export interface FieldSpec {
  type: FieldType;
  required?: boolean;
}

export interface ValidationSchema {
  body?: Record<string, FieldSpec>;
  query?: Record<string, FieldSpec>;
}

export interface FieldError {
  path: string;
  code: 'required' | 'invalid_type' | 'unknown_field' | 'not_coercible';
  message: string;
}

export interface ValidatedData {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
}

export type ValidatedHandler = (
  req: ApiRequest,
  data: ValidatedData,
) => ApiResponse | Promise<ApiResponse>;

/**
 * Declarative request validation: schema in, 400-with-per-field-errors out.
 * Body values are type-checked (never coerced); query values are coerced
 * from strings. On success the handler receives `{ body, query }`.
 */
export function withValidation(
  schema: ValidationSchema,
  handler: ValidatedHandler,
): Handler {
  throw new Error('Not implemented');
}
