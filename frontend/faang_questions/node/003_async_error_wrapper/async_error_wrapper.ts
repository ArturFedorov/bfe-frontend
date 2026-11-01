export class OperationalError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    // TODO: implement — keep `instanceof` working for subclasses
    throw new Error('Not implemented');
  }
}

export class NotFoundError extends OperationalError {
  constructor(message: string) {
    // TODO: implement
    super(message, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends OperationalError {
  constructor(message: string) {
    // TODO: implement
    super(message, 'VALIDATION', 400);
  }
}

export interface FormattedError {
  code: string;
  message: string;
  statusCode: number;
}

export interface OkResult<T> {
  ok: true;
  value: T;
}

export interface ErrorResult {
  ok: false;
  error: FormattedError;
}

export type HandlerResult<T> = OkResult<T> | ErrorResult;

/** Type guard: true only for real OperationalError instances (no duck typing). */
export function isOperationalError(err: unknown): err is OperationalError {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Wraps an async handler so that operational errors become formatted
 * `{ ok: false, error }` results while programmer errors (anything that is
 * not an OperationalError) are rethrown unchanged — same reference — so the
 * process can crash and be restarted by its supervisor.
 */
export function withErrorHandling<Args extends unknown[], T>(
  handler: (...args: Args) => Promise<T> | T,
): (...args: Args) => Promise<HandlerResult<T>> {
  // TODO: implement
  throw new Error('Not implemented');
}
