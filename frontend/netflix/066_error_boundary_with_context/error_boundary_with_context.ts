export interface SerializedError {
  name: string;
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Base error for CLI tools: carries a stable `code` and arbitrary `context`,
 * and serializes via `toJSON()` for structured logging. Remember to restore the
 * prototype chain so `instanceof` works after transpilation.
 */
export class AppError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    // TODO: set name/code/context and fix the prototype chain
    throw new Error('Not implemented');
  }

  toJSON(): SerializedError {
    // TODO: implement
    throw new Error('Not implemented');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('VALIDATION', message, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('NOT_FOUND', message, context);
  }
}
