export type Schema =
  | { type: 'string' | 'number' | 'boolean' }
  | { type: 'object'; properties: Record<string, Schema>; required?: string[] }
  | { type: 'array'; items: Schema };

export interface ValidationError {
  path: string; // e.g. 'user.age' or 'items[0]'
  message: string;
}

/**
 * Validate `value` against `schema`, returning a list of typed errors with
 * dotted/bracketed paths. An empty array means valid.
 */
export function validate(value: unknown, schema: Schema): ValidationError[] {
  // TODO: implement
  throw new Error('Not implemented');
}
